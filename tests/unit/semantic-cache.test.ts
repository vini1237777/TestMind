import assert from "node:assert/strict";
import http from "node:http";
import type { AddressInfo } from "node:net";
import { after, before, beforeEach, describe, test } from "node:test";
import Redis from "ioredis";

const REDIS_URL = "redis://127.0.0.1:6379/6";
const PROJECT = "a".repeat(24);
const OTHER_PROJECT = "b".repeat(24);

let server: http.Server;
let redis: Redis;
let chatCalls = 0;
let embedCalls = 0;
let embedStatus = 200;

// Three directions, so each test controls how alike two descriptions are.
const VECTORS: Record<string, number[]> = {
  checkout: [1, 0, 0],
  "checkout again": [0.99, 0.1, 0],
  login: [0, 1, 0],
};
const vectorFor = (input: string) => {
  const name = input.split("\n")[0];
  return VECTORS[name] ?? [0, 0, 1];
};

const CASES = [
  {
    id: "TC1",
    type: "happy" as const,
    title: "Pays by card",
    steps: ["Open cart"],
    expected: "Order created",
    samplePayload: {},
  },
];

before(async () => {
  server = http.createServer((req, res) => {
    let raw = "";
    req.on("data", (c) => (raw += c));
    req.on("end", () => {
      res.setHeader("content-type", "application/json");
      const body = JSON.parse(raw || "{}");
      if (req.url?.includes("embeddings")) {
        embedCalls += 1;
        res.statusCode = embedStatus;
        return res.end(
          JSON.stringify(
            embedStatus === 200
              ? {
                  data: [
                    {
                      // The SDK asks for base64 unless told otherwise, like the real API.
                      embedding:
                        body.encoding_format === "base64"
                          ? Buffer.from(
                              new Float32Array(vectorFor(body.input)).buffer,
                            ).toString("base64")
                          : vectorFor(body.input),
                    },
                  ],
                  model: body.model,
                }
              : { error: { message: "down" } },
          ),
        );
      }
      chatCalls += 1;
      res.end(
        JSON.stringify({
          model: "gpt-4o-mini",
          choices: [{ message: { content: JSON.stringify({ testCases: CASES }) } }],
          usage: { prompt_tokens: 1, completion_tokens: 1 },
        }),
      );
    });
  });
  await new Promise<void>((r) => server.listen(0, r));
  process.env.OPENAI_API_KEY = "test";
  process.env.OPENAI_BASE_URL = `http://127.0.0.1:${(server.address() as AddressInfo).port}/v1`;
  process.env.REDIS_URL = REDIS_URL;
  process.env.SEMANTIC_CACHE = "on";
  delete process.env.GEMINI_API_KEY;
  redis = new Redis(REDIS_URL);
});

beforeEach(async () => {
  await redis.flushdb();
  chatCalls = 0;
  embedCalls = 0;
  embedStatus = 200;
});

after(async () => {
  await redis.flushdb();
  redis.disconnect();
  server.closeAllConnections();
  server.close();
  setTimeout(() => process.exit(0), 50).unref();
});

const load = () => import("../../src/lib/ai/cache/semantic-cache");
const loadNode = () => import("../../src/lib/ai/graph/nodes/generate-test-cases");

async function seed(projectId = PROJECT, name = "checkout") {
  const { storeSemanticCache } = await load();
  await storeSemanticCache(projectId, vectorFor(name), CASES);
}

describe("vector helpers", () => {
  test("cosine similarity measures direction", async () => {
    const { cosineSimilarity } = await load();
    assert.ok(Math.abs(cosineSimilarity([1, 0], [2, 0]) - 1) < 1e-9);
    assert.equal(cosineSimilarity([1, 0], [0, 1]), 0);
    assert.equal(cosineSimilarity([1], [1, 2]), 0);
    assert.equal(cosineSimilarity([0, 0], [1, 1]), 0);
  });

  test("vectors survive being stored as text", async () => {
    const { decodeVector, encodeVector } = await load();
    const out = decodeVector(encodeVector([0.25, -0.5, 1]));
    assert.deepEqual(out, [0.25, -0.5, 1]);
  });
});

