export type RunScore = {
  specCoverage: number;
  projectCoverage: number;
  duplicateRate: number;
  plainSteps: number;
  tokens: number;
  seconds: number;
  cases: number;
};
export type Mode = "off" | "on";
export type Run = { feature: string; mode: Mode; repeat: number; score: RunScore };
export const METRICS: (keyof RunScore)[] = [
  "specCoverage",
  "projectCoverage",
  "duplicateRate",
  "plainSteps",
  "tokens",
  "seconds",
  "cases",
];

const mean = (values: number[]) => values.reduce((sum, value) => sum + value, 0) / values.length;

// A generated case repeats a saved one above this Atlas score, a cosine of 0.85.
export const DUPLICATE_SCORE = 0.925;

// The same seed gives the same interval, so a rerun of the analysis is identical.
function seededRandom(seed: number) {
  let state = seed;
  return () => {
    state = (state * 1664525 + 1013904223) % 4294967296;
    return state / 4294967296;
  };
}

function bootstrapInterval(diffs: number[], rounds = 10_000) {
  const random = seededRandom(42);
  const means = Array.from({ length: rounds }, () =>
    mean(diffs.map(() => diffs[Math.floor(random() * diffs.length)])),
  ).sort((a, b) => a - b);
  return [means[Math.floor(rounds * 0.025)], means[Math.floor(rounds * 0.975)]];
}

// Each feature is one pair, because features differ more than repeats of one feature.
export function compare(runs: Run[], metric: keyof RunScore) {
  const features = [...new Set(runs.map((run) => run.feature))];
  const pairs = features.flatMap((feature) => {
    const of = (mode: Mode) =>
      runs.filter((run) => run.feature === feature && run.mode === mode).map((run) => run.score[metric]);
    const off = of("off");
    const on = of("on");
    return off.length && on.length ? [{ off: mean(off), on: mean(on) }] : [];
  });
  const diffs = pairs.map((pair) => pair.on - pair.off);
  const [low, high] = bootstrapInterval(diffs);
  return {
    off: mean(pairs.map((pair) => pair.off)),
    on: mean(pairs.map((pair) => pair.on)),
    difference: mean(diffs),
    interval95: [low, high],
    onHigher: diffs.filter((diff) => diff > 0).length,
    offHigher: diffs.filter((diff) => diff < 0).length,
    pairs: pairs.length,
  };
}
