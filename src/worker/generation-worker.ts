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

// Redis bills every command, so an idle worker should ask rarely. A new job wakes the
// worker at once, so drainDelay only sets how often an empty queue is checked again.
const IDLE_WAIT_SECONDS = 5 * 60;
// How often to look for jobs left behind by a crashed worker. They restart within 5 minutes.
const STALLED_CHECK_MS = 5 * 60 * 1000;

const worker = new Worker<GenerationInput, GenerationResult>(
  GENERATION_QUEUE,
  (job) => generateAndSaveSuite(job.data),
  // Blocking commands need this null, or they error on a Redis reconnect.
  {
    connection: { url, maxRetriesPerRequest: null },
    concurrency,
    drainDelay: IDLE_WAIT_SECONDS,
    stalledInterval: STALLED_CHECK_MS,
  },
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
