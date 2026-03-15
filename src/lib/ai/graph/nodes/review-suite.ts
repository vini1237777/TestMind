import type { SuiteGraphState } from "@/src/lib/ai/graph/state";
import { reviewSuiteService } from "@/src/lib/ai/services/review-suite";

export async function reviewSuiteNode(
  state: SuiteGraphState
): Promise<Partial<SuiteGraphState>> {
  const feedback = await reviewSuiteService({
    featureName: state.featureName,
    description: state.description,
    testCases: state.currentTestCases || [],
  });

  return {
    feedback,
    lastFeedbackScore: feedback.score,
    lastFeedbackSummary: feedback.summary,
    lastReviewedAt: new Date().toISOString(),
    actionType: "review",
  };
}
