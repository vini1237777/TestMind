const POLL_INTERVAL_MS = 1_500;
const GIVE_UP_AFTER_MS = 3 * 60_000;
const MAX_FAILED_POLLS = 5;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type GenerationResponse = { ok: boolean; data: any };

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Starts a generation and resolves once the background job has finished.
export async function runGeneration(body: unknown): Promise<GenerationResponse> {
  const start = await fetch("/api/generate-tests", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const started = await start.json().catch(() => null);
  if (!start.ok) return { ok: false, data: started ?? {} };

  const deadline = Date.now() + GIVE_UP_AFTER_MS;
  let failedPolls = 0;

  while (Date.now() < deadline) {
    await wait(POLL_INTERVAL_MS);

    let job = null;
    try {
      const res = await fetch(`/api/generate-tests/${started.jobId}`, { cache: "no-store" });
      if (res.status === 404) {
        return { ok: false, data: { error: "This generation can't be found. Please try again." } };
      }
      if (res.ok) job = await res.json();
    } catch {
      // A dropped connection isn't a failed generation, so keep trying for a while.
    }

    if (!job) {
      failedPolls += 1;
      if (failedPolls >= MAX_FAILED_POLLS) break;
      continue;
    }
    failedPolls = 0;

    if (job.status === "done") return { ok: true, data: job.result };
    if (job.status === "failed") return { ok: false, data: { error: job.error } };
  }

  return {
    ok: false,
    data: { error: "This is taking longer than expected. Check back in a minute." },
  };
}
