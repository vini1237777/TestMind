"use client";

import { useEffect, useState } from "react";
import type { TestCase } from "@/src/app/types/testmind";

export type CaseType = "happy" | "negative" | "edge";
export const CASE_TYPES: CaseType[] = ["happy", "negative", "edge"];

export function caseType(tc: Pick<TestCase, "type">): CaseType {
  const t = String(tc.type || "").toLowerCase();
  return t === "negative" || t === "edge" ? t : "happy";
}

const TYPE_STYLE: Record<CaseType, string> = {
  happy: "text-happy border-happy/30 bg-happy/10",
  negative: "text-negative border-negative/30 bg-negative/10",
  edge: "text-edge border-edge/30 bg-edge/10",
};
const TYPE_BAR: Record<CaseType, string> = { happy: "bg-happy", negative: "bg-negative", edge: "bg-edge" };

export function TypePill({ type }: { type: CaseType }) {
  return (
    <span className={`inline-flex items-center rounded-md border px-1.5 py-px font-mono text-[10.5px] uppercase tracking-wide ${TYPE_STYLE[type]}`}>
      {type}
    </span>
  );
}

export function countByType(cases: TestCase[]) {
  const c: Record<CaseType, number> = { happy: 0, negative: 0, edge: 0 };
  cases.forEach((tc) => c[caseType(tc)]++);
  return c;
}

/** Stacked bar showing the happy / negative / edge mix of a suite. */
export function CoverageBar({ cases, height = 6, legend = false }: { cases: TestCase[]; height?: number; legend?: boolean }) {
  const counts = countByType(cases);
  const total = cases.length;
  return (
    <div>
      <div className="flex w-full overflow-hidden rounded-full border border-line bg-panel-2" style={{ height }} role="img"
        aria-label={`${counts.happy} happy, ${counts.negative} negative, ${counts.edge} edge`}>
        {total > 0 &&
          CASE_TYPES.map((t) =>
            counts[t] ? (
              <span key={t} className={`${TYPE_BAR[t]} animate-grow`} style={{ width: `${(counts[t] / total) * 100}%`, animationDelay: `${CASE_TYPES.indexOf(t) * 120}ms` }} />
            ) : null
          )}
      </div>
      {legend && (
        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 font-mono text-[11px] text-muted">
          {CASE_TYPES.map((t) => (
            <span key={t} className="flex items-center gap-1.5">
              <span className={`h-2 w-2 rounded-sm ${TYPE_BAR[t]}`} />
              {t} <span className="text-fg">{counts[t]}</span>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

export function scoreTone(score: number) {
  return score >= 85 ? "var(--happy)" : score >= 60 ? "var(--accent)" : "var(--negative)";
}

export function ScoreRing({ score, size = 64 }: { score: number; size?: number }) {
  const [shown, setShown] = useState(0);
  useEffect(() => {
    let raf = 0;
    const t0 = performance.now();
    const tick = (t: number) => {
      const p = Math.min(1, (t - t0) / 900);
      setShown(Math.round(score * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [score]);
  const r = (size - 8) / 2;
  const c = 2 * Math.PI * r;
  const color = scoreTone(score);
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--line)" strokeWidth={7} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={7} strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={c * (1 - shown / 100)} />
      </svg>
      <span className="absolute inset-0 grid place-items-center font-display text-[18px] font-extrabold" style={{ color }}>
        {shown}
      </span>
    </div>
  );
}

export function shortId(id: string) {
  return id ? `#${id.slice(-6)}` : "";
}

export function timeAgo(iso?: string | null) {
  if (!iso) return "";
  const s = (Date.now() - new Date(iso).getTime()) / 1000;
  if (Number.isNaN(s)) return "";
  if (s < 60) return "just now";
  const units: [number, string][] = [[60, "m"], [3600, "h"], [86400, "d"], [604800, "w"], [2629800, "mo"], [31557600, "y"]];
  let out = `${Math.floor(s / 60)}m`;
  for (const [sec, u] of units) if (s >= sec) out = `${Math.floor(s / sec)}${u}`;
  return `${out} ago`;
}

export function Modal({ title, children, footer, onClose }: { title: string; children: React.ReactNode; footer: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 backdrop-blur-sm p-4" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div role="dialog" aria-modal="true" aria-label={title} className="panel animate-pop w-full max-w-[560px] overflow-hidden">
        <header className="border-b-[1.5px] border-line bg-accent-soft px-5 py-4">
          <h2 className="font-display text-[20px] font-extrabold">{title}</h2>
        </header>
        <div className="px-5 py-5 flex flex-col gap-4">{children}</div>
        <footer className="flex justify-end gap-2 border-t border-line bg-panel-2 px-5 py-3">{footer}</footer>
      </div>
    </div>
  );
}

export function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[12.5px] font-medium text-muted">{label}</span>
      {children}
      {hint && <span className="text-[11.5px] text-faint">{hint}</span>}
    </label>
  );
}
