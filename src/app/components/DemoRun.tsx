"use client";

import { useEffect, useState } from "react";
import { caseLabel } from "../lib/case-label";
import { EXAMPLE } from "../lib/example";

// A scripted replay shaped like a real run. It lets visitors watch the product
// work without spending an LLM call on every page view.
const FEATURE = EXAMPLE.feature;
const SPEC = EXAMPLE.description;
const NODES = [
  { label: "Generate", kind: "AI", ms: 2840 },
  { label: "Validate", kind: "code", ms: 3 },
  { label: "Review", kind: "AI", ms: 2210 },
  { label: "Improve", kind: "code", ms: 2 },
];
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
  const progress = Math.max(0, Math.min(p.node + (done ? 0 : 0.5), NODES.length)) / NODES.length;

  return (
    <div className="overflow-hidden rounded-lg border shadow-xl dark:border-gray-700" aria-label="Animated demo of a TestMind run">
      <div className="flex items-center justify-between bg-amber-300 px-3 py-1.5 text-xs text-black dark:bg-gray-200">
        <span className="font-semibold">TestMind</span>
        <span className="flex items-center gap-1.5">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-600 opacity-60" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-amber-600" />
          </span>
          demo replay
        </span>
      </div>

      <div className="space-y-3 bg-white p-4 text-sm dark:bg-gray-900">
        <div>
          <p className="text-[11px] uppercase text-gray-500">Feature</p>
          <p className="mt-1 rounded border px-2 py-1.5 text-sm dark:border-gray-700">{FEATURE}</p>
        </div>
        <div>
          <p className="text-[11px] text-gray-500">Description</p>
          <p className="mt-1 min-h-[3.6em] rounded border px-2 py-1.5 text-xs leading-relaxed dark:border-gray-700">
            {SPEC.slice(0, p.typed)}
            {typing && <span className="tm-caret" aria-hidden />}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span
            className={`rounded px-3 py-1.5 text-xs text-white transition-all duration-150 ${
              p.clicked ? "scale-95 bg-amber-600" : "bg-amber-500"
            } dark:bg-gray-200 dark:text-black`}
          >
            {p.clicked && !done ? "Generating…" : "Generate Test Cases"}
          </span>
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
            <div className="h-full rounded-full bg-amber-400 transition-[width] duration-500 ease-out" style={{ width: `${progress * 100}%` }} />
          </div>
        </div>

        <div className="grid grid-cols-4 gap-1.5">
          {NODES.map((n, i) => {
            const ok = p.node > i;
            const active = p.node === i;
            return (
              <div
                key={n.label}
                className={`rounded border px-2 py-1.5 transition-colors duration-300 ${
                  ok ? "tm-pop border-amber-300 bg-amber-50 dark:border-amber-700 dark:bg-amber-950/40" : active ? "tm-ring border-amber-300" : "border-gray-200 dark:border-gray-700"
                }`}
              >
                <p className="text-[11px] font-medium">
                  {ok && "✔ "}
                  {n.label}
                </p>
                <p className={`text-[10px] ${n.kind === "AI" ? "text-amber-600" : "text-gray-400"}`}>
                  {ok ? (n.ms >= 1000 ? `${(n.ms / 1000).toFixed(1)}s` : `${n.ms}ms`) : active ? "working…" : n.kind}
                </p>
              </div>
            );
          })}
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

        <div className={`rounded border border-amber-200 bg-amber-50 px-3 py-2 transition-opacity duration-500 dark:border-gray-700 dark:bg-gray-800 ${p.score >= 0 ? "opacity-100" : "opacity-0"}`}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold">AI review score</span>
            <span className="text-lg font-bold text-amber-600">
              {Math.max(p.score, 0)}
              <span className="text-xs font-normal text-gray-500">/100</span>
            </span>
          </div>
          <ul className="mt-1 space-y-0.5">
            {GAPS.slice(0, p.gaps).map((g) => (
              <li key={g} className="tm-slide text-[11px] text-gray-600 dark:text-gray-300">
                + Missing: {g}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
