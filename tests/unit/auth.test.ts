import assert from "node:assert/strict";
import { spawn, type ChildProcess } from "node:child_process";
import fs from "node:fs";
import http from "node:http";
import type { AddressInfo } from "node:net";
import os from "node:os";
import path from "node:path";
import { after, before, beforeEach, describe, test } from "node:test";
import mongoose from "mongoose";
import { NextRequest } from "next/server";
import { signInAs } from "./helpers/session";

const PORT = 27098;
let mongod: ChildProcess;
let redis: http.Server;
let dbPath: string;

// A small stand in for the Upstash REST API that keeps keys, so cache sharing shows up.
const store = new Map<string, string>();
const glob = (pattern: string) => new RegExp(`^${pattern.replace(/[.+^${}()|[\]\\]/g, "\\$&").replace(/\*/g, ".*")}$`);
function run([cmd, ...args]: string[]): unknown {
  switch (String(cmd).toLowerCase()) {
    case "get":
      return store.get(args[0]) ?? null;
    case "set":
      store.set(args[0], args[1]);
      return "OK";
    case "del":
      return args.filter((key) => store.delete(key)).length;
    case "scan": {
      const match = args[args.indexOf("match") + 1] ?? args[args.indexOf("MATCH") + 1] ?? "*";
      return ["0", [...store.keys()].filter((key) => glob(match).test(key))];
    }
    default:
      return "OK";
  }
}

let password: typeof import("../../src/lib/auth/password");
let session: typeof import("../../src/lib/auth/session");
let signup: typeof import("../../src/app/api/auth/signup/route");
let login: typeof import("../../src/app/api/auth/login/route");
let logout: typeof import("../../src/app/api/auth/logout/route");
let projects: typeof import("../../src/app/actions/projects");
let suites: typeof import("../../src/app/actions/suites");
let example: typeof import("../../src/app/actions/example");
let projectsRoute: typeof import("../../src/app/api/projects/route");
let suitesRoute: typeof import("../../src/app/api/suites/route");
let addCasesRoute: typeof import("../../src/app/api/suites/add-cases/route");
let generateRoute: typeof import("../../src/app/api/generate-tests/route");
let reviewRoute: typeof import("../../src/app/api/feedback-review/route");
let User: typeof import("../../src/app/models/User").default;
let Session: typeof import("../../src/app/models/Session").default;
let Project: typeof import("../../src/app/models/Project").default;
let Suite: typeof import("../../src/app/models/TestSuite").default;

before(async () => {
  dbPath = fs.mkdtempSync(path.join(os.tmpdir(), "testmind-auth-"));
  mongod = spawn("mongod", ["--dbpath", dbPath, "--port", String(PORT), "--bind_ip", "127.0.0.1", "--quiet"], {
    stdio: "ignore",
  });
  process.env.MONGODB_URI = `mongodb://127.0.0.1:${PORT}/testmind_auth_test`;
  redis = http.createServer((req, res) => {
    let body = "";
    req.on("data", (chunk) => (body += chunk));
    req.on("end", () => {
      const parsed = body ? JSON.parse(body) : [];
      res.setHeader("content-type", "application/json");
      res.end(
        JSON.stringify(
          req.url?.includes("pipeline") || req.url?.includes("multi-exec")
            ? (parsed as string[][]).map((command) => ({ result: run(command) }))
            : { result: run(parsed) },
        ),
      );
    });
  });
  await new Promise<void>((resolve) => redis.listen(0, resolve));
  process.env.UPSTASH_REDIS_REST_URL = `http://127.0.0.1:${(redis.address() as AddressInfo).port}`;
  process.env.UPSTASH_REDIS_REST_TOKEN = "not-used";
  delete process.env.REDIS_URL;
  delete process.env.RAG;
  delete process.env.OWNER_EMAIL;

  password = await import("../../src/lib/auth/password");
  session = await import("../../src/lib/auth/session");
  signup = await import("../../src/app/api/auth/signup/route");
  login = await import("../../src/app/api/auth/login/route");
  logout = await import("../../src/app/api/auth/logout/route");
  projects = await import("../../src/app/actions/projects");
  suites = await import("../../src/app/actions/suites");
  example = await import("../../src/app/actions/example");
  projectsRoute = await import("../../src/app/api/projects/route");
  suitesRoute = await import("../../src/app/api/suites/route");
  addCasesRoute = await import("../../src/app/api/suites/add-cases/route");
  generateRoute = await import("../../src/app/api/generate-tests/route");
  reviewRoute = await import("../../src/app/api/feedback-review/route");
  User = (await import("../../src/app/models/User")).default;
  Session = (await import("../../src/app/models/Session")).default;
  Project = (await import("../../src/app/models/Project")).default;
  Suite = (await import("../../src/app/models/TestSuite")).default;

  for (let i = 0; i < 100; i++) {
    try {
      await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 500 });
      break;
    } catch {
      await new Promise((r) => setTimeout(r, 200));
    }
  }
  await User.init();
});

