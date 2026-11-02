import type { SuiteGraphState } from "@/src/lib/ai/graph/state";
import { normalizeTestCases } from "@/src/lib/ai/utils/test-case";
import { runTracedNode } from "@/src/lib/ai/graph/trace";

export async function validateGeneratedCasesNode(
  state: SuiteGraphState
): Promise<Partial<SuiteGraphState>> {
  return runTracedNode("validate_generated_cases", async () => {
    const generated = state.generatedTestCases || [];

    if (!generated.length) {
      return {
        update: { errors: ["No generated test cases found in graph state."] },
        meta: { output: "0 cases" },
      };
    }

    return {
      update: { generatedTestCases: normalizeTestCases(generated) },
      meta: { output: `${generated.length} valid` },
    };
  });
}
