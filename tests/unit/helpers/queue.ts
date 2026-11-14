import type { Queue } from "bullmq";

// The queue module keeps one shared Queue on globalThis. Tests close it so the run can exit.
export function getQueueForTests(): Queue | undefined {
  return (globalThis as unknown as { generationQueue?: Queue }).generationQueue;
}
