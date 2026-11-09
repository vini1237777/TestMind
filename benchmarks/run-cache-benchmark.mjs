// Compares GET /api/suites with the Redis list cache off and on, against a local
// MongoDB and Redis. Requires `npm run build` first. Run with `npm run bench:cache`.
import { spawn, execSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import autocannon from "autocannon";
import mongoose from "mongoose";
import Redis from "ioredis";

const ROOT = path.resolve(import.meta.dirname, "..");
const OUT = path.join(ROOT, "benchmarks/results");
const LOCAL_REDIS = "redis://127.0.0.1:6379/8";
const MONGO_PORT = 27099;
const MONGO = `mongodb://127.0.0.1:${MONGO_PORT}/testmind_bench`;
const REST_PORT = 8079;
const APP_PORT = 3457;
const RUNS = Number(process.env.RUNS || 3);
const DURATION = Number(process.env.DURATION || 30);
const CONNECTIONS = 50;
const SUITES = 30;
const CASES_PER_SUITE = 8;

const children = new Set();
const pause = (ms) => new Promise((r) => setTimeout(r, ms));

function start(cmd, args, options = {}) {
  const child = spawn(cmd, args, { stdio: "ignore", ...options });
  children.add(child);
  return child;
}

function stop(child) {
  children.delete(child);
  child.kill("SIGTERM");
  return new Promise((r) => child.once("exit", r));
}

process.on("exit", () => children.forEach((c) => c.kill("SIGKILL")));

async function waitFor(url) {
  for (let i = 0; i < 120; i++) {
    try {
      if ((await fetch(url)).ok) return;
    } catch {}
    await pause(250);
  }
  throw new Error(`Timed out waiting for ${url}`);
}

async function seed() {
  await mongoose.connect(MONGO);
  await mongoose.connection.dropDatabase();
  const projectId = new mongoose.Types.ObjectId().toString();
  await mongoose.connection.collection("projects").insertOne({
    _id: new mongoose.Types.ObjectId(projectId),
    name: "Benchmark project",
    createdAt: new Date(),
  });
  const suites = Array.from({ length: SUITES }, (_, s) => ({
    name: `Suite ${s}`,
    featureName: `Feature ${s}`,
    description: "Checkout with saved cards, coupons and partial refunds.",
    projectId,
    createdAt: new Date(Date.now() - s * 60_000),
    testCases: Array.from({ length: CASES_PER_SUITE }, (_, c) => ({
      id: `TC${c}`,
      type: ["happy", "negative", "edge"][c % 3],
      title: `Customer completes checkout scenario ${c}`,
      steps: ["Open the cart", "Apply a coupon", "Pay with a saved card", "Check the receipt"],
      expected: "The order is created and the correct total is charged.",
      samplePayload: { cartId: `cart_${c}`, coupon: "SAVE10", amount: 1299 },
    })),
  }));
  await mongoose.connection.collection("testsuites").insertMany(suites);
  await mongoose.disconnect();
}

async function measure(label, cacheOff, run) {
  const redis = new Redis(LOCAL_REDIS);
  await redis.flushdb();
  redis.disconnect();

  const rest = start("node", [path.join(ROOT, "benchmarks/upstash-local.mjs")], {
    env: {
      ...process.env,
      PORT: String(REST_PORT),
      LOCAL_REDIS_URL: LOCAL_REDIS,
      CACHE_OFF: cacheOff ? "1" : "0",
    },
  });
  const app = start("node", ["server.js"], {
    cwd: path.join(ROOT, ".next/standalone"),
    env: {
      PATH: process.env.PATH,
      NODE_ENV: "production",
      PORT: String(APP_PORT),
      HOSTNAME: "127.0.0.1",
      MONGODB_URI: MONGO,
      UPSTASH_REDIS_REST_URL: `http://127.0.0.1:${REST_PORT}`,
      UPSTASH_REDIS_REST_TOKEN: "local",
      OPENAI_API_KEY: "not-used",
    },
  });
  await waitFor(`http://127.0.0.1:${APP_PORT}/api/health`);

  // Every request gets its own address, so the 10 a minute limiter still runs
  // but does not reject the load.
  let id = 0;
  const nextIp = () => {
    id += 1;
    return `10.${(id >> 16) & 255}.${(id >> 8) & 255}.${id & 255}`;
  };
  const result = await autocannon({
    url: `http://127.0.0.1:${APP_PORT}`,
    connections: CONNECTIONS,
    duration: DURATION,
    requests: [
      {
        method: "GET",
        path: "/api/suites",
        setupRequest: (req) => ({
          ...req,
          headers: { ...req.headers, "x-real-ip": nextIp() },
        }),
      },
    ],
  });

  await stop(app);
  await stop(rest);

  const summary = {
    label,
    run,
    connections: CONNECTIONS,
    durationSeconds: DURATION,
    requestsPerSecond: result.requests.average,
    latencyP50: result.latency.p50,
    latencyP97_5: result.latency.p97_5,
    latencyP99: result.latency.p99,
    ok: result["2xx"],
    notOk: result.non2xx,
    errors: result.errors,
    timeouts: result.timeouts,
  };
  fs.writeFileSync(path.join(OUT, `${label}-run${run}.json`), JSON.stringify(summary, null, 2));
  console.log(label, run, Math.round(summary.requestsPerSecond), "req/s", `${summary.notOk} not ok`);
  return summary;
}

async function main() {
  if (!fs.existsSync(path.join(ROOT, ".next/standalone/server.js"))) {
    throw new Error("Run npm run build first");
  }
  execSync("redis-cli ping", { stdio: "ignore" });
  fs.mkdirSync(OUT, { recursive: true });

  const dbPath = fs.mkdtempSync(path.join(os.tmpdir(), "testmind-bench-"));
  const mongo = start("mongod", ["--dbpath", dbPath, "--port", String(MONGO_PORT), "--bind_ip", "127.0.0.1", "--quiet"]);
  for (let i = 0; i < 60; i++) {
    try {
      await mongoose.connect(MONGO, { serverSelectionTimeoutMS: 500 });
      await mongoose.disconnect();
      break;
    } catch {
      await pause(500);
    }
  }
  await seed();

  const rows = [];
  for (const [label, cacheOff] of [["cache-off", true], ["cache-on", false]]) {
    const runs = [];
    for (let run = 1; run <= RUNS; run++) runs.push(await measure(label, cacheOff, run));
    const median = (key) => runs.map((r) => r[key]).sort((a, b) => a - b)[Math.floor(runs.length / 2)];
    const rates = runs.map((r) => r.requestsPerSecond);
    rows.push(
      `| ${label} | ${runs.length} | ${Math.round(median("requestsPerSecond"))} | ${Math.round(Math.min(...rates))} to ${Math.round(Math.max(...rates))} | ${median("latencyP50")} ms | ${median("latencyP99")} ms | ${runs.reduce((n, r) => n + r.notOk + r.errors, 0)} |`,
    );
  }
  console.log("| Setup | Runs | Median req/s | Range req/s | Median p50 | Median p99 | Failed |");
  console.log("|---|---|---|---|---|---|---|");
  console.log(rows.join("\n"));

  const redis = new Redis(LOCAL_REDIS);
  await redis.flushdb();
  redis.disconnect();
  await stop(mongo);
  fs.rmSync(dbPath, { recursive: true, force: true });
}

main().then(
  () => process.exit(0),
  (err) => {
    console.error(err);
    process.exit(1);
  },
);
