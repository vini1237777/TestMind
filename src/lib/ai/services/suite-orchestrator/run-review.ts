import type { FeedbackResult, TestCase } from "@/src/app/types/testmind";
import type { RunTrace } from "@/src/lib/ai/graph/topology";
import { runSuiteReviewGraph } from "@/src/lib/ai/graph/workflows/suite-review.graph";

export async function runReviewWorkflow(input: {
  featureName: string;
  description: string;
  projectId?: string;
  suiteId?: string;
  currentTestCases: TestCase[];
}): Promise<{ feedback: FeedbackResult; improvedTestCases: TestCase[]; trace: RunTrace }> {
  const t0 = performance.now();
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
    trace: {
      workflow: "review",
      totalMs: Math.round(performance.now() - t0),
      nodes: graphState.trace,
    },
  };
}