beforeEach(async () => {
  store.clear();
  delete process.env.OWNER_EMAIL;
  await Promise.all([User.deleteMany({}), Session.deleteMany({}), Project.deleteMany({}), Suite.deleteMany({})]);
});

after(async () => {
  redis?.closeAllConnections();
  redis?.close();
  await mongoose.connection.dropDatabase().catch(() => {});
  await mongoose.disconnect();
  mongod?.kill("SIGKILL");
  fs.rmSync(dbPath, { recursive: true, force: true });
});

const json = (url: string, body: unknown, cookie?: string) =>
  new NextRequest(`http://test${url}`, {
    method: "POST",
    headers: { "content-type": "application/json", ...(cookie ? { cookie } : {}) },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });

const cookieOf = (res: Response) => res.headers.get("set-cookie") ?? "";
const tokenOf = (res: Response) => cookieOf(res).match(/tm_session=([^;]+)/)?.[1] ?? "";

describe("passwords", () => {
  test("a password checks against its own hash only", async () => {
    const hash = await password.hashPassword("correct horse");
    assert.match(hash, /^scrypt:/);
    assert.ok(!hash.includes("correct horse"));
    assert.equal(await password.verifyPassword("correct horse", hash), true);
    assert.equal(await password.verifyPassword("correct horsE", hash), false);
    assert.notEqual(await password.hashPassword("correct horse"), hash);
  });

  test("a damaged hash is a failed check, not an error", async () => {
    assert.equal(await password.verifyPassword("anything", "plain"), false);
    assert.equal(await password.verifyPassword("anything", "scrypt::"), false);
  });
});

describe("sign up and sign in", () => {
  test("sign up stores a hash and sets a private session cookie", async () => {
    const res = await signup.POST(json("/api/auth/signup", { email: " Asha@Example.com ", password: "long enough" }));
    assert.equal(res.status, 201);
    assert.deepEqual(await res.json(), { user: { email: "asha@example.com" } });

    const cookie = cookieOf(res);
    assert.match(cookie, /tm_session=/);
    assert.match(cookie, /HttpOnly/i);
    assert.match(cookie, /SameSite=lax/i);

    const saved = await User.findOne({ email: "asha@example.com" }).select("+passwordHash").lean<{ passwordHash: string }>();
    assert.ok(saved && !saved.passwordHash.includes("long enough"));
    // Only a hash of the token is stored.
    assert.equal(await Session.countDocuments({ _id: tokenOf(res) }), 0);
    assert.equal((await session.userFromToken(tokenOf(res)))?.email, "asha@example.com");
  });

  test("an email can hold one account, whatever its case", async () => {
    await signup.POST(json("/api/auth/signup", { email: "asha@example.com", password: "long enough" }));
    const res = await signup.POST(json("/api/auth/signup", { email: "ASHA@example.com", password: "another one" }));
    assert.equal(res.status, 409);
    assert.equal((await res.json()).field, "email");
    assert.equal(await User.countDocuments(), 1);
  });

  test("a short password and a bad email are named on their field", async () => {
    const short = await signup.POST(json("/api/auth/signup", { email: "asha@example.com", password: "short" }));
    assert.equal(short.status, 400);
    assert.equal((await short.json()).field, "password");
    const bad = await signup.POST(json("/api/auth/signup", { email: "asha", password: "long enough" }));
    assert.equal((await bad.json()).field, "email");
    const broken = await signup.POST(json("/api/auth/signup", "{not json"));
    assert.equal(broken.status, 400);
    assert.equal(await User.countDocuments(), 0);
  });

  test("a wrong password and an unknown email get the same answer", async () => {
    await signup.POST(json("/api/auth/signup", { email: "asha@example.com", password: "long enough" }));
    const wrong = await login.POST(json("/api/auth/login", { email: "asha@example.com", password: "not the one" }));
    const unknown = await login.POST(json("/api/auth/login", { email: "nobody@example.com", password: "not the one" }));
    const short = await login.POST(json("/api/auth/login", { email: "asha@example.com", password: "x" }));
    for (const res of [wrong, unknown, short]) {
      assert.equal(res.status, 401);
      assert.deepEqual(await res.json(), { error: "Email or password is incorrect." });
      assert.equal(cookieOf(res), "");
    }
  });

  test("the right password signs in with any case of the email", async () => {
    await signup.POST(json("/api/auth/signup", { email: "asha@example.com", password: "long enough" }));
    const res = await login.POST(json("/api/auth/login", { email: "Asha@Example.COM", password: "long enough" }));
    assert.equal(res.status, 200);
    assert.equal((await session.userFromToken(tokenOf(res)))?.email, "asha@example.com");
  });
});

