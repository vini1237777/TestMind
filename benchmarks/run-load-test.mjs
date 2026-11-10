// Load test of the production build on this machine, with the same moving parts as
// Railway: the Next.js server, the BullMQ queue on Redis and the generation worker.
// MongoDB, Redis and the Upstash REST API are local, and OpenAI is replaced by
// benchmarks/mock-openai.mjs, so a run costs nothing.
//
//   npm run build && npm run bench:load
//
// MODE picks what to measure:
//   mixed (default)  readers and generations together, see benchmarks/load/k6-load.js
//   capacity         GET /api/projects at rising fixed rates, to find where p95 passes 1 s
//   fallback         generations while MOCK_OPENAI_FAIL_RATE of OpenAI answers fail (default 0.5)
//   lighthouse       Lighthouse on the home page, mobile and desktop
//
// Settings: DURATION (default 60s), READERS (50), GENERATIONS_PER_SECOND (2),
// MOCK_LLM_DELAY_MS (0), GENERATION_CONCURRENCY (3, the worker's setting),
// RATES for capacity (default 100,200,400,600,800,1000,1200).
import { spawn, execSync } from "node:child_process";
import { createHash, randomBytes } from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import mongoose from "mongoose";

const ROOT = path.resolve(import.meta.dirname, "..");
const OUT = path.join(ROOT, "benchmarks/results");
const MONGO_PORT = 27101;
const MONGO = `mongodb://127.0.0.1:${MONGO_PORT}/testmind_load`;
const QUEUE_REDIS = "redis://127.0.0.1:6379/10";
const REST_REDIS = "redis://127.0.0.1:6379/11";
const REST_PORT = 8078;
const MOCK_PORT = 8091;
const APP_PORT = 3459;
const BASE_URL = `http://127.0.0.1:${APP_PORT}`;

const MODE = process.env.MODE || "mixed";
const settings = {
  mode: MODE,
  openaiFailRate: MODE === "fallback" ? Number(process.env.MOCK_OPENAI_FAIL_RATE ?? 0.5) : 0,
  duration: process.env.DURATION || "60s",
  readers: Number(process.env.READERS || 50),
  generationsPerSecond: Number(process.env.GENERATIONS_PER_SECOND || 2),
  mockLlmDelayMs: Number(process.env.MOCK_LLM_DELAY_MS || 0),
  workerConcurrency: Number(process.env.GENERATION_CONCURRENCY || 3),
};

const children = new Set();
const pause = (ms) => new Promise((r) => setTimeout(r, ms));
process.on("exit", () => children.forEach((c) => c.kill("SIGKILL")));

function start(cmd, args, options = {}) {
  const child = spawn(cmd, args, { stdio: ["ignore", "ignore", "inherit"], ...options });
  children.add(child);
  return child;
}

async function waitFor(url) {
  for (let i = 0; i < 120; i++) {
    try {
      if ((await fetch(url)).ok) return;
    } catch {}
    await pause(250);
  }
  throw new Error(`Timed out waiting for ${url}`);
}

// Only what the app needs, so nothing from a developer's env files can point a
// load test at a live database or a paid API.
const appEnv = {
  PATH: process.env.PATH,
  HOME: process.env.HOME,
  NODE_ENV: "production",
  MONGODB_URI: MONGO,
  REDIS_URL: QUEUE_REDIS,
  UPSTASH_REDIS_REST_URL: `http://127.0.0.1:${REST_PORT}`,
  UPSTASH_REDIS_REST_TOKEN: "local",
  OPENAI_API_KEY: "mock",
  OPENAI_BASE_URL: `http://127.0.0.1:${MOCK_PORT}/v1`,
  // Gemini answers from the mock too, so the fallback path can be measured.
  GEMINI_API_KEY: MODE === "fallback" ? "mock" : "",
  GEMINI_BASE_URL: `http://127.0.0.1:${MOCK_PORT}`,
  SENTRY_DSN: "",
  NEXT_PUBLIC_SENTRY_DSN: "",
  RAG: "off",
  GENERATION_CONCURRENCY: String(settings.workerConcurrency),
};

