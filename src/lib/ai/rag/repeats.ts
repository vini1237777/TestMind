import type { TestCase } from "@/src/app/types/testmind";
import { embedTexts } from "@/src/lib/ai/embeddings";
import { chunkText } from "@/src/lib/ai/rag/chunks";

// Above this cosine a generated case says what a retrieved case already says.
const REPEAT_COSINE = 0.85;
const MIN_CASES = 4;

function cosine(a: number[], b: number[]) {
  let dot = 0;
  let aSize = 0;
  let bSize = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    aSize += a[i] * a[i];
    bSize += b[i] * b[i];
  }
  return dot / Math.sqrt(aSize * bSize);
}

// Removes the closest repeats first and never goes below the minimum suite size.
// The check only improves a suite, so a failed embedding keeps every case.
export async function dropRepeatedCases(testCases: TestCase[], retrieved: { text: string }[]) {
  if (!retrieved.length || testCases.length <= MIN_CASES) return testCases;
  try {
    const vectors = await embedTexts([
      ...testCases.map(chunkText),
      ...retrieved.map((item) => item.text),
    ]);
    const retrievedVectors = vectors.slice(testCases.length);
    const repeats = testCases
      .map((testCase, index) => ({
        testCase,
        closest: Math.max(...retrievedVectors.map((vector) => cosine(vectors[index], vector))),
      }))
      .filter((item) => item.closest >= REPEAT_COSINE)
      .sort((a, b) => b.closest - a.closest)
      .slice(0, testCases.length - MIN_CASES);
    const dropped = new Set(repeats.map((item) => item.testCase));
    return testCases.filter((testCase) => !dropped.has(testCase));
  } catch (err) {
    console.error("[rag] repeat check failed:", (err as Error).message);
    return testCases;
  }
}
