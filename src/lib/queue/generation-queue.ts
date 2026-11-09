import { randomUUID } from "node:crypto";
import { Queue } from "bullmq";
import type {
  GenerationInput,
  GenerationResult,
} from "@/src/lib/ai/services/suite-orchestrator/generate-and-save";

export const GENERATION_QUEUE = "test-generation";

// Past this the next visitor would wait too long, so refuse instead of queueing.
const MAX_WAITING_JOBS = 50;
const REDIS_TIMEOUT_MS = 3_000;

export class QueueBusyError extends Error {}
export class QueueUnavailableError extends Error {}

export type GenerationStatus =
  | { status: "queued" | "running" }
  | { status: "done"; result: GenerationResult }
  | { status: "failed" };

type QueueGlobal = { generationQueue?: Queue<GenerationInput, GenerationResult> };
const shared = globalThis as unknown as QueueGlobal;

function getQueue() {
  const url = process.env.REDIS_URL;
  if (!url) throw new QueueUnavailableError("REDIS_URL is not set");

  if (!shared.generationQueue) {
    // Fail fast: a request must get an answer, and a job held back while Redis
    // is down must not run later after the visitor was told it failed.
    shared.generationQueue = new Queue(GENERATION_QUEUE, {
      connection: {
        url,
        enableOfflineQueue: false,
        maxRetriesPerRequest: 1,
        connectTimeout: REDIS_TIMEOUT_MS,
      },
      defaultJobOptions: {
        attempts: 2,
        backoff: { type: "exponential", delay: 2_000 },
        removeOnComplete: { age: 60 * 60 },
        removeOnFail: { age: 24 * 60 * 60 },
      },
    });
    shared.generationQueue.on("error", (err) => {
      console.error("Generation queue error:", err.message);
    });
  }
  return shared.generationQueue;
}

async function readyQueue() {
  const queue = getQueue();
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(
      () => reject(new QueueUnavailableError("Redis did not respond in time")),
      REDIS_TIMEOUT_MS,
    );
  });
  try {
    await Promise.race([queue.waitUntilReady(), timeout]);
  } finally {
    clearTimeout(timer);
  }
  return queue;
}

export async function enqueueGeneration(input: GenerationInput): Promise<string> {
  const queue = await readyQueue();
  if ((await queue.getWaitingCount()) >= MAX_WAITING_JOBS) {
    throw new QueueBusyError("Too many generations waiting");
  }
  const jobId = randomUUID();
  await queue.add("generate", input, { jobId });
  return jobId;
}

export async function getGenerationStatus(jobId: string): Promise<GenerationStatus | null> {
  const queue = await readyQueue();
  const job = await queue.getJob(jobId);
  if (!job) return null;

  const state = await job.getState();
  if (state === "completed") return { status: "done", result: job.returnvalue };
  if (state === "failed") return { status: "failed" };
  // "delayed" is a job waiting to retry, so it is still in progress for the visitor.
  if (state === "active" || state === "delayed") return { status: "running" };
  return { status: "queued" };
}