// One user with a session and a project, written straight to the database.
async function seed() {
  await mongoose.connect(MONGO);
  await mongoose.connection.dropDatabase();
  const db = mongoose.connection;
  const userId = new mongoose.Types.ObjectId();
  await db.collection("users").insertOne({ _id: userId, email: "load@example.com", passwordHash: "scrypt:unused:unused" });
  const token = randomBytes(32).toString("base64url");
  await db.collection("sessions").insertOne({
    _id: createHash("sha256").update(token).digest("hex"),
    userId: String(userId),
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
  });
  const projectId = new mongoose.Types.ObjectId();
  await db.collection("projects").insertOne({ _id: projectId, name: "Load test", ownerId: String(userId), createdAt: new Date() });
  await mongoose.disconnect();
  return { token, projectId: String(projectId) };
}

async function main() {
  if (!fs.existsSync(path.join(ROOT, ".next/standalone/server.js"))) throw new Error("Run npm run build first");
  execSync("k6 version", { stdio: "ignore" });
  for (const db of [10, 11]) execSync(`redis-cli -n ${db} flushdb`, { stdio: "ignore" });
  fs.mkdirSync(OUT, { recursive: true });

  const dbPath = fs.mkdtempSync(path.join(os.tmpdir(), "testmind-load-"));
  start("mongod", ["--dbpath", dbPath, "--port", String(MONGO_PORT), "--bind_ip", "127.0.0.1", "--quiet"]);
  for (let i = 0; i < 60; i++) {
    try {
      await mongoose.connect(MONGO, { serverSelectionTimeoutMS: 500 });
      await mongoose.disconnect();
      break;
    } catch {
      await pause(500);
    }
  }
  const { token, projectId } = await seed();

  start("node", [path.join(ROOT, "benchmarks/upstash-local.mjs")], {
    env: { PATH: process.env.PATH, PORT: String(REST_PORT), LOCAL_REDIS_URL: REST_REDIS, CACHE_OFF: "0" },
  });
  start("node", [path.join(ROOT, "benchmarks/mock-openai.mjs")], {
    env: { PATH: process.env.PATH, MOCK_OPENAI_PORT: String(MOCK_PORT), MOCK_LLM_DELAY_MS: String(settings.mockLlmDelayMs),
      MOCK_OPENAI_FAIL_RATE: String(settings.openaiFailRate),
    },
  });
  start("node", ["server.js"], {
    cwd: path.join(ROOT, ".next/standalone"),
    env: { ...appEnv, PORT: String(APP_PORT), HOSTNAME: "127.0.0.1" },
  });
  // One process, so stopping it stops the worker (the tsx command starts a second one).
  start(process.execPath, ["--import", "tsx", "src/worker/generation-worker.ts"], { cwd: ROOT, env: appEnv });
  await waitFor(`${BASE_URL}/api/health`);

  const stamp = new Date().toISOString().slice(0, 16).replace(/[:T]/g, "-");
  const machine = `${os.cpus()[0]?.model}, ${os.cpus().length} cores, ${Math.round(os.totalmem() / 2 ** 30)} GB`;
  const setup = { ...settings, date: new Date().toISOString(), machine, node: process.version, webProcesses: 1, llm: "mock-openai.mjs" };
  const k6Env = { ...process.env, BASE_URL, SESSION_TOKEN: token, PROJECT_ID: projectId };

  // k6 exits non zero when a threshold fails. The summary is still written, and kept.
  const k6 = (script, summary, env) => {
    try {
      execSync(`k6 run --quiet --summary-export ${JSON.stringify(summary)} ${script}`, {
        cwd: ROOT,
        stdio: "inherit",
        env: { ...k6Env, ...env },
      });
    } catch {
      console.error("k6 reported a failed threshold. See the summary above.");
    }
    return JSON.parse(fs.readFileSync(summary, "utf8"));
  };
  const save = (name, data) => {
    const file = path.join(OUT, `${name}-${stamp}.json`);
    fs.writeFileSync(file, JSON.stringify(data, null, 2));
    console.log(`Saved ${path.relative(ROOT, file)}`);
  };

  if (MODE === "mixed" || MODE === "fallback") {
    const summary = path.join(OUT, `.k6-${stamp}.json`);
    const raw = k6("benchmarks/load/k6-load.js", summary, {
      DURATION: settings.duration,
      READERS: String(settings.readers),
      GENERATIONS_PER_SECOND: String(settings.generationsPerSecond),
    });
    // How many model answers each provider gave, counted by the mock.
    raw.setup = { ...setup, modelAnswers: await (await fetch(`http://127.0.0.1:${MOCK_PORT}/stats`)).json() };
    save(MODE === "mixed" ? "load" : "fallback", raw);
    fs.rmSync(summary, { force: true });
  }

  if (MODE === "capacity") {
    const rates = (process.env.RATES || "100,200,400,600,800,1000,1200").split(",").map(Number);
    const steps = [];
    for (const rate of rates) {
      const tmp = path.join(OUT, `.capacity-${rate}.json`);
      const m = k6("benchmarks/load/k6-capacity.js", tmp, { RATE: String(rate), DURATION: process.env.DURATION || "30s" }).metrics;
      fs.rmSync(tmp, { force: true });
      const step = {
        targetRate: rate,
        achievedRate: Math.round(m.http_reqs.rate),
        p50Ms: Math.round(m.http_req_duration.med),
        p95Ms: Math.round(m.http_req_duration["p(95)"]),
        failedShare: m.http_req_failed.value,
        // Requests k6 could not start because every virtual user was still waiting.
        dropped: m.dropped_iterations?.count ?? 0,
      };
      steps.push(step);
      console.log(JSON.stringify(step));
      await pause(5_000);
    }
    save("capacity", { setup, endpoint: "GET /api/projects", steps });
  }

  if (MODE === "lighthouse") {
    // The standalone server serves static files only from its own folder.
    fs.cpSync(path.join(ROOT, ".next/static"), path.join(ROOT, ".next/standalone/.next/static"), { recursive: true });
    fs.cpSync(path.join(ROOT, "public"), path.join(ROOT, ".next/standalone/public"), { recursive: true });
    const results = {};
    for (const preset of ["mobile", "desktop"]) {
      const out = path.join(os.tmpdir(), `lh-${preset}.json`);
      execSync(
        `npx --yes lighthouse@13.6.0 ${BASE_URL}/ --quiet --output=json --output-path=${out} --only-categories=performance,accessibility,best-practices,seo --chrome-flags="--headless=new" ${preset === "desktop" ? "--preset=desktop" : ""}`,
        { cwd: ROOT, stdio: "inherit" },
      );
      const report = JSON.parse(fs.readFileSync(out, "utf8"));
      const audit = (id) => report.audits[id]?.numericValue;
      results[preset] = {
        scores: Object.fromEntries(Object.entries(report.categories).map(([k, v]) => [k, Math.round(v.score * 100)])),
        firstContentfulPaintMs: Math.round(audit("first-contentful-paint")),
        largestContentfulPaintMs: Math.round(audit("largest-contentful-paint")),
        totalBlockingTimeMs: Math.round(audit("total-blocking-time")),
        cumulativeLayoutShift: Number(audit("cumulative-layout-shift")?.toFixed(3)),
        speedIndexMs: Math.round(audit("speed-index")),
      };
      fs.rmSync(out, { force: true });
    }
    save("lighthouse", { setup: { ...setup, lighthouse: "13.6.0", page: "/" }, ...results });
  }

  fs.rmSync(dbPath, { recursive: true, force: true });
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
