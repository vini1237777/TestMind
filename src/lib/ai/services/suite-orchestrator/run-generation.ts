import type { TestCase } from "@/src/app/types/testmind";
import { runSuiteGenerationGraph } from "@/src/lib/ai/graph/workflows/suite-generation.graph";

export async function runGenerationWorkflow(input: {
  featureName: string;
  description: string;
  projectId?: string;
  suiteId?: string;
  lastFeedbackSummary?: string;
  lastFeedbackScore?: number | null;
}): Promise<TestCase[]> {
  const graphState = await runSuiteGenerationGraph(input);

  if (graphState.errors.length > 0) {
    throw new Error(graphState.errors.join(" | "));
  }

  return graphState.generatedTestCases;
}
