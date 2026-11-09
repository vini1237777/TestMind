import type { SuiteGraphState } from "@/src/lib/ai/graph/state";
import { generateSuiteService } from "@/src/lib/ai/services/generate-suite";
import { normalizeTestCases } from "@/src/lib/ai/utils/test-case";
import { runTracedNode } from "@/src/lib/ai/graph/trace";
import {
  isSemanticCacheEnabled,
  lookupSemanticCache,
  semanticCacheText,
  storeSemanticCache,
} from "@/src/lib/ai/cache/semantic-cache";

export async function generateTestCasesNode(
  state: SuiteGraphState
): Promise<Partial<SuiteGraphState>> {
  return runTracedNode("generate_test_cases", async () => {
    // Regenerating asks for something new, and feedback changes the prompt, so
    // only a first generation in a project can reuse earlier cases.
    const projectId =
      isSemanticCacheEnabled() && !state.suiteId && !state.lastFeedbackSummary
        ? state.projectId
        : undefined;
    const lookup = projectId
      ? await lookupSemanticCache(
          projectId,
          semanticCacheText(state.featureName, state.description),
          state.queryEmbedding,
        )
      : null;

    if (lookup?.hit) {
      return {
        update: {
          generatedTestCases: normalizeTestCases(lookup.hit.testCases),
          actionType: "initial_generation",
        },
        meta: {
          output: `${lookup.hit.testCases.length} cases from cache, similarity ${lookup.hit.similarity.toFixed(3)}`,
        },
      };
    }

    const { testCases, usage } = await generateSuiteService({
      featureName: state.featureName,
      description: state.description,
      lastFeedbackSummary: state.lastFeedbackSummary,
      lastFeedbackScore: state.lastFeedbackScore,
      retrievedCases: state.retrievedCases,
    });

    if (projectId && lookup?.embedding) {
      await storeSemanticCache(projectId, lookup.embedding, testCases);
    }

    return {
      update: {
        generatedTestCases: normalizeTestCases(testCases),
        actionType: "initial_generation",
      },
      meta: { ...usage, output: `${testCases.length} cases` },
    };
  });
}
