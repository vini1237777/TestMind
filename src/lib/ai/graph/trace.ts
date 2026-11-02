import type { SuiteGraphState } from "@/src/lib/ai/graph/state";
import type { NodeTrace } from "@/src/lib/ai/graph/topology";

export type TraceMeta = Omit<NodeTrace, "node" | "status" | "startedAt" | "durationMs">;

// Wraps a node body so every run records how long the node took and what it produced.
// Errors are still thrown so the API keeps returning a 500 on failure.
export async function runTracedNode(
  node: string,
  work: () => Promise<{ update: Partial<SuiteGraphState>; meta?: TraceMeta }>
): Promise<Partial<SuiteGraphState>> {
  const startedAt = new Date().toISOString();
  const t0 = performance.now();
  const { update, meta } = await work();
  const entry: NodeTrace = {
    node,
    status: update.errors?.length ? "error" : "ok",
    startedAt,
    durationMs: Math.round(performance.now() - t0),
    ...meta,
  };
  return { ...update, trace: [entry] };
}
