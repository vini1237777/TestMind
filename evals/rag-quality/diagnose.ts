import "@/src/worker/load-env";
import fs from "node:fs";
import path from "node:path";
import type { TestCase } from "@/src/app/types/testmind";
import { semanticCacheText } from "@/src/lib/ai/cache/semantic-cache";
import { embedTexts } from "@/src/lib/ai/embeddings";
import { chunkText } from "@/src/lib/ai/rag/chunks";
import { selectContext } from "@/src/lib/ai/rag/retrieve";
import { atlasScore } from "../rag/metrics";
import { strictlyCovered } from "./metrics";

// Splits missed project rules into two causes: the saved case holding the rule was
// not retrieved, or it was retrieved and the model did not use it.
const DIR = path.join(process.cwd(), "evals/rag-quality");
const read = (name: string) => JSON.parse(fs.readFileSync(path.join(DIR, name), "utf8"));
const runsFile = process.argv[2] ?? "results-runs.json";

async function main() {
  const dataset = read("dataset.json") as {
    saved: (TestCase & { title: string })[];
    features: { featureName: string; description: string; projectRules: string[] }[];
  };
  const sources = read("rule-sources.json") as Record<string, string>;
  const runs = read(runsFile) as {
    feature: string;
    mode: string;
    testCases: TestCase[];
    verdicts: { project: { rule: string; covered: boolean }[] };
  }[];

  const missing = dataset.features.flatMap((f) => f.projectRules).filter((rule) => !sources[rule]);
  if (missing.length) throw new Error(`Rules without a source: ${missing.join("; ")}`);

  const savedTexts = dataset.saved.map(chunkText);
  const savedVectors = await embedTexts(savedTexts);
  const queries = await embedTexts(
    dataset.features.map((f) => semanticCacheText(f.featureName, f.description)),
  );

  const retrieved = new Map(
    dataset.features.map((feature, index) => {
      const ranked = savedTexts
        .map((text, i) => ({ text, score: atlasScore(queries[index], savedVectors[i]) }))
        .sort((a, b) => b.score - a.score);
      return [feature.featureName, { top5: selectContext(ranked.slice(0, 5)).map((r) => r.text), ranked }];
    }),
  );

  const rows = dataset.features.flatMap((feature) =>
    feature.projectRules.map((rule) => {
      const source = dataset.saved.find((item) => item.title === sources[rule])!;
      const text = chunkText(source);
      const info = retrieved.get(feature.featureName)!;
      const onRuns = runs.filter((run) => run.feature === feature.featureName && run.mode === "on");
      const hits = onRuns.filter((run) => {
        const cases = run.testCases.map((c) => [c.title, ...c.steps, c.expected].join(" ")).join(" ");
        const verdict = run.verdicts.project.find((item) => item.rule === rule);
        return verdict && strictlyCovered(rule, verdict.covered, cases);
      }).length;
      return {
        feature: feature.featureName,
        rule,
        inContext: info.top5.includes(text),
        rank: info.ranked.findIndex((item) => item.text === text) + 1,
        score: Number(info.ranked.find((item) => item.text === text)!.score.toFixed(3)),
        covered: hits,
        runs: onRuns.length,
      };
    }),
  );

  const group = (flag: boolean) => {
    const part = rows.filter((row) => row.inContext === flag);
    const hits = part.reduce((sum, row) => sum + row.covered, 0);
    const total = part.reduce((sum, row) => sum + row.runs, 0);
    return { rules: part.length, covered: hits, runs: total, share: total ? hits / total : 0 };
  };
  console.log(JSON.stringify({ inContext: group(true), notInContext: group(false) }, null, 1));
  for (const row of [...rows].sort((a, b) => a.covered - b.covered)) {
    console.log(`${row.inContext ? "IN " : "OUT"} ${row.covered}/${row.runs} rank ${row.rank} score ${row.score} | ${row.feature} | ${row.rule}`);
  }
}

main().catch((err) => {
  console.error((err as Error).message);
  process.exit(1);
});
