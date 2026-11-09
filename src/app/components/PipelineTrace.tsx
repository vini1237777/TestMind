"use client";

import { useEffect, useState } from "react";
import type { RunTrace, WorkflowKind } from "@/src/lib/ai/graph/topology";

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

const secs = (ms: number) => `${(ms / 1000).toFixed(1)}s`;
const num = (s?: string) => Number(s?.match(/\d+/)?.[0] ?? NaN);

/**
 * One quiet status line for a run. Timings and token counts come from the
 * LangGraph trace the API returns; per step details sit in the tooltip.
 */
export default function PipelineTrace({ workflow, status, trace }: { workflow: WorkflowKind; status: RunStatus; trace?: RunTrace | null }) {
  const running = status === "running";
  const elapsed = useElapsed(running);
  const steps = trace?.nodes ?? [];
  const tokens = steps.reduce((s, n) => s + (n.promptTokens ?? 0) + (n.completionTokens ?? 0), 0);
  const detail = steps.map((n) => `${n.node}: ${secs(n.durationMs)}${n.output ? `, ${n.output}` : ""}`).join("\n");

  let text: React.ReactNode;
  if (running) {
    text = (
      <>
        {workflow === "generation" ? "Writing test cases" : "Reviewing coverage"}
        <span className="tm-dots" aria-hidden />
        <span className="ml-2 tabular-nums text-gray-400">{secs(elapsed)}</span>
      </>
    );
  } else if (status === "done") {
    const valid = num(steps.find((n) => n.node === "validate_generated_cases")?.output);
    const retrieved = num(steps.find((n) => n.node === "retrieve_context")?.output);
    const what =
      workflow === "generation"
        ? Number.isNaN(valid)
          ? "Test cases written"
          : `Wrote ${valid} test cases${retrieved ? ` using ${retrieved} from this project` : ""} and checked each one`
        : "Coverage reviewed";
    text = (
      <>
        {what}
        {trace && (
          <span className="text-gray-400">
            {" "}
            in {secs(trace.totalMs)}
            {tokens > 0 && <>, {tokens.toLocaleString()} tokens</>}
          </span>
        )}
      </>
    );
  } else return null;

  return (
    <p aria-live="polite" title={detail || undefined} className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-300">
      {running ? (
        <span aria-hidden className="h-3 w-3 animate-spin rounded-full border-2 border-amber-500 border-t-transparent" />
      ) : status === "done" ? (
        <span aria-hidden className="text-amber-600">✓</span>
      ) : null}
      <span>{text}</span>
    </p>
  );
}
