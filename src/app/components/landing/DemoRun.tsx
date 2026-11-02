"use client";

import { useEffect, useState } from "react";
import { FiCheck } from "react-icons/fi";
import { TypePill, type CaseType } from "../ui";

// A scripted replay of the shape of a real run, used on the landing page so
// visitors see the product move without spending an LLM call.
const SPEC = "Users reset their password via an emailed link. Links expire after 30 minutes and work only once.";
const NODES = [
  { label: "Generate", kind: "LLM", ms: 2840 },
  { label: "Validate", kind: "code", ms: 3 },
  { label: "Review", kind: "LLM", ms: 2210 },
  { label: "Improve", kind: "code", ms: 2 },
];
const CASES: { id: string; type: CaseType; title: string }[] = [
  { id: "TC_1", type: "happy", title: "Valid link resets the password" },
  { id: "TC_2", type: "negative", title: "Expired link is rejected" },
  { id: "TC_3", type: "negative", title: "Used link cannot be reused" },
  { id: "TC_4", type: "edge", title: "Link opened at minute 29:59" },
  { id: "TC_5", type: "edge", title: "Two links requested back to back" },
];
const SCORE = 86;

type Phase = { typed: number; node: number; cases: number; score: boolean };

export default function DemoRun() {
  const [p, setP] = useState<Phase>({ typed: 0, node: -1, cases: 0, score: false });

  useEffect(() => {
    let cancelled = false;
    const timers: ReturnType<typeof setTimeout>[] = [];
    const at = (ms: number, fn: () => void) => timers.push(setTimeout(() => !cancelled && fn(), ms));

    const run = () => {
      setP({ typed: 0, node: -1, cases: 0, score: false });
      let t = 300;
      for (let i = 1; i <= SPEC.length; i++) at((t += 22), () => setP((s) => ({ ...s, typed: i })));
      t += 400;
      NODES.forEach((_, i) => {
        at((t += 650), () => setP((s) => ({ ...s, node: i })));
        if (i === 1) CASES.forEach((__, c) => at(t + 200 + c * 220, () => setP((s) => ({ ...s, cases: c + 1 }))));
        if (i === 1) t += CASES.length * 220;
      });
      at((t += 500), () => setP((s) => ({ ...s, node: NODES.length, score: true })));
      at(t + 4200, run);
    };
    run();
    return () => {
      cancelled = true;
      timers.forEach(clearTimeout);
    };
  }, []);

  const typing = p.typed < SPEC.length;

  return (
    <div className="panel relative overflow-hidden p-4 sm:p-5" aria-label="Animated demo of a TestMind run">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex gap-1.5" aria-hidden>
          <span className="h-3 w-3 rounded-full border border-[#111827] bg-[#f87171]" />
          <span className="h-3 w-3 rounded-full border border-[#111827] bg-accent-2" />
          <span className="h-3 w-3 rounded-full border border-[#111827] bg-[#4ade80]" />
        </div>
        <span className="rounded-full border border-line-strong px-2 py-0.5 font-mono text-[10.5px] text-muted">demo replay</span>
      </div>

      <p className="eyebrow">input spec</p>
      <p className={`mt-1 min-h-[3.2em] text-[13.5px] leading-relaxed ${typing ? "caret" : ""}`}>{SPEC.slice(0, p.typed)}</p>

      <div className="mt-4 grid grid-cols-4 gap-1.5">
        {NODES.map((n, i) => {
          const done = p.node > i;
          const active = p.node === i;
          return (
            <div
              key={n.label}
              className={`rounded-lg border-[1.5px] px-2 py-2 transition-all duration-300 ${
                done ? "border-[#111827] bg-accent text-[#1c1301] dark:border-accent" : active ? "border-accent bg-accent-soft animate-pulse-ring" : "border-line bg-panel-2"
              }`}
            >
              <p className="flex items-center gap-1 text-[11.5px] font-semibold">
                {done && <FiCheck className="animate-pop" />}
                {n.label}
              </p>
              <p className="font-mono text-[10px] opacity-70">{done ? (n.ms >= 1000 ? `${(n.ms / 1000).toFixed(1)}s` : `${n.ms}ms`) : n.kind}</p>
            </div>
          );
        })}
      </div>

      <ul className="mt-4 min-h-[188px] space-y-1.5">
        {CASES.slice(0, p.cases).map((c) => (
          <li key={c.id} className="animate-rise flex items-center gap-2.5 rounded-lg border border-line bg-panel px-2.5 py-1.5">
            <span className="font-mono text-[11px] text-muted w-9">{c.id}</span>
            <span className="flex-1 truncate text-[12.5px]">{c.title}</span>
            <TypePill type={c.type} />
          </li>
        ))}
      </ul>

      <div className={`mt-3 flex items-center justify-between rounded-lg border-[1.5px] border-dashed border-line-strong px-3 py-2 transition-opacity duration-500 ${p.score ? "opacity-100" : "opacity-0"}`}>
        <span className="text-[12.5px] font-semibold">Coverage audit score</span>
        <span className="font-display text-[22px] font-extrabold text-happy">{p.score ? SCORE : 0}<span className="text-[13px] text-muted">/100</span></span>
      </div>
    </div>
  );
}
