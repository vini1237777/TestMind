"use client";

import { useEffect, useState } from "react";
import { caseLabel } from "../lib/case-label";
import { EXAMPLE } from "../lib/example";

// A scripted replay shaped like a real run. It lets visitors watch the product
// work without spending an LLM call on every page view.
const FEATURE = EXAMPLE.feature;
const SPEC = EXAMPLE.description;
// What the status line says while each step runs.
const STATUS = ["Writing test cases", "Checking them", "Reviewing coverage", "Adding what was missing"];
const NODES = [
  { ms: 2840 }, // write cases
  { ms: 3 }, // check them
  { ms: 2210 }, // review coverage
  { ms: 2 }, // merge
];
const TOTAL_MS = NODES.reduce((s, n) => s + n.ms, 0);
type CaseType = "HAPPY" | "NEGATIVE" | "EDGE";
const CASES: { id: string; type: CaseType; title: string }[] = [
  { id: "TC_1", type: "HAPPY", title: "Valid link lets the user set a new password" },
  { id: "TC_2", type: "NEGATIVE", title: "Expired link is rejected with a clear message" },
  { id: "TC_3", type: "NEGATIVE", title: "A used link cannot be opened again" },
  { id: "TC_4", type: "EDGE", title: "Link opened at 29 minutes 59 seconds" },
  { id: "TC_5", type: "EDGE", title: "Two links requested back to back" },
];
const SCORE = 86;
const GAPS = ["Rate limit on reset requests", "Reset while already logged in"];


type Phase = { typed: number; clicked: boolean; node: number; cases: number; score: number; gaps: number };
const START: Phase = { typed: 0, clicked: false, node: -1, cases: 0, score: -1, gaps: 0 };

export default function DemoRun() {
  const [p, setP] = useState<Phase>(START);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
       
      setP({ typed: SPEC.length, clicked: true, node: NODES.length, cases: CASES.length, score: SCORE, gaps: GAPS.length });
      return;
    }

    let cancelled = false;
    const timers: ReturnType<typeof setTimeout>[] = [];
    const at = (ms: number, fn: () => void) => timers.push(setTimeout(() => !cancelled && fn(), ms));
    const set = (patch: Partial<Phase>) => setP((s) => ({ ...s, ...patch }));

    const run = () => {
      setP(START);
      let t = 500;
      for (let i = 1; i <= SPEC.length; i++) at((t += 24), () => set({ typed: i }));
      at((t += 450), () => set({ clicked: true }));
      t += 250;

      NODES.forEach((_, i) => {
        at((t += 700), () => set({ node: i }));
        // Cases land once Validate has passed.
        if (i === 1) {
          CASES.forEach((__, c) => at(t + 250 + c * 230, () => set({ cases: c + 1 })));
          t += CASES.length * 230;
        }
      });
      at((t += 650), () => set({ node: NODES.length }));

      // Count the score up, then reveal the gaps the review found.
      for (let s = 0; s <= SCORE; s += 2) at(t + s * 12, () => set({ score: Math.min(s, SCORE) }));
      at((t += SCORE * 12 + 30), () => set({ score: SCORE }));
      GAPS.forEach((_, g) => at(t + 300 + g * 250, () => set({ gaps: g + 1 })));

      at(t + 5200, run);
    };
    run();
    return () => {
      cancelled = true;
      timers.forEach(clearTimeout);
    };
  }, []);

  const typing = p.typed < SPEC.length;
  const done = p.node >= NODES.length;

  return (
    <div className="overflow-hidden rounded-lg border shadow-xl dark:border-gray-700" aria-label="Animated demo of a TestMind run">
      <div className="flex items-center justify-between bg-amber-300 px-3 py-1.5 text-xs text-black dark:bg-gray-200">
        <span className="font-semibold">TestMind</span>
        <span className="opacity-70">Recording</span>
      </div>

      <div className="space-y-3 bg-white p-4 text-sm dark:bg-gray-900">
        <div>
          <p className="text-[11px] text-gray-500">Feature</p>
          <p className="mt-1 rounded border px-2 py-1.5 text-sm dark:border-gray-700">{FEATURE}</p>
        </div>
        <div>
          <p className="text-[11px] text-gray-500">Description</p>
          <p className="mt-1 min-h-[3.6em] rounded border px-2 py-1.5 text-xs leading-relaxed dark:border-gray-700">
            {SPEC.slice(0, p.typed)}
            {typing && <span className="tm-caret" aria-hidden />}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span
            className={`rounded px-3 py-1.5 text-xs text-white transition-all duration-150 ${
              p.clicked && !done ? "scale-95 bg-amber-600" : "bg-amber-500"
            } dark:bg-gray-200 dark:text-black`}
          >
            Generate Test Cases
          </span>
          {p.clicked && (
            <span className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-300" aria-live="polite">
              {done ? (
                <>
                  <span aria-hidden className="text-amber-600">✓</span>
                  Done
                  <span className="text-gray-400">in {(TOTAL_MS / 1000).toFixed(1)}s</span>
                </>
              ) : (
                <>
                  <span aria-hidden className="h-3 w-3 animate-spin rounded-full border-2 border-amber-500 border-t-transparent" />
                  {STATUS[Math.max(p.node, 0)]}
                  <span className="tm-dots" aria-hidden />
                </>
              )}
            </span>
          )}
        </div>

        <ul className="min-h-[170px] space-y-1.5">
          {CASES.slice(0, p.cases).map((c) => (
            <li key={c.id} className="tm-rise flex items-center gap-2 rounded border px-2.5 py-1.5 dark:border-gray-700">
              <span className="w-4 text-right text-[11px] tabular-nums text-gray-400">{CASES.indexOf(c) + 1}.</span>
              <span className="flex-1 truncate text-xs">{c.title}</span>
              <span className="text-[11px] text-gray-500">{caseLabel(c.type)}</span>
            </li>
          ))}
        </ul>

        <div className={`border-t pt-3 text-xs transition-opacity duration-500 dark:border-gray-700 ${p.score >= 0 ? "opacity-100" : "opacity-0"}`}>
          <p className="flex items-baseline justify-between">
            <span className="font-medium">Review</span>
            <span className="tabular-nums">
              <span className="text-base font-semibold">{SCORE}</span>
              <span className="text-gray-400"> / 100</span>
            </span>
          </p>
          <p className={`mt-0.5 text-gray-600 transition-opacity duration-500 dark:text-gray-300 ${p.gaps > 0 ? "opacity-100" : "opacity-0"}`}>
            Not covered yet: {GAPS.join(", ").toLowerCase()}.
          </p>
        </div>
      </div>
    </div>
  );
}
