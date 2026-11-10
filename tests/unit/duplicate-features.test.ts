import assert from "node:assert/strict";
import { spawn, type ChildProcess } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { after, before, beforeEach, describe, test } from "node:test";
import mongoose from "mongoose";
import { NextRequest } from "next/server";
import type { TestSuite as Suite } from "../../src/app/types/testmind";
import { versionsOf } from "../../src/lib/suites/versions";
import { signInAs } from "./helpers/session";

const PORT = 27096;
const PROJECT = "a".repeat(24);
const OTHER_PROJECT = "b".repeat(24);

let mongod: ChildProcess;
let dbPath: string;
let names: typeof import("../../src/lib/suites/names");
let Model: typeof import("../../src/app/models/TestSuite").default;
let actions: typeof import("../../src/app/actions/suites");
let route: typeof import("../../src/app/api/generate-tests/route");
let owner: Awaited<ReturnType<typeof signInAs>>;
const asOwner = <T>(work: () => Promise<T>) => owner.as(work);

before(async () => {
  dbPath = fs.mkdtempSync(path.join(os.tmpdir(), "testmind-dup-"));
  mongod = spawn("mongod", ["--dbpath", dbPath, "--port", String(PORT), "--bind_ip", "127.0.0.1", "--quiet"], {
    stdio: "ignore",
  });
  process.env.MONGODB_URI = `mongodb://127.0.0.1:${PORT}/testmind_dup_test`;
  delete process.env.REDIS_URL;
  delete process.env.RAG;

  names = await import("../../src/lib/suites/names");
  Model = (await import("../../src/app/models/TestSuite")).default;
  actions = await import("../../src/app/actions/suites");
  route = await import("../../src/app/api/generate-tests/route");

  for (let i = 0; i < 100; i++) {
    try {
      await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 500 });
      break;
    } catch {
      await new Promise((r) => setTimeout(r, 200));
    }
  }
  owner = await signInAs("owner@example.com");
  const Project = (await import("../../src/app/models/Project")).default;
  await Project.create({ _id: PROJECT, name: "Shop", ownerId: owner.id });
});

beforeEach(async () => {
  await Model.deleteMany({});
});

after(async () => {
  await mongoose.connection.dropDatabase().catch(() => {});
  await mongoose.disconnect();
  mongod?.kill("SIGKILL");
  fs.rmSync(dbPath, { recursive: true, force: true });
});

const save = (projectId: string, name: string) =>
  Model.create({ projectId, name, featureName: name });

describe("feature names", () => {
  test("ignores case and outer spaces inside a project", async () => {
    await save(PROJECT, "Login");
    assert.equal(await names.isFeatureNameTaken(PROJECT, " login "), true);
    assert.equal(await names.isFeatureNameTaken(PROJECT, "Logout"), false);
  });

  test("another project can use the same name", async () => {
    await save(OTHER_PROJECT, "Login");
    assert.equal(await names.isFeatureNameTaken(PROJECT, "Login"), false);
  });

  test("a suite does not conflict with itself", async () => {
    const own = await save(PROJECT, "Login");
    assert.equal(await names.isFeatureNameTaken(PROJECT, "Login", own._id.toString()), false);
  });
});

describe("creating a feature", () => {
  test("a repeated name returns a message and saves nothing", () => asOwner(async () => {
    await save(PROJECT, "Login");
    const result = await actions.createSuite({
      projectId: PROJECT,
      featureName: "LOGIN",
      description: "",
      testCases: [],
    });
    assert.deepEqual(result, { error: names.DUPLICATE_FEATURE_ERROR });
    assert.equal(await Model.countDocuments({ projectId: PROJECT }), 1);
  }));
});

describe("starting a generation", () => {
  const post = (body: object) =>
    route.POST(
      new NextRequest("http://test/api/generate-tests", {
        method: "POST",
        body: JSON.stringify({ description: "Sign in", projectId: PROJECT, ...body }),
      }),
    );

  test("renaming onto another feature is refused before the queue", () => asOwner(async () => {
    await save(PROJECT, "Login");
    const own = await save(PROJECT, "Sign up");
    const res = await post({ featureName: "login", suiteId: own._id.toString() });
    assert.equal(res.status, 409);
    assert.deepEqual(await res.json(), { error: names.DUPLICATE_FEATURE_ERROR });
  }));

  test("a new name with no suite id for an existing one is refused", () => asOwner(async () => {
    await save(PROJECT, "Login");
    assert.equal((await post({ featureName: "Login" })).status, 409);
  }));

  test("regenerating a suite under its own name goes on to the queue", () => asOwner(async () => {
    const own = await save(PROJECT, "Login");
    // No Redis here, so reaching the queue answers 503 instead of 409.
    const res = await post({ featureName: "Login", suiteId: own._id.toString() });
    assert.equal(res.status, 503);
  }));
});

describe("versions on the suite page", () => {
  const suite = (id: string, projectId: string, featureName: string, createdAt: string) =>
    ({ id, projectId, featureName, name: featureName, description: "", createdAt, testCases: [] }) as Suite;
  const own = suite("own", PROJECT, "Login", "2026-01-02");

  test("the opened suite stays when a cached list does not have it", () => {
    assert.deepEqual(versionsOf(own, []).map((s) => s.id), ["own"]);
  });

  test("the same name in another project is left out", () => {
    const other = suite("other", OTHER_PROJECT, "Login", "2026-01-03");
    assert.deepEqual(versionsOf(own, [own, other]).map((s) => s.id), ["own"]);
  });

  test("older versions in this project stay, newest first", () => {
    const old = suite("old", PROJECT, "Login", "2026-01-01");
    assert.deepEqual(versionsOf(own, [old, own]).map((s) => s.id), ["own", "old"]);
  });
});
