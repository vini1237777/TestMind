import { END, START, StateGraph } from "@langchain/langgraph";
import type { SuiteGraphState } from "@/src/lib/ai/graph/state";
import { SuiteGraphAnnotation } from "@/src/lib/ai/graph/annotations";
import { createInitialSuiteGraphState } from "@/src/lib/ai/graph/runner";
import { generateTestCasesNode } from "@/src/lib/ai/graph/nodes/generate-test-cases";
import { validateGeneratedCasesNode } from "@/src/lib/ai/graph/nodes/validate-generated-cases";

const generationGraph = new StateGraph(SuiteGraphAnnotation)
  .addNode("generate_test_cases", generateTestCasesNode)
  .addNode("validate_generated_cases", validateGeneratedCasesNode)
  .addEdge(START, "generate_test_cases")
  .addEdge("generate_test_cases", "validate_generated_cases")
  .addEdge("validate_generated_cases", END);

const generationGraphApp = generationGraph.compile();

export async function runSuiteGenerationGraph(
  input: Pick<
    SuiteGraphState,
    | "featureName"
    | "description"
    | "projectId"
    | "suiteId"
    | "lastFeedbackSummary"
    | "lastFeedbackScore"
  >
): Promise<SuiteGraphState> {
  const result = await generationGraphApp.invoke(
    createInitialSuiteGraphState({
      featureName: input.featureName,
      description: input.description,
      projectId: input.projectId,
      suiteId: input.suiteId,
      lastFeedbackSummary: input.lastFeedbackSummary,
      lastFeedbackScore: input.lastFeedbackScore ?? null,
    })
  );

  return result as SuiteGraphState;
}
