import type { SuiteGraphState } from "@/src/lib/ai/graph/state";
import { dedupeTestCases } from "@/src/lib/ai/utils/test-case";
import { runTracedNode } from "@/src/lib/ai/graph/trace";

export async function improveSuiteNode(
  state: SuiteGraphState
): Promise<Partial<SuiteGraphState>> {
  return runTracedNode("improve_suite", async () => {
    const current = state.currentTestCases || [];
    const suggested = state.feedback?.suggestedTestCases || [];

    if (!suggested.length) {
      return { update: { improvedTestCases: current }, meta: { output: "no changes" } };
    }

    const improved = dedupeTestCases([...current, ...suggested]);
    return {
      update: { improvedTestCases: improved, actionType: "ai_improvement" },
      meta: { output: `+${improved.length - current.length} after dedupe` },
    };
  });
}