describe("sessions", () => {
  test("a changed, unknown or overlong token signs no one in", async () => {
    const asha = await signInAs("asha@example.com");
    assert.equal((await session.userFromToken(asha.token))?.id, asha.id);
    assert.equal(await session.userFromToken(asha.token.slice(0, -1) + (asha.token.endsWith("A") ? "B" : "A")), null);
    assert.equal(await session.userFromToken("made-up"), null);
    assert.equal(await session.userFromToken("x".repeat(500)), null);
    assert.equal(await session.userFromToken(""), null);
  });

  test("an expired session is refused before MongoDB removes it", async () => {
    const asha = await signInAs("asha@example.com");
    await Session.updateMany({}, { expiresAt: new Date(Date.now() - 1000) });
    assert.equal(await session.userFromToken(asha.token), null);
  });

  test("after sign out the same cookie no longer works", async () => {
    const asha = await signInAs("asha@example.com");
    const res = await logout.POST(json("/api/auth/logout", {}, `tm_session=${asha.token}`));
    assert.equal(res.status, 200);
    assert.match(cookieOf(res), /tm_session=;/);
    assert.equal(await session.userFromToken(asha.token), null);
  });

  test("a session ends when its user is gone", async () => {
    const asha = await signInAs("asha@example.com");
    await User.deleteMany({});
    assert.equal(await session.userFromToken(asha.token), null);
  });
});

