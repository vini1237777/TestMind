import type { SuiteGraphState } from "@/src/lib/ai/graph/state";

export function createInitialSuiteGraphState(
  input: Partial<SuiteGraphState>
): SuiteGraphState {
  return {
    featureName: input.featureName ?? "",
    description: input.description ?? "",
    projectId: input.projectId,
    suiteId: input.suiteId,
    currentTestCases: input.currentTestCases ?? [],
    generatedTestCases: input.generatedTestCases ?? [],
    feedback: input.feedback ?? null,
    improvedTestCases: input.improvedTestCases ?? [],
    lastFeedbackSummary: input.lastFeedbackSummary,
    lastFeedbackScore: input.lastFeedbackScore ?? null,
    lastReviewedAt: input.lastReviewedAt ?? null,
    actionType: input.actionType,
    errors: input.errors ?? [],
  };
}
