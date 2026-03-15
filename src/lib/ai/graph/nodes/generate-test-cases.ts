import type { SuiteGraphState } from "@/src/lib/ai/graph/state";
import { generateSuiteService } from "@/src/lib/ai/services/generate-suite";
import { normalizeTestCases } from "@/src/lib/ai/utils/test-case";

export async function generateTestCasesNode(
  state: SuiteGraphState
): Promise<Partial<SuiteGraphState>> {
  const generatedTestCases = await generateSuiteService({
    featureName: state.featureName,
    description: state.description,
    lastFeedbackSummary: state.lastFeedbackSummary,
    lastFeedbackScore: state.lastFeedbackScore,
  });

  return {
    generatedTestCases: normalizeTestCases(generatedTestCases),
    actionType: "initial_generation",
  };
}
