import type { SuiteGraphState } from "@/src/lib/ai/graph/state";
import { reviewSuiteService } from "@/src/lib/ai/services/review-suite";
import { runTracedNode } from "@/src/lib/ai/graph/trace";

export async function reviewSuiteNode(
  state: SuiteGraphState
): Promise<Partial<SuiteGraphState>> {
  return runTracedNode("review_suite", async () => {
    const { feedback, usage } = await reviewSuiteService({
      featureName: state.featureName,
      description: state.description,
      testCases: state.currentTestCases || [],
    });

    return {
      update: {
        feedback,
        lastFeedbackScore: feedback.score,
        lastFeedbackSummary: feedback.summary,
        lastReviewedAt: new Date().toISOString(),
        actionType: "review",
      },
      meta: { ...usage, output: `score ${feedback.score}` },
    };
  });
}
