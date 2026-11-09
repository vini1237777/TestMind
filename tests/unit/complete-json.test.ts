import assert from "node:assert/strict";
import http from "node:http";
import type { AddressInfo } from "node:net";
import { after, before, beforeEach, describe, test } from "node:test";
import { z } from "zod";
import {
  AllProvidersFailedError,
  completeJson,
  DEFAULT_PROVIDERS,
  type LlmProvider,
} from "../../src/lib/ai/llm/complete-json";

const Schema = z.object({ ok: z.boolean() });
const GOOD = '{"ok":true}';

function provider(
  name: string,
  behave: () => Promise<string>,
  configured = true,
): LlmProvider & { calls: number } {
  const p = {
    name,
    calls: 0,
    isConfigured: () => configured,
    complete: async () => {
      p.calls += 1;
      return { text: await behave(), usage: { model: name } };
    },
  };
  return p;
}

const fail = (message: string) => async (): Promise<string> => {
  throw new Error(message);
};
const reply = (text: string) => async () => text;

describe("fallback order", () => {
  test("a working first provider means the second is never called", async () => {
    const a = provider("a", reply(GOOD));
    const b = provider("b", reply(GOOD));
    const out = await completeJson("p", Schema, [a, b]);
    assert.equal(out.provider, "a");
    assert.equal(b.calls, 0);
  });

  test("an outage moves on to the next provider", async () => {
    const b = provider("b", reply(GOOD));
    const out = await completeJson("p", Schema, [provider("a", fail("503")), b]);
    assert.equal(out.provider, "b");
    assert.deepEqual(out.data, { ok: true });
  });

  for (const [name, text] of [
    ["broken JSON", "{nope"],
    ["the wrong shape", '{"ok":"yes"}'],
    ["an empty reply", ""],
  ]) {
    test(`${name} moves on to the next provider`, async () => {
      const out = await completeJson("p", Schema, [
        provider("a", reply(text)),
        provider("b", reply(GOOD)),
      ]);
      assert.equal(out.provider, "b");
    });
  }

  test("a provider without a key is skipped and not called", async () => {
    const a = provider("a", reply(GOOD), false);
    const out = await completeJson("p", Schema, [a, provider("b", reply(GOOD))]);
    assert.equal(a.calls, 0);
    assert.equal(out.provider, "b");
  });

  test("no keys at all gives a clear error", async () => {
    await assert.rejects(
      completeJson("p", Schema, [provider("a", reply(GOOD), false)]),
      /No AI provider is configured/,
    );
  });

  test("when every provider fails the error names each one", async () => {
    await assert.rejects(
      completeJson("p", Schema, [
        provider("a", fail("rate limited")),
        provider("b", fail("timeout")),
      ]),
      (err: AllProvidersFailedError) => {
        assert.deepEqual(err.failures.map((f) => f.provider), ["a", "b"]);
        return true;
      },
    );
  });
});

// Real SDKs against a local server, to check the requests they really send.
describe("real SDK requests", () => {
  let server: http.Server;
  let openAiStatus = 200;
  let seen: { path: string; body: Record<string, any>; key?: string }[] = [];

  before(async () => {
    server = http.createServer((req, res) => {
      let raw = "";
      req.on("data", (c) => (raw += c));
      req.on("end", () => {
        const url = req.url ?? "";
        seen.push({
          path: url,
          body: JSON.parse(raw || "{}"),
          key: req.headers["x-goog-api-key"] as string | undefined,
        });
        res.setHeader("content-type", "application/json");
        if (url.includes("chat/completions")) {
          res.statusCode = openAiStatus;
          return res.end(
            openAiStatus === 200
              ? JSON.stringify({
                  model: "gpt-4o-mini",
                  choices: [{ message: { content: GOOD } }],
                  usage: { prompt_tokens: 3, completion_tokens: 4 },
                })
              : JSON.stringify({ error: { message: "down" } }),
          );
        }
        res.end(
          JSON.stringify({
            modelVersion: "gemini-2.5-flash",
            candidates: [{ content: { parts: [{ text: GOOD }] } }],
            usageMetadata: { promptTokenCount: 5, candidatesTokenCount: 6 },
          }),
        );
      });
    });
    await new Promise<void>((r) => server.listen(0, r));
    const base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
    process.env.OPENAI_API_KEY = "test-openai";
    process.env.OPENAI_BASE_URL = `${base}/v1`;
    process.env.GEMINI_API_KEY = "test-gemini";
    process.env.GEMINI_BASE_URL = base;
  });

  beforeEach(() => {
    seen = [];
    openAiStatus = 200;
  });

  after(() => {
    server.closeAllConnections();
    server.close();
  });

  test("OpenAI is used first, in JSON mode", async () => {
    const out = await completeJson("write tests", Schema);
    assert.equal(out.provider, "openai");
    assert.equal(out.usage.promptTokens, 3);
    assert.equal(seen.length, 1);
    assert.equal(seen[0].body.response_format.type, "json_object");
  });

  test("a 500 from OpenAI is served by Gemini, with no retry first", async () => {
    openAiStatus = 500;
    const out = await completeJson("write tests", Schema);
    assert.equal(out.provider, "gemini");
    assert.equal(out.usage.completionTokens, 6);
    assert.equal(seen.filter((s) => s.path.includes("chat/completions")).length, 1);
    const gemini = seen.at(-1)!;
    assert.match(gemini.path, /gemini-2\.5-flash:generateContent/);
    assert.equal(gemini.body.generationConfig.responseMimeType, "application/json");
    assert.equal(gemini.key, "test-gemini");
    assert.ok(!gemini.path.includes("test-gemini"));
  });

  test("the two default providers are OpenAI then Gemini", () => {
    assert.deepEqual(DEFAULT_PROVIDERS.map((p) => p.name), ["openai", "gemini"]);
  });
});
