import TestCaseChunk from "@/src/app/models/TestCaseChunk";
import { embedText } from "@/src/lib/ai/embeddings";
import { connectDB } from "@/src/lib/mongodb";

export const VECTOR_INDEX_NAME = "test_case_chunks_vector";

const RESULT_LIMIT = 5;
const CANDIDATES_PER_RESULT = 20;
const DEFAULT_MIN_SCORE = 0.75;
const MAX_CONTEXT_CHARS = 4_000;
const SEARCH_TIMEOUT_MS = 3_000;

export type RetrievedCase = { text: string; score: number };

export type Retrieval = {
  cases: RetrievedCase[];
  // Passed on to the semantic cache, so one generation pays for one embedding.
  embedding: number[] | null;
};

// Atlas reports cosine as (1 + cosine) / 2, so 0.75 here is a cosine of 0.5.
function minScore() {
  const value = Number(process.env.RAG_MIN_SCORE);
  return value > 0 && value <= 1 ? value : DEFAULT_MIN_SCORE;
}

// The filters run inside the search, so the limit counts only this project and a
// regenerated suite cannot retrieve and copy its own cases.
export function similarCasesPipeline(
  projectId: string,
  queryVector: number[],
  excludeSuiteId?: string,
) {
  return [
    {
      $vectorSearch: {
        index: VECTOR_INDEX_NAME,
        path: "embedding",
        queryVector,
        numCandidates: RESULT_LIMIT * CANDIDATES_PER_RESULT,
        limit: RESULT_LIMIT,
        filter: {
          projectId: { $eq: projectId },
          ...(excludeSuiteId ? { suiteId: { $ne: excludeSuiteId } } : {}),
        },
      },
    },
    {
      $project: {
        _id: 0,
        text: 1,
        score: { $meta: "vectorSearchScore" },
      },
    },
  ];
}

// Best first, so the character budget drops the weakest matches.
export function selectContext(found: RetrievedCase[]) {
  const selected: RetrievedCase[] = [];
  let used = 0;
  for (const item of [...found].sort((a, b) => b.score - a.score)) {
    if (item.score < minScore()) break;
    if (used + item.text.length > MAX_CONTEXT_CHARS) break;
    selected.push(item);
    used += item.text.length;
  }
  return selected;
}

// Context only improves a generation, so any failure means generating without it.
export async function retrieveSimilarCases(
  projectId: string,
  text: string,
  excludeSuiteId?: string,
): Promise<Retrieval> {
  let embedding: number[] | null = null;
  try {
    embedding = await embedText(text);
    await connectDB();
    const found = await TestCaseChunk.aggregate<RetrievedCase>(
      similarCasesPipeline(projectId, embedding, excludeSuiteId) as never[],
    ).option({ maxTimeMS: SEARCH_TIMEOUT_MS });
    return { cases: selectContext(found), embedding };
  } catch (err) {
    console.error("[rag] retrieval failed:", (err as Error).message);
    return { cases: [], embedding };
  }
}
