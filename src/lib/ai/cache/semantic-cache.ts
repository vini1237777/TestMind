import { randomUUID } from "node:crypto";
import Redis from "ioredis";
import { z } from "zod";
import type { TestCase } from "@/src/app/types/testmind";
import { getOpenAIClient } from "@/src/lib/ai/llm/openai";
import { TestCaseSchema } from "@/src/lib/ai/schemas/test-case";

const EMBEDDING_MODEL = "text-embedding-3-small";
const DIMENSIONS = 256;
const DEFAULT_THRESHOLD = 0.95;
const TTL_SECONDS = 7 * 24 * 60 * 60;
const MAX_PER_PROJECT = 200;
const REDIS_TIMEOUT_MS = 1_500;
const EMBEDDING_TIMEOUT_MS = 5_000;

const CachedCasesSchema = z.array(TestCaseSchema).min(1);

export type SemanticCacheHit = { testCases: TestCase[]; similarity: number };
export type SemanticLookup = {
  hit: SemanticCacheHit | null;
  // Reused when storing after a miss, so one generation pays for one embedding.
  embedding: number[] | null;
};

// Keys are per project, so one project's cases are never served to another.
const vectorsKey = (projectId: string) => `semantic:v1:${projectId}:vectors`;
const orderKey = (projectId: string) => `semantic:v1:${projectId}:order`;
const casesKey = (projectId: string, id: string) =>
  `semantic:v1:${projectId}:cases:${id}`;

let client: Redis | null = null;

function getRedis() {
  const url = process.env.REDIS_URL;
  if (!url) throw new Error("REDIS_URL is not set");
  if (!client) {
    client = new Redis(url, {
      maxRetriesPerRequest: 1,
      connectTimeout: REDIS_TIMEOUT_MS,
      retryStrategy: (attempt) => Math.min(attempt * 500, 5_000),
    });
    client.on("error", (err) => {
      console.error("[semantic-cache] Redis error:", err.message);
    });
  }
  return client;
}

function withTimeout<T>(work: Promise<T>, ms: number): Promise<T> {
  let timer: ReturnType<typeof setTimeout>;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error("Timed out")), ms);
  });
  return Promise.race([work, timeout]).finally(() => clearTimeout(timer));
}

export function isSemanticCacheEnabled() {
  return process.env.SEMANTIC_CACHE === "on";
}

function threshold() {
  const value = Number(process.env.SEMANTIC_CACHE_THRESHOLD);
  return value > 0 && value <= 1 ? value : DEFAULT_THRESHOLD;
}

export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length || a.length === 0) return 0;
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  return normA && normB ? dot / Math.sqrt(normA * normB) : 0;
}

// Float32 keeps each 256 number vector near 1.4 KB in Redis.
export function encodeVector(vector: number[]): string {
  return Buffer.from(new Float32Array(vector).buffer).toString("base64");
}

export function decodeVector(encoded: string): number[] {
  const bytes = Buffer.from(encoded, "base64");
  const view = new Float32Array(
    bytes.buffer,
    bytes.byteOffset,
    Math.floor(bytes.byteLength / 4),
  );
  return Array.from(view);
}

async function embed(text: string): Promise<number[]> {
  const response = await getOpenAIClient().embeddings.create(
    { model: EMBEDDING_MODEL, input: text, dimensions: DIMENSIONS },
    { timeout: EMBEDDING_TIMEOUT_MS, maxRetries: 0 },
  );
  return response.data[0].embedding;
}

export function semanticCacheText(featureName: string, description: string) {
  return `${featureName}\n${description}`.trim().toLowerCase();
}

// A cache problem must never fail a generation, so every failure is a miss.
export async function lookupSemanticCache(
  projectId: string,
  text: string,
): Promise<SemanticLookup> {
  let embedding: number[] | null = null;
  try {
    embedding = await embed(text);
    const redis = getRedis();
    const vectors = await withTimeout(
      redis.hgetall(vectorsKey(projectId)),
      REDIS_TIMEOUT_MS,
    );

    let bestId: string | null = null;
    let best = -1;
    for (const [id, encoded] of Object.entries(vectors)) {
      const score = cosineSimilarity(embedding, decodeVector(encoded));
      if (score > best) {
        best = score;
        bestId = id;
      }
    }
    if (!bestId || best < threshold()) return { hit: null, embedding };

    const raw = await withTimeout(
      redis.get(casesKey(projectId, bestId)),
      REDIS_TIMEOUT_MS,
    );
    if (!raw) {
      // The cases expired, so the vector has nothing left to serve.
      await removeEntries(projectId, [bestId]);
      return { hit: null, embedding };
    }

    const testCases = CachedCasesSchema.parse(JSON.parse(raw)) as TestCase[];
    return { hit: { testCases, similarity: best }, embedding };
  } catch (err) {
    console.error("[semantic-cache] lookup failed:", (err as Error).message);
    return { hit: null, embedding };
  }
}

async function removeEntries(projectId: string, ids: string[]) {
  if (!ids.length) return;
  await withTimeout(
    getRedis()
      .multi()
      .hdel(vectorsKey(projectId), ...ids)
      .zrem(orderKey(projectId), ...ids)
      .del(...ids.map((id) => casesKey(projectId, id)))
      .exec(),
    REDIS_TIMEOUT_MS,
  );
}

export async function storeSemanticCache(
  projectId: string,
  embedding: number[],
  testCases: TestCase[],
): Promise<void> {
  try {
    const redis = getRedis();
    const id = randomUUID();
    const now = Date.now();
    await withTimeout(
      redis
        .multi()
        .set(casesKey(projectId, id), JSON.stringify(testCases), "EX", TTL_SECONDS)
        .hset(vectorsKey(projectId), id, encodeVector(embedding))
        .zadd(orderKey(projectId), now, id)
        .expire(vectorsKey(projectId), TTL_SECONDS)
        .expire(orderKey(projectId), TTL_SECONDS)
        .exec(),
      REDIS_TIMEOUT_MS,
    );

    // The queue's Redis must not evict, so this cache limits its own size.
    const oldest = await withTimeout(
      redis.zrange(orderKey(projectId), 0, -(MAX_PER_PROJECT + 1)),
      REDIS_TIMEOUT_MS,
    );
    const expired = await withTimeout(
      redis.zrangebyscore(orderKey(projectId), 0, now - TTL_SECONDS * 1000),
      REDIS_TIMEOUT_MS,
    );
    await removeEntries(projectId, [...new Set([...oldest, ...expired])]);
  } catch (err) {
    console.error("[semantic-cache] store failed:", (err as Error).message);
  }
}
