import "@/src/worker/load-env";
import fs from "node:fs";
import path from "node:path";
import { embedTexts } from "@/src/lib/ai/embeddings";
import {
  atlasScore,
  hitAt,
  mean,
  recallAt,
  type EvalCase,
  type EvalQuery,
  type Ranked,
} from "./metrics";

// Ranks with the same model, filter and score formula as the live search, but in
// this process. It measures the embeddings and the threshold, not Atlas itself.
const DIR = path.join(process.cwd(), "evals/rag");
const BATCH_SIZE = 50;
const THRESHOLDS = [0.65, 0.68, 0.7, 0.72, 0.75, 0.78];

async function embedAll(texts: string[]) {
  const vectors: number[][] = [];
  for (let i = 0; i < texts.length; i += BATCH_SIZE) {
    vectors.push(...(await embedTexts(texts.slice(i, i + BATCH_SIZE))));
  }
  return vectors;
}

async function main() {
  const { cases, queries } = JSON.parse(
    fs.readFileSync(path.join(DIR, "dataset.json"), "utf8"),
  ) as { cases: EvalCase[]; queries: EvalQuery[] };

  const caseVectors = await embedAll(cases.map((item) => item.text));
  const queryVectors = await embedAll(queries.map((item) => item.text));

  const rows = queries.map((query, index) => {
    const ranked: Ranked[] = cases
      .map((item, caseIndex) => ({ item, vector: caseVectors[caseIndex] }))
      .filter(({ item }) => item.project === query.project)
      .map(({ item, vector }) => ({
        id: item.id,
        score: atlasScore(queryVectors[index], vector),
      }))
      .sort((a, b) => b.score - a.score);
    return { query, ranked };
  });

  const answerable = rows.filter(({ query }) => query.relevant.length > 0);
  const unrelated = rows.filter(({ query }) => query.relevant.length === 0);
  const minScore = Number(process.env.RAG_MIN_SCORE) || 0.72;

  const results = {
    model: "text-embedding-3-small",
    dimensions: 256,
    cases: cases.length,
    answerableQueries: answerable.length,
    unrelatedQueries: unrelated.length,
    hitAt3: mean(answerable.map(({ query, ranked }) => hitAt(ranked, query.relevant, 3))),
    recallAt5: mean(answerable.map(({ query, ranked }) => recallAt(ranked, query.relevant, 5))),
    minScore,
    // How often weak context would be dropped, and how often good context would be lost.
    unrelatedWithContext: unrelated.filter(({ ranked }) => ranked[0].score >= minScore).length,
    answerableWithoutContext: answerable.filter(({ ranked }) => ranked[0].score < minScore).length,
    lowestTopScoreAnswerable: Math.min(...answerable.map(({ ranked }) => ranked[0].score)),
    highestTopScoreUnrelated: Math.max(...unrelated.map(({ ranked }) => ranked[0].score)),
    // What would reach the prompt at each score: top 5 results at or above it.
    thresholds: THRESHOLDS.map((score) => {
      const kept = rows.map(({ query, ranked }) => ({
        query,
        kept: ranked.slice(0, 5).filter((item) => item.score >= score),
      }));
      const fromAnswerable = kept.filter(({ query }) => query.relevant.length > 0);
      const sent = fromAnswerable.flatMap(({ query, kept: items }) =>
        items.map((item) => query.relevant.includes(item.id)),
      );
      return {
        score,
        answerableWithContext: fromAnswerable.filter(({ kept: items }) => items.length > 0).length,
        unrelatedWithContext: kept.filter(
          ({ query, kept: items }) => query.relevant.length === 0 && items.length > 0,
        ).length,
        casesSent: sent.length,
        relevantShare: sent.length ? sent.filter(Boolean).length / sent.length : 0,
        recall: mean(
          fromAnswerable.map(({ query, kept: items }) =>
            recallAt(items, query.relevant, 5),
          ),
        ),
      };
    }),
    runAt: new Date().toISOString(),
  };

  console.log(JSON.stringify(results, null, 2));
  fs.writeFileSync(path.join(DIR, "results.json"), `${JSON.stringify(results, null, 2)}\n`);
}

main().catch((err) => {
  console.error((err as Error).message);
  process.exit(1);
});
