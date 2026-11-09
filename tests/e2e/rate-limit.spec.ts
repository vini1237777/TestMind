import { test, expect } from "@playwright/test";

test("an address over 10 requests a minute gets a 429", async ({ request }) => {
  const headers = { "x-real-ip": `10.2.${Date.now() % 250}.${Date.now() % 200}` };
  const statuses: number[] = [];
  for (let i = 0; i < 12; i++) {
    const res = await request.post("/api/projects", { headers, data: {} });
    statuses.push(res.status());
  }
  // The window can roll over mid test, so check the shape and not exact positions.
  expect(statuses.filter((s) => s === 400).length).toBeGreaterThanOrEqual(1);
  expect(statuses.at(-1)).toBe(429);
  expect(statuses).not.toContain(500);
});

test("the health check is never rate limited", async ({ request }) => {
  for (let i = 0; i < 15; i++) {
    const res = await request.get("/api/health", {
      headers: { "x-real-ip": "10.3.0.1" },
    });
    expect(res.status()).not.toBe(429);
  }
});
