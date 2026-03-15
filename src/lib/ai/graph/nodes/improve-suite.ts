import type { SuiteGraphState } from "@/src/lib/ai/graph/state";
import { dedupeTestCases } from "@/src/lib/ai/utils/test-case";

export async function improveSuiteNode(
  state: SuiteGraphState
): Promise<Partial<SuiteGraphState>> {
  const current = state.currentTestCases || [];
  const suggested = state.feedback?.suggestedTestCases || [];

  if (!suggested.length) {
    return { improvedTestCases: current };
  }

  return {
    improvedTestCases: dedupeTestCases([...current, ...suggested]),
    actionType: "ai_improvement",
  };
}
