import { END, START, StateGraph } from "@langchain/langgraph";
import type { SuiteGraphState } from "@/src/lib/ai/graph/state";
import { SuiteGraphAnnotation } from "@/src/lib/ai/graph/annotations";
import { createInitialSuiteGraphState } from "@/src/lib/ai/graph/runner";
import { improveSuiteNode } from "@/src/lib/ai/graph/nodes/improve-suite";
import { reviewSuiteNode } from "@/src/lib/ai/graph/nodes/review-suite";

const reviewGraph = new StateGraph(SuiteGraphAnnotation)
  .addNode("review_suite", reviewSuiteNode)
  .addNode("improve_suite", improveSuiteNode)
  .addEdge(START, "review_suite")
  .addEdge("review_suite", "improve_suite")
  .addEdge("improve_suite", END);

const reviewGraphApp = reviewGraph.compile();

export async function runSuiteReviewGraph(
  input: Pick<
    SuiteGraphState,
    "featureName" | "description" | "projectId" | "suiteId" | "currentTestCases"
  >
): Promise<SuiteGraphState> {
  const result = await reviewGraphApp.invoke(
    createInitialSuiteGraphState({
      featureName: input.featureName,
      description: input.description,
      projectId: input.projectId,
      suiteId: input.suiteId,
      currentTestCases: input.currentTestCases || [],
    })
  );

  return result as SuiteGraphState;
}
