"use client";

import { useEffect, useState } from "react";
import { FiCheck, FiX } from "react-icons/fi";
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
  const stroke = active ? "var(--accent)" : "var(--line-strong)";
  const dash = active ? "4 4" : undefined;
  const cls = active ? "animate-flow" : "";
  return (
    <>
      {/* vertical on phones, horizontal from md up */}
      <svg className="mx-auto h-5 w-2 shrink-0 md:hidden" viewBox="0 0 8 20" aria-hidden>
        <line x1="4" y1="0" x2="4" y2="20" stroke={stroke} strokeWidth="2" strokeDasharray={dash} className={cls} />
      </svg>
      <svg className="hidden h-full w-8 shrink-0 md:block" viewBox="0 0 32 24" preserveAspectRatio="none" aria-hidden>
        <line x1="0" y1="12" x2="32" y2="12" stroke={stroke} strokeWidth="2" strokeDasharray={dash} className={cls} />
      </svg>
    </>
  );
}

function Terminal({ label }: { label: string }) {
  return (
    <span className="self-center shrink-0 rounded-full border-[1.5px] border-line-strong bg-panel px-2 py-0.5 font-mono text-[10px] font-semibold text-muted">
      {label}
    </span>
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
    <div className="rounded-xl border-[1.5px] border-line bg-panel-2 p-3">
      <div className="mb-3 flex items-center justify-between gap-2">
        <p className="text-[13px] font-bold">{WORKFLOWS[workflow].label}</p>
        <p className="font-mono text-[11px]" aria-live="polite">
          {running && <span className="font-semibold text-accent">executing {fmtMs(elapsed)}</span>}
          {status === "done" && trace && (
            <span className="text-muted">
              {fmtMs(trace.totalMs)}
              {tokens > 0 && <> · {tokens.toLocaleString()} tokens</>}
            </span>
          )}
          {status === "done" && !trace && <span className="text-faint">no telemetry recorded</span>}
          {status === "error" && <span className="font-semibold text-negative">halted</span>}
          {status === "idle" && <span className="text-faint">idle</span>}
        </p>
      </div>

      <div className="flex flex-col md:flex-row md:items-stretch">
        <Terminal label="START" />
        <Edge active={running} />
        {nodes.map((name, i) => {
          const info = NODE_INFO[name];
          const t = byName.get(name);
          const failed = t?.status === "error" || (status === "error" && !t);
          const ok = t?.status === "ok";
          return (
            <div key={name} className="contents">
              <div
                title={name}
                className={`min-w-0 flex-1 rounded-lg border-[1.5px] px-3 py-2.5 transition-all duration-300 ${
                  failed
                    ? "border-negative bg-negative/10"
                    : ok
                      ? "animate-pop border-fg bg-accent text-[#1c1301] shadow-[2px_2px_0_var(--ink)] dark:border-accent"
                      : running
                        ? "animate-pulse-ring border-accent bg-panel"
                        : "border-line bg-panel"
                }`}
                style={ok ? { animationDelay: `${i * 120}ms` } : undefined}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="flex items-center gap-1.5 text-[13px] font-bold">
                    {ok ? <FiCheck /> : failed ? <FiX className="text-negative" /> : <span className={`h-2 w-2 rounded-full ${running ? "bg-accent animate-pulse" : "bg-line-strong"}`} />}
                    {info?.label ?? name}
                  </span>
                  <span className={`rounded px-1 font-mono text-[10px] font-semibold ${info?.kind === "llm" ? (ok ? "bg-[#1c1301]/10" : "text-accent") : "opacity-60"}`}>
                    {info?.kind === "llm" ? "AI" : "code"}
                  </span>
                </div>
                <p className="mt-1.5 min-h-[16px] font-mono text-[11px] opacity-80">
                  {t ? (
                    <>
                      {fmtMs(t.durationMs)}
                      {t.output && <> · {t.output}</>}
                      {t.completionTokens != null && <> · {(t.promptTokens ?? 0) + t.completionTokens} tok</>}
                    </>
                  ) : running ? (
                    "working"
                  ) : (
                    ""
                  )}
                </p>
              </div>
              {i < nodes.length - 1 && <Edge active={running} />}
            </div>
          );
        })}
        <Edge active={running} />
        <Terminal label="END" />
      </div>
    </div>
  );
}
