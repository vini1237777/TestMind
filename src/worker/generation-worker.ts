import "./load-env";
import { Worker } from "bullmq";
import {
  generateAndSaveSuite,
  type GenerationInput,
  type GenerationResult,
} from "@/src/lib/ai/services/suite-orchestrator/generate-and-save";
import { GENERATION_QUEUE } from "@/src/lib/queue/generation-queue";

const url = process.env.REDIS_URL;
if (!url) throw new Error("REDIS_URL is not set");

// Limits OpenAI calls at once, whatever the traffic does.
const concurrency = Number(process.env.GENERATION_CONCURRENCY) || 3;

const worker = new Worker<GenerationInput, GenerationResult>(
  GENERATION_QUEUE,
  (job) => generateAndSaveSuite(job.data),
  // Blocking commands need this null, or they error on a Redis reconnect.
  { connection: { url, maxRetriesPerRequest: null }, concurrency },
);

worker.on("ready", () => console.log(`Generation worker ready, concurrency ${concurrency}`));
worker.on("error", (err) => console.error("Generation worker error:", err.message));
worker.on("failed", (job, err) => {
  console.error(`Generation job ${job?.id} failed, attempt ${job?.attemptsMade}:`, err.message);
});

// A deploy sends SIGTERM. Finish running jobs so they aren't retried for nothing.
async function shutdown() {
  await worker.close();
  process.exit(0);
}
process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
