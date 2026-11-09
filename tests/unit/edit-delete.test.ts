import assert from "node:assert/strict";
import { spawn, type ChildProcess } from "node:child_process";
import fs from "node:fs";
import http from "node:http";
import type { AddressInfo } from "node:net";
import os from "node:os";
import path from "node:path";
import { after, before, beforeEach, describe, test } from "node:test";
import mongoose from "mongoose";
import { signInAs } from "./helpers/session";

const PORT = 27093;
let mongod: ChildProcess;
let redis: http.Server;
let dbPath: string;
let projects: typeof import("../../src/app/actions/projects");
let suites: typeof import("../../src/app/actions/suites");
let Project: typeof import("../../src/app/models/Project").default;
let Suite: typeof import("../../src/app/models/TestSuite").default;
let Chunk: typeof import("../../src/app/models/TestCaseChunk").default;
let Feature: typeof import("../../src/app/models/Feature").default;
let EXAMPLE_NAME: string;
let owner: Awaited<ReturnType<typeof signInAs>>;
const asOwner = <T>(work: () => Promise<T>) => owner.as(work);

const testCase = (id: string, title: string) => ({
  id,
  type: "happy" as const,
  title,
  steps: ["Open", "Save"],
  expected: "Saved",
  samplePayload: {},
});

before(async () => {
  dbPath = fs.mkdtempSync(path.join(os.tmpdir(), "testmind-edit-"));
  mongod = spawn("mongod", ["--dbpath", dbPath, "--port", String(PORT), "--bind_ip", "127.0.0.1", "--quiet"], {
    stdio: "ignore",
  });
  process.env.MONGODB_URI = `mongodb://127.0.0.1:${PORT}/testmind_edit_test`;
  // An empty stand in for the Upstash REST cache, which every write clears.
  redis = http.createServer((req, res) => {
    req.resume();
    req.on("end", () => {
      res.setHeader("content-type", "application/json");
      res.end(JSON.stringify({ result: ["0", []] }));
    });
  });
  await new Promise<void>((resolve) => redis.listen(0, resolve));
  process.env.UPSTASH_REDIS_REST_URL = `http://127.0.0.1:${(redis.address() as AddressInfo).port}`;
  process.env.UPSTASH_REDIS_REST_TOKEN = "not-used";
  delete process.env.RAG;
  projects = await import("../../src/app/actions/projects");
  suites = await import("../../src/app/actions/suites");
  Project = (await import("../../src/app/models/Project")).default;
  Suite = (await import("../../src/app/models/TestSuite")).default;
  Chunk = (await import("../../src/app/models/TestCaseChunk")).default;
  Feature = (await import("../../src/app/models/Feature")).default;
  EXAMPLE_NAME = (await import("../../src/app/lib/example")).EXAMPLE.project;
  for (let i = 0; i < 100; i++) {
    try {
      await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 500 });
      break;
    } catch {
      await new Promise((r) => setTimeout(r, 200));
    }
  }
  owner = await signInAs("owner@example.com");
});

beforeEach(async () => {
  await Promise.all([Project.deleteMany({}), Suite.deleteMany({}), Chunk.deleteMany({}), Feature.deleteMany({})]);
});

after(async () => {
  redis?.closeAllConnections();
  redis?.close();
  await mongoose.connection.dropDatabase().catch(() => {});
  await mongoose.disconnect();
  mongod?.kill("SIGKILL");
  fs.rmSync(dbPath, { recursive: true, force: true });
});

const chunk = (projectId: string, suiteId: string, n: number) =>
  Chunk.create({ _id: `${suiteId}-${n}`, projectId, suiteId, text: "case", embedding: [0.1] });

describe("projects", () => {
  test("a project can be renamed", () => asOwner(async () => {
    const p = await Project.create({ ownerId: owner.id, name: "Shop" });
    const result = await projects.updateProject(p._id.toString(), { name: " Store ", description: "Online" });
    assert.ok("project" in result);
    assert.equal(result.project.name, "Store");
    assert.equal((await Project.findById(p._id))?.description, "Online");
  }));

  test("an empty name and a missing project are refused", () => asOwner(async () => {
    const p = await Project.create({ ownerId: owner.id, name: "Shop" });
    assert.ok("error" in (await projects.updateProject(p._id.toString(), { name: "  " })));
    assert.ok("error" in (await projects.updateProject("not-an-id", { name: "X" })));
    assert.ok("error" in (await projects.deleteProject(new mongoose.Types.ObjectId().toString())));
  }));

  test("the example project cannot be renamed or deleted", () => asOwner(async () => {
    const example = await Project.create({ ownerId: owner.id, name: EXAMPLE_NAME });
    const other = await Project.create({ ownerId: owner.id, name: "Shop" });
    assert.ok("error" in (await projects.updateProject(example._id.toString(), { name: "Mine" })));
    assert.ok("error" in (await projects.deleteProject(example._id.toString())));
    assert.ok("error" in (await projects.updateProject(other._id.toString(), { name: EXAMPLE_NAME })));
    assert.equal(await Project.countDocuments(), 2);
  }));

  test("deleting a project removes only its own data", () => asOwner(async () => {
    const shop = (await Project.create({ ownerId: owner.id, name: "Shop" }))._id.toString();
    const clinic = (await Project.create({ ownerId: owner.id, name: "Clinic" }))._id.toString();
    const a = await Suite.create({ projectId: shop, name: "Pay", featureName: "Pay", testCases: [testCase("TC_1", "A"), testCase("TC_2", "B")] });
    const b = await Suite.create({ projectId: clinic, name: "Book", featureName: "Book", testCases: [testCase("TC_1", "C")] });
    await chunk(shop, a._id.toString(), 1);
    await chunk(clinic, b._id.toString(), 1);
    await Feature.create({ projectId: shop, name: "Pay" });

    assert.deepEqual(await projects.deleteProject(shop), { deleted: { suites: 1, cases: 2 } });
    assert.equal(await Project.countDocuments({ _id: shop }), 0);
    assert.equal(await Suite.countDocuments({ projectId: shop }), 0);
    assert.equal(await Chunk.countDocuments({ projectId: shop }), 0);
    assert.equal(await Feature.countDocuments({ projectId: shop }), 0);
    assert.equal(await Suite.countDocuments({ projectId: clinic }), 1);
    assert.equal(await Chunk.countDocuments({ projectId: clinic }), 1);
  }));
});

