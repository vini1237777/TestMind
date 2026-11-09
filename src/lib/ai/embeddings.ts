import { getOpenAIClient } from "@/src/lib/ai/llm/openai";

const EMBEDDING_MODEL = "text-embedding-3-small";
const EMBEDDING_TIMEOUT_MS = 5_000;

export const EMBEDDING_DIMENSIONS = 256;

async function createEmbeddings(input: string | string[]) {
  const response = await getOpenAIClient().embeddings.create(
    { model: EMBEDDING_MODEL, input, dimensions: EMBEDDING_DIMENSIONS },
    { timeout: EMBEDDING_TIMEOUT_MS, maxRetries: 0 },
  );
  return response.data.map((item) => item.embedding);
}

export async function embedText(text: string): Promise<number[]> {
  const [embedding] = await createEmbeddings(text);
  return embedding;
}

export function embedTexts(texts: string[]): Promise<number[][]> {
  return createEmbeddings(texts);
}
