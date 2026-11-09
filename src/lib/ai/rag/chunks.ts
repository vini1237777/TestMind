import { createHash } from "node:crypto";
import TestCaseChunk from "@/src/app/models/TestCaseChunk";
import type { TestCase } from "@/src/app/types/testmind";
import { embedTexts } from "@/src/lib/ai/embeddings";

const MAX_CHUNK_CHARS = 1_500;
const EMBED_BATCH_SIZE = 100;

type SuiteCases = {
  suiteId: string;
  projectId: string;
  testCases: Pick<TestCase, "type" | "title" | "steps" | "expected">[];
};

// Off by default, because $vectorSearch needs an index in Atlas.
export function isRagEnabled() {
  return process.env.RAG === "on";
}

// One case is one chunk, so a search returns a whole, readable test.
export function chunkText({
  type,
  title,
  steps,
  expected,
}: SuiteCases["testCases"][number]) {
  return [
    `${type}: ${title}`,
    `Steps: ${steps.join(" | ")}`,
    `Expected: ${expected}`,
  ]
    .join("\n")
    .slice(0, MAX_CHUNK_CHARS);
}

// The id comes from the text, so an unchanged case is never embedded twice.
export function chunkId(suiteId: string, text: string) {
  return createHash("sha256").update(`${suiteId}\n${text}`).digest("hex");
}

export async function writeSuiteChunks({
  suiteId,
  projectId,
  testCases,
}: SuiteCases) {
  const wanted = new Map(
    testCases.map((testCase) => {
      const text = chunkText(testCase);
      return [chunkId(suiteId, text), text] as const;
    }),
  );

  const stored = await TestCaseChunk.find({ suiteId }, { _id: 1 }).lean<
    { _id: string }[]
  >();
  const storedIds = new Set(stored.map((chunk) => chunk._id));
  const missing = [...wanted].filter(([id]) => !storedIds.has(id));

  for (let i = 0; i < missing.length; i += EMBED_BATCH_SIZE) {
    const batch = missing.slice(i, i + EMBED_BATCH_SIZE);
    const embeddings = await embedTexts(batch.map(([, text]) => text));
    // An upsert, so two saves of one suite at once cannot collide.
    await TestCaseChunk.bulkWrite(
      batch.map(([id, text], index) => ({
        updateOne: {
          filter: { _id: id },
          update: {
            $setOnInsert: {
              projectId,
              suiteId,
              text,
              embedding: embeddings[index],
            },
          },
          upsert: true,
        },
      })),
    );
  }

  // New chunks go in first, so a search during a save still finds this suite.
  const stale = [...storedIds].filter((id) => !wanted.has(id));
  if (stale.length) await TestCaseChunk.deleteMany({ _id: { $in: stale } });

  return { embedded: missing.length, removed: stale.length };
}

// Retrieval only improves a suite, so a failure here must never lose a save.
export async function syncSuiteChunks(suite: SuiteCases) {
  if (!isRagEnabled()) return;
  try {
    await writeSuiteChunks(suite);
  } catch (err) {
    console.error(
      `[rag] could not sync suite ${suite.suiteId}:`,
      (err as Error).message,
    );
  }
}
