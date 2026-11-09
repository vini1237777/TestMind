import assert from "node:assert/strict";
import { describe, test } from "node:test";
import {
  AddCasesBodySchema,
  CreateProjectBodySchema,
  FeedbackReviewBodySchema,
  GenerateTestsBodySchema,
  parseBody,
} from "../../src/lib/api/request-schemas";

const ID = "a".repeat(24);
const CASE = {
  id: "TC1",
  type: "happy",
  title: "Pays by card",
  steps: ["Open cart"],
  expected: "Order is created",
};

const post = (body: string) =>
  new Request("http://test.local", { method: "POST", body });

describe("generate tests body", () => {
  const valid = { featureName: " Checkout ", description: "Pay", projectId: ID };

  test("trims text and treats an empty suite id as none", () => {
    const data = GenerateTestsBodySchema.parse({ ...valid, suiteId: "" });
    assert.equal(data.featureName, "Checkout");
    assert.equal(data.suiteId, undefined);
  });

  test("accepts null from a suite with no review yet", () => {
    const parsed = GenerateTestsBodySchema.safeParse({
      ...valid,
      suiteId: null,
      lastFeedbackSummary: null,
      lastFeedbackScore: null,
      lastReviewedAt: null,
    });
    assert.equal(parsed.success, true);
  });

  for (const [name, body] of Object.entries({
    "blank feature": { ...valid, featureName: "   " },
    "missing description": { featureName: "A", projectId: ID },
    "bad project id": { ...valid, projectId: "abc" },
    "query operator as project id": { ...valid, projectId: { $ne: null } },
    "bad suite id": { ...valid, suiteId: "abc" },
    "score out of range": { ...valid, lastFeedbackScore: 500 },
    "oversized description": { ...valid, description: "x".repeat(5001) },
  })) {
    test(`rejects ${name}`, () => {
      assert.equal(GenerateTestsBodySchema.safeParse(body).success, false);
    });
  }
});

describe("feedback review body", () => {
  const valid = { featureName: "A", description: "B", testCases: [CASE] };

  test("keeps fields it does not know about on a case", () => {
    const data = FeedbackReviewBodySchema.parse({
      ...valid,
      testCases: [{ ...CASE, _id: "kept" }],
    });
    assert.equal((data.testCases[0] as Record<string, unknown>)._id, "kept");
  });

  test("rejects no cases with the message the screen shows", () => {
    const parsed = FeedbackReviewBodySchema.safeParse({ ...valid, testCases: [] });
    assert.equal(
      parsed.error?.issues[0]?.message,
      "At least one test case is required for feedback review.",
    );
  });

  test("rejects more cases than a review should pay for", () => {
    const testCases = Array.from({ length: 101 }, () => CASE);
    assert.equal(
      FeedbackReviewBodySchema.safeParse({ ...valid, testCases }).success,
      false,
    );
  });
});

describe("other bodies", () => {
  test("add cases needs a real suite id", () => {
    const body = { suiteId: "nope", testCases: [CASE] };
    assert.equal(AddCasesBodySchema.safeParse(body).success, false);
  });

  test("a project needs a name", () => {
    assert.equal(CreateProjectBodySchema.safeParse({ name: " " }).success, false);
    assert.equal(CreateProjectBodySchema.safeParse({ name: "App" }).success, true);
  });
});

describe("parseBody", () => {
  test("returns the first problem as a 400", async () => {
    const result = await parseBody(post("{}"), CreateProjectBodySchema);
    assert.equal(result.ok, false);
    if (result.ok) return;
    assert.equal(result.response.status, 400);
    assert.deepEqual(await result.response.json(), {
      error: "Project name is required",
    });
  });

  test("answers bad JSON with a 400 and not a crash", async () => {
    const result = await parseBody(post("{not json"), CreateProjectBodySchema);
    assert.equal(result.ok, false);
    if (!result.ok) assert.equal(result.response.status, 400);
  });
});