describe("features", () => {
  const project = "a".repeat(24);
  beforeEach(async () => {
    await Project.create({ _id: project, name: "Shop", ownerId: owner.id });
  });

  test("a new name applies to every version and the description to one", () => asOwner(async () => {
    const v1 = await Suite.create({ projectId: project, name: "Pay", featureName: "Pay", description: "old" });
    const v2 = await Suite.create({ projectId: project, name: "Pay", featureName: "Pay", description: "old" });
    assert.deepEqual(await suites.editFeature(v2._id.toString(), { name: "Card payment", description: "new" }), { ok: true });
    assert.equal(await Suite.countDocuments({ featureName: "Card payment" }), 2);
    assert.equal((await Suite.findById(v1._id))?.description, "old");
    assert.equal((await Suite.findById(v2._id))?.description, "new");
  }));

  test("a name used by another feature is refused, a change of case is not", () => asOwner(async () => {
    await Suite.create({ projectId: project, name: "Login", featureName: "Login" });
    const pay = await Suite.create({ projectId: project, name: "Pay", featureName: "Pay" });
    assert.ok("error" in (await suites.editFeature(pay._id.toString(), { name: "login", description: "" })));
    assert.deepEqual(await suites.editFeature(pay._id.toString(), { name: "PAY", description: "" }), { ok: true });
  }));

  test("deleting a feature removes all its versions and chunks only", () => asOwner(async () => {
    const v1 = await Suite.create({ projectId: project, name: "Pay", featureName: "Pay" });
    const v2 = await Suite.create({ projectId: project, name: "Pay", featureName: "Pay" });
    const other = await Suite.create({ projectId: project, name: "Login", featureName: "Login" });
    await chunk(project, v1._id.toString(), 1);
    await chunk(project, v2._id.toString(), 1);
    await chunk(project, other._id.toString(), 1);

    assert.deepEqual(await suites.deleteFeature(v1._id.toString()), { projectId: project, versions: 2 });
    assert.equal(await Suite.countDocuments(), 1);
    assert.deepEqual((await Chunk.find().lean()).map((c) => c.suiteId), [other._id.toString()]);
  }));
});

describe("test cases", () => {
  const project = "a".repeat(24);
  beforeEach(async () => {
    await Project.create({ _id: project, name: "Shop", ownerId: owner.id });
  });
  const make = () =>
    Suite.create({ projectId: project, name: "Pay", featureName: "Pay", testCases: [testCase("TC_1", "A"), testCase("TC_2", "B")] });

  test("a case can be edited and blank steps are dropped", () => asOwner(async () => {
    const s = await make();
    const result = await suites.updateTestCase(s._id.toString(), "TC_2", {
      type: "edge",
      title: " Pay twice ",
      steps: ["Open", " ", "Press pay twice"],
      expected: "Charged once",
    });
    assert.ok("testCases" in result);
    assert.deepEqual(result.testCases[1], { ...testCase("TC_2", "Pay twice"), type: "edge", steps: ["Open", "Press pay twice"], expected: "Charged once" });
    assert.equal(result.testCases[0].title, "A");
  }));

  test("an incomplete edit and an unknown case are refused", () => asOwner(async () => {
    const s = await make();
    const id = s._id.toString();
    assert.ok("error" in (await suites.updateTestCase(id, "TC_1", { type: "happy", title: "", steps: ["x"], expected: "y" })));
    assert.ok("error" in (await suites.updateTestCase(id, "TC_1", { type: "wrong" as "happy", title: "t", steps: ["x"], expected: "y" })));
    assert.ok("error" in (await suites.deleteTestCase(id, "TC_9")));
    assert.equal((await Suite.findById(id))?.testCases[0].title, "A");
  }));

  test("a case can be deleted", () => asOwner(async () => {
    const s = await make();
    const result = await suites.deleteTestCase(s._id.toString(), "TC_1");
    assert.ok("testCases" in result);
    assert.deepEqual(result.testCases.map((c) => c.id), ["TC_2"]);
  }));
});
