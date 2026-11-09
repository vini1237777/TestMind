import { test, expect } from "@playwright/test";

const ID = "a".repeat(24);

// Each test has its own address, so the 10 a minute limiter does not interfere.
const headers = (n: number) => ({ "x-real-ip": `10.1.${Date.now() % 250}.${n}` });

test("a project without a name is refused", async ({ request }) => {
  const res = await request.post("/api/projects", {
    headers: headers(1),
    data: { name: "   " },
  });
  expect(res.status()).toBe(400);
  expect(await res.json()).toEqual({ error: "Project name is required" });
});

test("a body that is not JSON gets a 400 and not a crash", async ({ request }) => {
  const res = await request.post("/api/projects", {
    headers: { ...headers(2), "content-type": "application/json" },
    data: "{not json",
  });
  expect(res.status()).toBe(400);
});

test("generation refuses a bad project id before paying for a model call", async ({
  request,
}) => {
  const res = await request.post("/api/generate-tests", {
    headers: headers(3),
    data: { featureName: "A", description: "B", projectId: "abc" },
  });
  expect(res.status()).toBe(400);
  expect((await res.json()).error).toMatch(/invalid project/i);
});

test("a query operator is not accepted as a suite id", async ({ request }) => {
  const res = await request.post("/api/suites/add-cases", {
    headers: headers(4),
    data: { suiteId: { $ne: null }, testCases: [] },
  });
  expect(res.status()).toBe(400);
});

test("a review needs at least one test case", async ({ request }) => {
  const res = await request.post("/api/feedback-review", {
    headers: headers(5),
    data: { featureName: "A", description: "B", testCases: [], suiteId: ID },
  });
  expect(res.status()).toBe(400);
  expect((await res.json()).error).toMatch(/at least one test case/i);
});
