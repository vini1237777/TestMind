import assert from "node:assert/strict";
import { after, test } from "node:test";
import Redis from "ioredis";

// The same local Redis the other unit tests use (a service container in CI).
const REDIS_URL = "redis://127.0.0.1:6379/7";

after(async () => {
  const { getQueueForTests } = await import("./helpers/queue");
  await getQueueForTests()?.close();
});

test("status route reports paused, with the message, when no queue is configured", async () => {
  delete process.env.REDIS_URL;
  const { GET } = await import("@/src/app/api/generation-status/route");
  const body = await (await GET()).json();
  assert.equal(body.available, false);
  assert.match(body.message, /paused/);
});

test("the queue is available when Redis answers, and the answer is kept for a minute", async () => {
  process.env.REDIS_URL = REDIS_URL;
  const { isQueueAvailable } = await import("@/src/lib/queue/generation-queue");
  const later = Date.now() + 120_000; // past the cached answer from the first test

  const probe = new Redis(REDIS_URL);
  const pings = async () =>
    Number((await probe.info("commandstats")).match(/cmdstat_ping:calls=(\d+)/)?.[1] ?? 0);

  const before = await pings();
  assert.equal(await isQueueAvailable(later), true);
  const afterFirst = await pings();
  assert.equal(afterFirst - before, 1, "one PING for a fresh answer");

  assert.equal(await isQueueAvailable(later + 30_000), true);
  assert.equal(await pings(), afterFirst, "no PING while the answer is under a minute old");

  probe.disconnect();
});
