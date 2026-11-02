"use client";

import { useEffect, useState } from "react";
import { NODE_INFO, WORKFLOWS, type RunTrace, type WorkflowKind } from "@/src/lib/ai/graph/topology";

export type RunStatus = "idle" | "running" | "done" | "error";

function useElapsed(running: boolean) {
  const [ms, setMs] = useState(0);
  useEffect(() => {
    if (!running) return;
    const t0 = performance.now();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMs(0);
    const id = setInterval(() => setMs(performance.now() - t0), 100);
    return () => clearInterval(id);
  }, [running]);
  return ms;
}

const fmtMs = (ms: number) => (ms >= 1000 ? `${(ms / 1000).toFixed(2)}s` : `${Math.round(ms)}ms`);

function Edge({ active }: { active: boolean }) {
  const stroke = active ? "#f59e0b" : "#d1d5db";
  const dash = active ? "4 4" : undefined;
  return (
    <>
      <svg className="mx-auto h-4 w-2 shrink-0 md:hidden" viewBox="0 0 8 16" aria-hidden>
        <line x1="4" y1="0" x2="4" y2="16" stroke={stroke} strokeWidth="2" strokeDasharray={dash} className={active ? "tm-flow" : ""} />
      </svg>
      <svg className="hidden h-full w-6 shrink-0 md:block" viewBox="0 0 24 24" preserveAspectRatio="none" aria-hidden>
        <line x1="0" y1="12" x2="24" y2="12" stroke={stroke} strokeWidth="2" strokeDasharray={dash} className={active ? "tm-flow" : ""} />
      </svg>
    </>
  );
}

/**
 * Renders a LangGraph workflow as it actually ran. Node order comes from the same
 * topology the server compiles; timings and token counts come from the API's trace.
 */
export default function PipelineTrace({ workflow, status, trace }: { workflow: WorkflowKind; status: RunStatus; trace?: RunTrace | null }) {
  const running = status === "running";
  const elapsed = useElapsed(running);
  const nodes = WORKFLOWS[workflow].nodes;
  const byName = new Map((trace?.nodes ?? []).map((n) => [n.node, n]));
  const tokens = (trace?.nodes ?? []).reduce((s, n) => s + (n.promptTokens ?? 0) + (n.completionTokens ?? 0), 0);

  return (
    <div className="rounded border p-3 text-xs dark:border-gray-700">
      <div className="mb-2 flex items-center justify-between">
        <span className="font-semibold">{WORKFLOWS[workflow].label}</span>
        <span aria-live="polite" className="text-gray-500">
          {running && <span className="font-medium text-amber-600">running {fmtMs(elapsed)}</span>}
          {status === "done" && trace && <>{fmtMs(trace.totalMs)}{tokens > 0 && <>, {tokens.toLocaleString()} tokens</>}</>}
          {status === "done" && !trace && "done"}
          {status === "error" && <span className="text-red-600">failed</span>}
          {status === "idle" && "idle"}
        </span>
      </div>
      <div className="flex flex-col md:flex-row md:items-stretch">
        {nodes.map((name, i) => {
          const info = NODE_INFO[name];
          const t = byName.get(name);
          const ok = t?.status === "ok";
          const failed = t?.status === "error" || (status === "error" && !t);
          return (
            <div key={name} className="contents">
              <div
                title={name}
                className={`flex-1 min-w-0 rounded border px-2.5 py-2 transition-colors duration-300 ${
                  failed
                    ? "border-red-300 bg-red-50 dark:bg-red-950/40"
                    : ok
                      ? "tm-pop border-amber-300 bg-amber-50 dark:border-amber-700 dark:bg-amber-950/40"
                      : running
                        ? "tm-ring border-amber-300"
                        : "border-gray-200 dark:border-gray-700"
                }`}
                style={ok ? { animationDelay: `${i * 120}ms` } : undefined}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium">
                    {ok ? "✔ " : failed ? "✖ " : ""}
                    {info?.label ?? name}
                  </span>
                  <span className={info?.kind === "llm" ? "text-amber-600" : "text-gray-400"}>{info?.kind === "llm" ? "AI" : "code"}</span>
                </div>
                <p className="mt-1 min-h-[14px] text-[11px] text-gray-500">
                  {t ? <>{fmtMs(t.durationMs)}{t.output && <>, {t.output}</>}</> : running ? "working…" : ""}
                </p>
              </div>
              {i < nodes.length - 1 && <Edge active={running} />}
            </div>
          );
        })}
      </div>
    </div>
  );
}
