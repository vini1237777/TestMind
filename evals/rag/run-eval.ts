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
  const minScore = Number(process.env.RAG_MIN_SCORE) || 0.75;

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
    runAt: new Date().toISOString(),
  };

  console.log(JSON.stringify(results, null, 2));
  fs.writeFileSync(path.join(DIR, "results.json"), `${JSON.stringify(results, null, 2)}\n`);
}

main().catch((err) => {
  console.error((err as Error).message);
  process.exit(1);
});