describe("access between users", () => {
  // Asha owns a project with one feature. Ben is signed in and tries to reach it.
  async function setup() {
    const asha = await signInAs("asha@example.com");
    const ben = await signInAs("ben@example.com");
    const project = await asha.as(() => projects.createProject({ name: "Shop", description: "Asha's" }));
    const created = await asha.as(() =>
      suites.createSuite({
        projectId: project.id,
        featureName: "Pay",
        description: "Pay by card",
        testCases: [{ id: "TC_1", type: "happy", title: "Pays", steps: ["Pay"], expected: "Paid", samplePayload: {} }],
      }),
    );
    assert.ok("suite" in created);
    return { asha, ben, projectId: project.id, suiteId: created.suite.id };
  }

  test("a new project belongs to whoever made it", async () => {
    const { asha, projectId } = await setup();
    assert.equal((await Project.findById(projectId).lean<{ ownerId: string }>())?.ownerId, asha.id);
  });

  test("another user cannot read, change or delete a project", async () => {
    const { asha, ben, projectId } = await setup();
    await ben.as(async () => {
      assert.deepEqual(await projects.getProjects(), []);
      assert.equal(await projects.getProjectById(projectId), null);
      assert.deepEqual(await projects.updateProject(projectId, { name: "Mine" }), { error: "This project no longer exists." });
      assert.deepEqual(await projects.deleteProject(projectId), { error: "This project no longer exists." });
    });
    assert.equal((await Project.findById(projectId).lean<{ name: string }>())?.name, "Shop");
    assert.equal((await asha.as(() => projects.getProjects())).length, 1);
  });

  test("another user cannot read or change a feature or its cases", async () => {
    const { ben, projectId, suiteId } = await setup();
    const gone = { error: "This feature no longer exists." };
    const edit = { type: "edge" as const, title: "Changed", steps: ["x"], expected: "y" };
    await ben.as(async () => {
      assert.deepEqual(await suites.getSuitesByProject(projectId), []);
      assert.equal(await suites.getSuiteById(suiteId), null);
      assert.deepEqual(await suites.editFeature(suiteId, { name: "Mine", description: "" }), gone);
      assert.deepEqual(await suites.deleteFeature(suiteId), gone);
      assert.deepEqual(await suites.updateTestCase(suiteId, "TC_1", edit), gone);
      assert.deepEqual(await suites.deleteTestCase(suiteId, "TC_1"), gone);
      assert.equal(await suites.addTestCasesToSuite(suiteId, []), null);
      assert.deepEqual(
        await suites.createSuite({ projectId, featureName: "Mine", description: "", testCases: [] }),
        { error: "This project no longer exists." },
      );
    });
    const suite = await Suite.findById(suiteId).lean<{ featureName: string; testCases: { title: string }[] }>();
    assert.equal(suite?.featureName, "Pay");
    assert.equal(suite?.testCases[0].title, "Pays");
    assert.equal(await Suite.countDocuments(), 1);
  });

  test("the API answers another user's ids as not found, before any model call", async () => {
    const { ben, projectId, suiteId } = await setup();
    await ben.as(async () => {
      const generate = await generateRoute.POST(
        json("/api/generate-tests", { projectId, featureName: "Refunds", description: "Refund a payment" }),
      );
      assert.equal(generate.status, 404);

      const review = await reviewRoute.POST(
        json("/api/feedback-review", {
          projectId,
          suiteId,
          featureName: "Pay",
          description: "Pay by card",
          testCases: [{ title: "Pays", steps: ["Pay"], expected: "Paid", type: "happy" }],
        }),
      );
      assert.equal(review.status, 404);

      const add = await addCasesRoute.POST(
        json("/api/suites/add-cases", {
          suiteId,
          testCases: [{ id: "TC_9", title: "Extra", steps: ["x"], expected: "y", type: "edge" }],
        }),
      );
      assert.equal(add.status, 404);

      const list = await suitesRoute.GET(new NextRequest(`http://test/api/suites?projectId=${projectId}`));
      assert.deepEqual(await list.json(), { suites: [] });
    });
    assert.equal((await Suite.findById(suiteId).lean<{ testCases: unknown[] }>())?.testCases.length, 1);
  });

  test("without a session the API asks to sign in", async () => {
    const { projectId } = await setup();
    await session.withSessionToken("", async () => {
      assert.equal((await projectsRoute.GET(new NextRequest("http://test/api/projects"))).status, 401);
      assert.equal((await projectsRoute.POST(json("/api/projects", { name: "Anon" }))).status, 401);
      assert.equal((await suitesRoute.GET(new NextRequest("http://test/api/suites"))).status, 401);
      const generate = await generateRoute.POST(
        json("/api/generate-tests", { projectId, featureName: "Refunds", description: "Refund" }),
      );
      assert.equal(generate.status, 401);
      assert.deepEqual(await example.openExample(), { error: "Please sign in again." });
      await assert.rejects(projects.createProject({ name: "Anon" }));
    });
    assert.equal(await Project.countDocuments({ name: "Anon" }), 0);
  });

  test("one user's cached project list is never served to another", async () => {
    const { asha, ben } = await setup();
    const list = (user: typeof asha) =>
      user.as(async () => (await (await projectsRoute.GET(new NextRequest("http://test/api/projects"))).json()).projects);

    assert.equal((await list(asha)).length, 1);
    assert.ok([...store.keys()].some((key) => key.includes("/api/projects")), "the list was cached");
    assert.deepEqual(await list(ben), []);
    // Asha's cached list is still hers.
    assert.equal((await list(asha))[0].name, "Shop");
  });

  test("each user gets their own example project", async () => {
    const { asha, ben } = await setup();
    const a = await asha.as(() => example.openExample());
    const b = await ben.as(() => example.openExample());
    assert.ok("projectId" in a && "projectId" in b);
    assert.notEqual(a.projectId, b.projectId);
    // Opening it again reuses the same one.
    const again = await asha.as(() => example.openExample());
    assert.ok("projectId" in again);
    assert.equal(again.projectId, a.projectId);
  });
});

describe("projects from before sign in", () => {
  test("go to the owner account when it signs up", async () => {
    process.env.OWNER_EMAIL = "Owner@Example.com";
    await Project.create([{ name: "Old shop" }, { name: "Old clinic", ownerId: null }]);

    const stranger = await signup.POST(json("/api/auth/signup", { email: "someone@example.com", password: "long enough" }));
    assert.equal(stranger.status, 201);
    assert.equal(await Project.countDocuments({ ownerId: { $exists: true, $ne: null } }), 0);

    const owner = await signup.POST(json("/api/auth/signup", { email: "owner@example.com", password: "long enough" }));
    const ownerId = String((await User.findOne({ email: "owner@example.com" }))?._id);
    assert.equal(owner.status, 201);
    assert.equal(await Project.countDocuments({ ownerId }), 2);
  });

  test("stay unclaimed when no owner email is set", async () => {
    await Project.create({ name: "Old shop" });
    await signup.POST(json("/api/auth/signup", { email: "owner@example.com", password: "long enough" }));
    assert.equal(await Project.countDocuments({ ownerId: { $exists: true } }), 0);
  });

  test("a project someone owns is never moved", async () => {
    const asha = await signInAs("asha@example.com");
    await Project.create({ name: "Asha's", ownerId: asha.id });
    process.env.OWNER_EMAIL = "owner@example.com";
    await signup.POST(json("/api/auth/signup", { email: "owner@example.com", password: "long enough" }));
    assert.equal(await Project.countDocuments({ ownerId: asha.id }), 1);
  });
});
