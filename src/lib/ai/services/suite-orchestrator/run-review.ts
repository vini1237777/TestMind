import type { FeedbackResult, TestCase } from "@/src/app/types/testmind";
import { runSuiteReviewGraph } from "@/src/lib/ai/graph/workflows/suite-review.graph";

export async function runReviewWorkflow(input: {
  featureName: string;
  description: string;
  projectId?: string;
  suiteId?: string;
  currentTestCases: TestCase[];
}): Promise<{ feedback: FeedbackResult; improvedTestCases: TestCase[] }> {
  const graphState = await runSuiteReviewGraph(input);

  if (graphState.errors.length > 0) {
    throw new Error(graphState.errors.join(" | "));
  }

  if (!graphState.feedback) {
    throw new Error("Feedback was not produced by the review workflow.");
  }

  return {
    feedback: graphState.feedback,
    improvedTestCases: graphState.improvedTestCases,
  };
}
