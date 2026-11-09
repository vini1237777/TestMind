import assert from "node:assert/strict";
import { test } from "node:test";
import { compare, strictlyCovered, type Mode, type Run } from "../../evals/rag-quality/metrics";

const run = (feature: string, mode: Mode, value: number): Run => ({
  feature,
  mode,
  repeat: 0,
  score: { specCoverage: value, projectCoverage: 0, duplicateRate: 0, plainSteps: 0, tokens: 0, seconds: 0, cases: 0 },
});

test("compares each feature with itself and averages its repeats", () => {
  const result = compare(
    [run("a", "off", 0), run("a", "off", 1), run("a", "on", 1), run("b", "off", 0.5), run("b", "on", 0.5)],
    "specCoverage",
  );
  assert.equal(result.off, 0.5);
  assert.equal(result.on, 0.75);
  assert.equal(result.difference, 0.25);
  assert.equal(result.onHigher, 1);
  assert.equal(result.offHigher, 0);
  assert.equal(result.pairs, 2);
});

test("a feature missing one mode is left out", () => {
  const result = compare([run("a", "off", 0), run("a", "on", 1), run("b", "on", 1)], "specCoverage");
  assert.equal(result.pairs, 1);
});

test("the interval is repeatable and holds the difference", () => {
  const runs = ["a", "b", "c", "d"].flatMap((name, i) => [run(name, "off", 0), run(name, "on", i / 4)]);
  const first = compare(runs, "specCoverage");
  assert.deepEqual(first.interval95, compare(runs, "specCoverage").interval95);
  assert.ok(first.interval95[0] <= first.difference && first.difference <= first.interval95[1]);
});

test("a rule with a number needs that number in the cases", () => {
  const rule = "A cart holds at most 10 units";
  assert.equal(strictlyCovered(rule, true, "Only 10 units can be added"), true);
  assert.equal(strictlyCovered(rule, true, "The limit is reached"), false);
  assert.equal(strictlyCovered(rule, true, "Add 100 units"), false);
  assert.equal(strictlyCovered(rule, false, "Only 10 units can be added"), false);
  assert.equal(strictlyCovered("Refunds use the original method", true, "Anything"), true);
});
