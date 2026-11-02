import { END, START, StateGraph } from "@langchain/langgraph";
import type { SuiteGraphState } from "@/src/lib/ai/graph/state";
import { SuiteGraphAnnotation } from "@/src/lib/ai/graph/annotations";
import { createInitialSuiteGraphState } from "@/src/lib/ai/graph/runner";
import { generateTestCasesNode } from "@/src/lib/ai/graph/nodes/generate-test-cases";
import { validateGeneratedCasesNode } from "@/src/lib/ai/graph/nodes/validate-generated-cases";
import { GENERATION_NODES } from "@/src/lib/ai/graph/topology";

const [GENERATE, VALIDATE] = GENERATION_NODES;

const generationGraph = new StateGraph(SuiteGraphAnnotation)
  .addNode(GENERATE, generateTestCasesNode)
  .addNode(VALIDATE, validateGeneratedCasesNode)
  .addEdge(START, GENERATE)
  .addEdge(GENERATE, VALIDATE)
  .addEdge(VALIDATE, END);

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
