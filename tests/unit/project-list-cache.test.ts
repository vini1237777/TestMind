import assert from "node:assert/strict";
import { spawn, type ChildProcess } from "node:child_process";
import fs from "node:fs";
import http from "node:http";
import type { AddressInfo } from "node:net";
import os from "node:os";
import path from "node:path";
import { after, before, test } from "node:test";
import mongoose from "mongoose";

// A local MongoDB and a small in memory stand in for the Upstash REST API.
const PORT = 27095;
const PROJECT = "a".repeat(24);
const OTHER_PROJECT = "b".repeat(24);

const store = new Map<string, string>();
let mongod: ChildProcess;
let dbPath: string;
let server: http.Server;

const encode = (value: unknown): unknown =>
  typeof value === "string"
    ? Buffer.from(value).toString("base64")
    : Array.isArray(value)
      ? value.map(encode)
      : value;

function run([command, ...args]: string[]) {
  switch (command.toLowerCase()) {
    case "get":
      return store.get(args[0]) ?? null;
    case "set":
      store.set(args[0], args[1]);
      return "OK";
    case "del":
      args.forEach((key) => store.delete(key));
      return args.length;
    case "scan": {
      const glob = args[args.indexOf("match") + 1] ?? args[args.indexOf("MATCH") + 1];
      const pattern = new RegExp(`^${glob.split("*").map((p) => p.replace(/[.+?^${}()|[\]\\]/g, "\\$&")).join(".*")}$`);
      return ["0", [...store.keys()].filter((key) => pattern.test(key))];
    }
    default:
      throw new Error(`Unexpected command ${command}`);
  }
}

before(async () => {
  dbPath = fs.mkdtempSync(path.join(os.tmpdir(), "testmind-cache-"));
  mongod = spawn("mongod", ["--dbpath", dbPath, "--port", String(PORT), "--bind_ip", "127.0.0.1", "--quiet"], {
    stdio: "ignore",
  });
  server = http.createServer((req, res) => {
    let raw = "";
    req.on("data", (chunk) => (raw += chunk));
    req.on("end", () => {
      const answer = (command: unknown[]) => {
        const result = run(command.map(String));
        return { result: req.headers["upstash-encoding"] ? encode(result) : result };
      };
      const body = JSON.parse(raw);
      res.setHeader("content-type", "application/json");
      res.end(JSON.stringify(req.url?.includes("pipeline") ? body.map(answer) : answer(body)));
    });
  });
  await new Promise<void>((resolve) => server.listen(0, resolve));
  process.env.UPSTASH_REDIS_REST_URL = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  process.env.UPSTASH_REDIS_REST_TOKEN = "not-used";
  process.env.MONGODB_URI = `mongodb://127.0.0.1:${PORT}/testmind_cache_test`;

  for (let i = 0; i < 100; i++) {
    try {
      await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 500 });
      break;
    } catch {
      await new Promise((r) => setTimeout(r, 200));
    }
  }
});

after(async () => {
  server?.closeAllConnections();
  server?.close();
  await mongoose.connection.dropDatabase().catch(() => {});
  await mongoose.disconnect();
  mongod?.kill("SIGKILL");
  fs.rmSync(dbPath, { recursive: true, force: true });
});

test("a new feature appears in its project after the list was cached", async () => {
  const Suite = (await import("../../src/app/models/TestSuite")).default;
  const { getSuitesByProject } = await import("../../src/app/actions/suites");
  const { clearListCache } = await import("../../src/lib/cache");

  assert.deepEqual(await getSuitesByProject(PROJECT), []);
  assert.deepEqual(await getSuitesByProject(OTHER_PROJECT), []);

  await Suite.create({ projectId: PROJECT, name: "Login", featureName: "Login" });
  await Suite.create({ projectId: OTHER_PROJECT, name: "Login", featureName: "Login" });
  await clearListCache();

  assert.deepEqual((await getSuitesByProject(PROJECT)).map((s) => s.featureName), ["Login"]);
  assert.deepEqual((await getSuitesByProject(OTHER_PROJECT)).map((s) => s.featureName), ["Login"]);
});
