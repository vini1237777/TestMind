import assert from "node:assert/strict";
import http from "node:http";
import type { AddressInfo } from "node:net";
import { after, before, test } from "node:test";
import { NextRequest } from "next/server";
import { createMemoryLimiter } from "@/src/lib/memory-rate-limit";

// A stand in for Upstash after the monthly command quota is used up.
let server: http.Server;
let calls = 0;

before(async () => {
  server = http.createServer((req, res) => {
    calls += 1;
    req.resume();
    res.writeHead(400, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "ERR max requests limit exceeded. Limit: 500000, Usage: 500000" }));
  });
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const { port } = server.address() as AddressInfo;
  process.env.UPSTASH_REDIS_REST_URL = `http://127.0.0.1:${port}`;
  process.env.UPSTASH_REDIS_REST_TOKEN = "test";
});

after(() => server.close());

test("memory limiter allows the limit, refuses the next, and resets after the window", () => {
  const allow = createMemoryLimiter(2, 1_000);
  assert.equal(allow("a", 0), true);
  assert.equal(allow("a", 10), true);
  assert.equal(allow("a", 20), false);
  assert.equal(allow("b", 20), true, "each key has its own count");
  assert.equal(allow("a", 1_000), true, "a new window starts after windowMs");
});

test("memory limiter drops expired keys when it reaches its size cap", () => {
  const allow = createMemoryLimiter(1, 1_000, 2);
  allow("a", 0);
  allow("b", 0);
  assert.equal(allow("c", 2_000), true);
  assert.equal(allow("a", 2_000), true, "a was expired and removed");
});

test("API requests still pass the proxy when Upstash refuses every command", async () => {
  const { default: proxy } = await import("@/src/proxy");
  const before = calls;
  const req = () =>
    new NextRequest("http://localhost/api/projects", {
      headers: { "x-real-ip": "203.0.113.7" },
    });

  const first = await proxy(req());
  assert.ok(calls > before, "the proxy did ask Upstash first");
  assert.equal(first.status, 200);
  assert.equal(first.headers.get("x-middleware-next"), "1");

  for (let i = 0; i < 9; i++) await proxy(req());
  const eleventh = await proxy(req());
  assert.equal(eleventh.status, 429, "the memory count still limits to 10 a minute");
});

test("the list cache is skipped instead of failing when Upstash refuses", async () => {
  const { getCache, setCache } = await import("@/src/lib/cache");
  assert.equal(await getCache("http://localhost/api/projects"), null);
  await assert.doesNotReject(setCache("http://localhost/api/projects", [{ id: 1 }]));
});
