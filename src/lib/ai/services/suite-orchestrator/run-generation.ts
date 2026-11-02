import type { TestCase } from "@/src/app/types/testmind";
import type { RunTrace } from "@/src/lib/ai/graph/topology";
import { runSuiteGenerationGraph } from "@/src/lib/ai/graph/workflows/suite-generation.graph";

export async function runGenerationWorkflow(input: {
  featureName: string;
  description: string;
  projectId?: string;
  suiteId?: string;
  lastFeedbackSummary?: string;
  lastFeedbackScore?: number | null;
}): Promise<{ testCases: TestCase[]; trace: RunTrace }> {
  const t0 = performance.now();
  const graphState = await runSuiteGenerationGraph(input);

  if (graphState.errors.length > 0) {
    throw new Error(graphState.errors.join(" | "));
  }

  return {
    testCases: graphState.generatedTestCases,
    trace: {
      workflow: "generation",
      totalMs: Math.round(performance.now() - t0),
      nodes: graphState.trace,
    },
  };
}
