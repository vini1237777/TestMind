import { semanticCacheText } from "@/src/lib/ai/cache/semantic-cache";
import type { SuiteGraphState } from "@/src/lib/ai/graph/state";
import { runTracedNode } from "@/src/lib/ai/graph/trace";
import { isRagEnabled } from "@/src/lib/ai/rag/chunks";
import { retrieveSimilarCases } from "@/src/lib/ai/rag/retrieve";

export async function retrieveContextNode(
  state: SuiteGraphState,
): Promise<Partial<SuiteGraphState>> {
  return runTracedNode("retrieve_context", async () => {
    if (!isRagEnabled() || !state.projectId) {
      return { update: {}, meta: { output: "Skipped" } };
    }

    const { cases, embedding } = await retrieveSimilarCases(
      state.projectId,
      semanticCacheText(state.featureName, state.description),
      state.suiteId,
    );

    return {
      update: { retrievedCases: cases, queryEmbedding: embedding },
      meta: {
        output: cases.length
          ? `${cases.length} cases, top score ${cases[0].score.toFixed(2)}`
          : "No matching cases",
      },
    };
  });
}
