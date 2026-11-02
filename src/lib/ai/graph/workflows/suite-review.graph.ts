import { END, START, StateGraph } from "@langchain/langgraph";
import type { SuiteGraphState } from "@/src/lib/ai/graph/state";
import { SuiteGraphAnnotation } from "@/src/lib/ai/graph/annotations";
import { createInitialSuiteGraphState } from "@/src/lib/ai/graph/runner";
import { improveSuiteNode } from "@/src/lib/ai/graph/nodes/improve-suite";
import { reviewSuiteNode } from "@/src/lib/ai/graph/nodes/review-suite";
import { REVIEW_NODES } from "@/src/lib/ai/graph/topology";

const [REVIEW, IMPROVE] = REVIEW_NODES;

const reviewGraph = new StateGraph(SuiteGraphAnnotation)
  .addNode(REVIEW, reviewSuiteNode)
  .addNode(IMPROVE, improveSuiteNode)
  .addEdge(START, REVIEW)
  .addEdge(REVIEW, IMPROVE)
  .addEdge(IMPROVE, END);

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