describe("lookup", () => {
  test("a close description is a hit", async () => {
    await seed();
    const { lookupSemanticCache } = await load();
    const { hit } = await lookupSemanticCache(PROJECT, "checkout again\nx");
    assert.ok(hit && hit.similarity >= 0.95);
    assert.equal(hit.testCases[0].title, "Pays by card");
  });

  test("a different description is a miss", async () => {
    await seed();
    const { lookupSemanticCache } = await load();
    const { hit, embedding } = await lookupSemanticCache(PROJECT, "login\nx");
    assert.equal(hit, null);
    assert.deepEqual(embedding, VECTORS.login);
  });

  test("one project never receives another project's cases", async () => {
    await seed(OTHER_PROJECT);
    const { lookupSemanticCache } = await load();
    const { hit } = await lookupSemanticCache(PROJECT, "checkout\nx");
    assert.equal(hit, null);
  });

  test("corrupt cached cases count as a miss", async () => {
    await seed();
    const key = (await redis.keys("semantic:v1:*:cases:*"))[0];
    await redis.set(key, '[{"nope":1}]');
    const { lookupSemanticCache } = await load();
    const { hit } = await lookupSemanticCache(PROJECT, "checkout\nx");
    assert.equal(hit, null);
  });

  test("a vector whose cases expired is cleaned up", async () => {
    await seed();
    await redis.del((await redis.keys("semantic:v1:*:cases:*"))[0]);
    const { lookupSemanticCache } = await load();
    const { hit } = await lookupSemanticCache(PROJECT, "checkout\nx");
    assert.equal(hit, null);
    assert.equal(await redis.hlen(`semantic:v1:${PROJECT}:vectors`), 0);
  });

  test("an embedding outage is a miss and not an error", async () => {
    embedStatus = 500;
    const { lookupSemanticCache } = await load();
    assert.deepEqual(await lookupSemanticCache(PROJECT, "checkout\nx"), {
      hit: null,
      embedding: null,
    });
  });
});

describe("storage", () => {
  test("each project keeps only its newest 200 entries, with a TTL", async () => {
    const { storeSemanticCache } = await load();
    for (let i = 0; i < 203; i++) {
      await storeSemanticCache(PROJECT, [1, 0, 0], CASES);
    }
    assert.equal(await redis.hlen(`semantic:v1:${PROJECT}:vectors`), 200);
    assert.equal(await redis.zcard(`semantic:v1:${PROJECT}:order`), 200);
    assert.equal((await redis.keys("semantic:v1:*:cases:*")).length, 200);
    assert.ok((await redis.ttl(`semantic:v1:${PROJECT}:vectors`)) > 0);
  });
});

describe("graph node", () => {
  const state = (over = {}) => ({
    featureName: "checkout",
    description: "x",
    projectId: PROJECT,
    ...over,
  });
  const run = async (over = {}) => {
    const { generateTestCasesNode } = await loadNode();
    return generateTestCasesNode(state(over) as never);
  };

  test("a miss calls the model, then a close repeat does not", async () => {
    await run();
    assert.equal(chatCalls, 1);
    const second = await run({ featureName: "checkout again" });
    assert.equal(chatCalls, 1);
    assert.equal(embedCalls, 2);
    assert.equal(second.generatedTestCases?.length, 1);
    assert.match(String(second.trace?.[0].output), /from cache/);
  });

  test("regenerating an existing suite always calls the model", async () => {
    await seed();
    await run({ suiteId: "c".repeat(24) });
    assert.equal(chatCalls, 1);
    assert.equal(embedCalls, 0);
  });

  test("a suite with review feedback always calls the model", async () => {
    await seed();
    await run({ lastFeedbackSummary: "Add refund cases" });
    assert.equal(chatCalls, 1);
    assert.equal(embedCalls, 0);
  });

  test("turned off, it never embeds", async () => {
    process.env.SEMANTIC_CACHE = "off";
    await run();
    process.env.SEMANTIC_CACHE = "on";
    assert.equal(chatCalls, 1);
    assert.equal(embedCalls, 0);
    assert.equal(await redis.dbsize(), 0);
  });

  test("an embedding outage still generates", async () => {
    embedStatus = 500;
    const out = await run();
    assert.equal(chatCalls, 1);
    assert.equal(out.generatedTestCases?.length, 1);
  });
});
