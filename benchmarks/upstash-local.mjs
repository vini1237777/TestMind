// Speaks the Upstash REST protocol on top of a local Redis, so the benchmark runs
// the deployed code with no live service. With CACHE_OFF=1 it hides the list cache
// (keys are request URLs), so every request goes to MongoDB.
import http from "node:http";
import Redis from "ioredis";

const redis = new Redis(process.env.LOCAL_REDIS_URL);
const cacheOff = process.env.CACHE_OFF === "1";
const isCacheKey = (key) => String(key).startsWith("http");

const encode = (value) => {
  if (typeof value === "string") {
    return value === "OK" ? value : Buffer.from(value).toString("base64");
  }
  return Array.isArray(value) ? value.map(encode) : value;
};

async function run([name, ...args]) {
  const command = String(name).toLowerCase();
  if (cacheOff && isCacheKey(args[0])) {
    if (command === "get") return null;
    if (command === "set") return "OK";
  }
  return redis.call(command, ...args.map(String));
}

const server = http.createServer((req, res) => {
  let body = "";
  req.on("data", (chunk) => (body += chunk));
  req.on("end", async () => {
    const base64 = req.headers["upstash-encoding"] === "base64";
    const reply = async (command) => {
      try {
        const result = await run(command);
        return { result: base64 ? encode(result) : result };
      } catch (err) {
        return { error: err.message };
      }
    };
    const input = JSON.parse(body || "[]");
    const output = req.url.startsWith("/pipeline") || req.url.startsWith("/multi-exec")
      ? await Promise.all(input.map(reply))
      : await reply(input);
    const failed = !Array.isArray(output) && output.error;
    res.writeHead(failed ? 400 : 200, { "content-type": "application/json" });
    res.end(JSON.stringify(output));
  });
});

server.listen(Number(process.env.PORT));
