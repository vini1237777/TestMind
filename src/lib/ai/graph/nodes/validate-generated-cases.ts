import type { SuiteGraphState } from "@/src/lib/ai/graph/state";
import { normalizeTestCases } from "@/src/lib/ai/utils/test-case";

export async function validateGeneratedCasesNode(
  state: SuiteGraphState
): Promise<Partial<SuiteGraphState>> {
  const generated = state.generatedTestCases || [];

  if (!generated.length) {
    return { errors: [...state.errors, "No generated test cases found in graph state."] };
  }

  return { generatedTestCases: normalizeTestCases(generated) };
}
