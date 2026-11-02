import type { SuiteGraphState } from "@/src/lib/ai/graph/state";
import { generateSuiteService } from "@/src/lib/ai/services/generate-suite";
import { normalizeTestCases } from "@/src/lib/ai/utils/test-case";
import { runTracedNode } from "@/src/lib/ai/graph/trace";

export async function generateTestCasesNode(
  state: SuiteGraphState
): Promise<Partial<SuiteGraphState>> {
  return runTracedNode("generate_test_cases", async () => {
    const { testCases, usage } = await generateSuiteService({
      featureName: state.featureName,
      description: state.description,
      lastFeedbackSummary: state.lastFeedbackSummary,
      lastFeedbackScore: state.lastFeedbackScore,
    });

    return {
      update: {
        generatedTestCases: normalizeTestCases(testCases),
        actionType: "initial_generation",
      },
      meta: { ...usage, output: `${testCases.length} cases` },
    };
  });
}
