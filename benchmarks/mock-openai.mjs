// Stands in for the OpenAI and Gemini APIs during load tests, so a run costs nothing
// and the numbers measure TestMind rather than the model. MOCK_LLM_DELAY_MS sets how
// long each answer takes. MOCK_OPENAI_FAIL_RATE (0 to 1) makes that share of OpenAI
// answers fail with a 500, to measure the Gemini fallback. GET /stats counts answers.
import http from "node:http";

const PORT = Number(process.env.MOCK_OPENAI_PORT || 8091);
const DELAY_MS = Number(process.env.MOCK_LLM_DELAY_MS || 0);
const FAIL_RATE = Number(process.env.MOCK_OPENAI_FAIL_RATE || 0);
const DIMENSIONS = 256;
const stats = { openaiServed: 0, openaiFailed: 0, geminiServed: 0 };

const TYPES = ["happy", "negative", "edge"];
const testCases = Array.from({ length: 6 }, (_, i) => ({
  id: `TC_${i + 1}`,
  type: TYPES[i % 3],
  title: `Checkout scenario ${i + 1}`,
  steps: ["Open the cart", "Pay with a saved card", "Check the receipt"],
  expected: "The order is created and the correct total is charged.",
  samplePayload: { amount: 1299 },
}));
const completion = JSON.stringify({ testCases });

// Random vectors, so two features never look alike to the semantic cache.
const vector = () => {
  const v = Array.from({ length: DIMENSIONS }, () => Math.random() - 0.5);
  const norm = Math.hypot(...v);
  return v.map((x) => x / norm);
};

const send = (res, body) => {
  res.setHeader("content-type", "application/json");
  res.end(JSON.stringify(body));
};

http
  .createServer((req, res) => {
    let raw = "";
    req.on("data", (chunk) => (raw += chunk));
    req.on("end", () => {
      const body = raw ? JSON.parse(raw) : {};
      if (req.url?.endsWith("/embeddings")) {
        const inputs = Array.isArray(body.input) ? body.input : [body.input];
        return send(res, {
          object: "list",
          model: body.model,
          data: inputs.map((_, index) => ({ object: "embedding", index, embedding: vector() })),
          usage: { prompt_tokens: 8, total_tokens: 8 },
        });
      }
      if (req.url === "/stats") return send(res, stats);
      if (req.url?.includes(":generateContent")) {
        return setTimeout(() => {
          stats.geminiServed++;
          send(res, {
            modelVersion: "mock-gemini",
            candidates: [{ content: { role: "model", parts: [{ text: completion }] }, finishReason: "STOP" }],
            usageMetadata: { promptTokenCount: 600, candidatesTokenCount: 400 },
          });
        }, DELAY_MS);
      }
      if (req.url?.endsWith("/chat/completions") && Math.random() < FAIL_RATE) {
        stats.openaiFailed++;
        res.statusCode = 500;
        return send(res, { error: { message: "mock outage", type: "server_error" } });
      }
      if (req.url?.endsWith("/chat/completions")) {
        stats.openaiServed++;
        return setTimeout(
          () =>
            send(res, {
              id: "mock",
              object: "chat.completion",
              created: Math.floor(Date.now() / 1000),
              model: "mock-gpt",
              choices: [{ index: 0, finish_reason: "stop", message: { role: "assistant", content: completion } }],
              usage: { prompt_tokens: 600, completion_tokens: 400, total_tokens: 1000 },
            }),
          DELAY_MS,
        );
      }
      res.statusCode = 404;
      send(res, { error: { message: `mock has no ${req.url}` } });
    });
  })
  .listen(PORT, "127.0.0.1", () => console.log(`mock OpenAI on ${PORT}, ${DELAY_MS} ms per answer`));
