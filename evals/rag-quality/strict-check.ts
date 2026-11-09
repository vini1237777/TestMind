import fs from "node:fs";
import path from "node:path";
import { compare, strictlyCovered, type Run } from "./metrics";

// Runs on saved results and makes no paid call.
type Verdict = { rule: string; covered: boolean };
type SavedRun = Run & {
  testCases: { title: string; steps: string[]; expected: string }[];
  verdicts: { spec: Verdict[]; project: Verdict[] };
};

const DIR = path.join(process.cwd(), "evals/rag-quality");
const name = process.argv[2] ?? "results";
const runs = JSON.parse(fs.readFileSync(path.join(DIR, `${name}-runs.json`), "utf8")) as SavedRun[];

const strict: Run[] = runs.map((run) => {
  const text = run.testCases.map((item) => [item.title, ...item.steps, item.expected].join(" ")).join(" ");
  const rules = run.verdicts.project;
  const hits = rules.filter((item) => strictlyCovered(item.rule, item.covered, text)).length;
  return { ...run, score: { ...run.score, projectCoverage: hits / rules.length } };
});

const numbered = strict.map((run, index) => {
  const original = runs[index];
  const text = original.testCases.map((item) => [item.title, ...item.steps, item.expected].join(" ")).join(" ");
  const rules = original.verdicts.project.filter((item) => /\d/.test(item.rule));
  const hits = rules.filter((item) => strictlyCovered(item.rule, item.covered, text)).length;
  return { ...run, score: { ...run.score, projectCoverage: rules.length ? hits / rules.length : 0 } };
});

const output = {
  strictProjectCoverage: compare(strict, "projectCoverage"),
  numberedRulesOnly: compare(numbered, "projectCoverage"),
};
fs.writeFileSync(path.join(DIR, `${name}-strict.json`), `${JSON.stringify(output, null, 2)}\n`);
console.log(JSON.stringify(output, null, 2));
