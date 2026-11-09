"use server";

import TestCaseChunk from "@/src/app/models/TestCaseChunk";
import { refreshPaths } from "@/src/lib/revalidate";
import { DUPLICATE_FEATURE_ERROR, isFeatureNameTaken } from "@/src/lib/suites/names";
import { Types } from "mongoose";
import { connectDB } from "@/src/lib/mongodb";
import TestSuiteModel from "@/src/app/models/TestSuite";
import type { TestSuite, TestCase } from "@/src/app/types/testmind";
import { revalidatePath } from "next/cache";
import { syncSuiteChunks } from "@/src/lib/ai/rag/chunks";
import { clearListCache, getCache, setCache } from "@/src/lib/cache";

export type TestSuiteDb = {
  _id: Types.ObjectId;
  projectId: Types.ObjectId | string;
  name: string;
  featureName: string;
  description?: string;
  testCases: (TestCase & { _id?: Types.ObjectId })[];
  createdAt?: Date;
  lastFeedbackScore?: number | null;
  lastReviewedAt?: Date | string | null;
  lastFeedbackSummary?: string;
};

function mapSuite(doc: TestSuiteDb): TestSuite {
  const reviewedAt =
    doc?.lastReviewedAt instanceof Date
      ? doc.lastReviewedAt.toISOString()
      : doc?.lastReviewedAt ?? null;

  return {
    id: doc._id.toString(),
    projectId: typeof doc.projectId === "string" ? doc.projectId : doc.projectId.toString(),
    name: doc?.name,
    featureName: doc?.featureName,
    description: doc?.description ?? "",
    createdAt: doc?.createdAt?.toISOString() ?? new Date().toISOString(),
    lastFeedbackScore: doc?.lastFeedbackScore ?? null,
    lastReviewedAt: reviewedAt,
    lastFeedbackSummary: doc?.lastFeedbackSummary ?? "",
    testCases: (doc?.testCases || []).map((tc) => ({
      id: tc.id,
      type: tc.type,
      title: tc.title,
      steps: tc.steps,
      expected: tc.expected,
      samplePayload: tc.samplePayload ?? {},
    })),
  };
}

// Under the /api/suites prefix, so clearListCache removes it after any suite write.
const projectSuitesKey = (projectId: string) => `/api/suites/project/${projectId}`;

export async function getSuitesByProject(projectId: string): Promise<TestSuite[]> {
  const cacheKey = projectSuitesKey(projectId);
  const cached = await getCache(cacheKey);
  if (cached) {
    const res = await cached.json();
    return res;
  }

  await connectDB();
  const docs = await TestSuiteModel.find({ projectId }).sort({ createdAt: -1 }).lean<TestSuiteDb[]>();
  await setCache(cacheKey, docs.map(mapSuite), 300);
  return docs.map(mapSuite);
}

export async function getSuiteById(id: string): Promise<TestSuite | null> {
  if (!id || id === "undefined") return null;

  const cached = await getCache(id);
  if (cached) {
    const res = await cached.json();
    return res;
  }

  await connectDB();
  const doc = await TestSuiteModel.findById(id).lean<TestSuiteDb | null>();
  await setCache(id, doc ? mapSuite(doc) : null, 300);
  return doc ? mapSuite(doc) : null;
}

export async function createSuite(data: {
  projectId: string;
  featureName: string;
  description: string;
  testCases: TestCase[];
  lastFeedbackSummary?: string;
  lastFeedbackScore?: number | null;
  lastReviewedAt?: string | null;
}): Promise<{ suite: TestSuite } | { error: string }> {
  const {
    projectId,
    featureName,
    description,
    testCases,
    lastFeedbackSummary,
    lastFeedbackScore,
    lastReviewedAt,
  } = data;

  if (!projectId) throw new Error("projectId is required");
  if (!featureName.trim()) throw new Error("featureName is required");

  await connectDB();

  // Returned, not thrown, because production hides the message of a thrown error.
  if (await isFeatureNameTaken(projectId, featureName)) {
    return { error: DUPLICATE_FEATURE_ERROR };
  }

  const doc = (await TestSuiteModel.create({
    projectId: new Types.ObjectId(projectId),
    name: featureName.trim(),
    featureName: featureName.trim(),
    description,
    testCases,
    lastFeedbackSummary: lastFeedbackSummary || "",
    lastFeedbackScore: lastFeedbackScore ?? null,
    lastReviewedAt: lastReviewedAt || null,
  })) as TestSuiteDb;

  await syncSuiteChunks({ suiteId: doc._id.toString(), projectId, testCases });
  await clearListCache();
  revalidatePath(`/projects/${data.projectId}`);
  return { suite: mapSuite(doc) };
}

export async function addTestCasesToSuite(suiteId: string, newCases: TestCase[]): Promise<TestSuite> {
  await connectDB();
  const doc = await TestSuiteModel.findById(suiteId);
  if (!doc) throw new Error("Suite not found");

  doc.testCases = [...doc.testCases, ...newCases];
  await doc.save();
  await syncSuiteChunks({
    suiteId,
    projectId: String(doc.projectId),
    testCases: doc.testCases,
  });
  await clearListCache();
  return mapSuite(doc.toObject());
}

const SUITE_NOT_FOUND = "This feature no longer exists.";
const CASE_TYPES = ["happy", "negative", "edge"] as const;

async function findSuite(suiteId: string) {
  if (!Types.ObjectId.isValid(suiteId)) return null;
  await connectDB();
  return TestSuiteModel.findById(suiteId);
}

// A feature is every version saved under one name, so a new name applies to all of them.
// The description belongs to the version being edited.
export async function editFeature(
  suiteId: string,
  data: { name: string; description: string },
): Promise<{ ok: true } | { error: string }> {
  const name = data.name?.trim() ?? "";
  const description = data.description?.trim() ?? "";
  if (!name) return { error: "Feature name is required." };
  if (name.length > 200 || description.length > 5000) return { error: "Feature name or description is too long." };

  const suite = await findSuite(suiteId);
  if (!suite) return { error: SUITE_NOT_FOUND };
  const projectId = String(suite.projectId);
  const oldName = String(suite.featureName);

  const renamed = name.toLowerCase() !== oldName.toLowerCase();
  if (renamed && (await isFeatureNameTaken(projectId, name))) {
    return { error: DUPLICATE_FEATURE_ERROR };
  }

  await TestSuiteModel.updateMany({ projectId, featureName: oldName }, { name, featureName: name });
  await TestSuiteModel.updateOne({ _id: suiteId }, { description });
  await clearListCache();
  refreshPaths(`/projects/${projectId}`);
  return { ok: true };
}

export async function deleteFeature(
  suiteId: string,
): Promise<{ projectId: string; versions: number } | { error: string }> {
  const suite = await findSuite(suiteId);
  if (!suite) return { error: SUITE_NOT_FOUND };
  const projectId = String(suite.projectId);

  const versions = await TestSuiteModel.find(
    { projectId, featureName: suite.featureName },
    { _id: 1 },
  ).lean<{ _id: Types.ObjectId }[]>();
  const ids = versions.map((version) => version._id.toString());

  await TestCaseChunk.deleteMany({ suiteId: { $in: ids } });
  await TestSuiteModel.deleteMany({ _id: { $in: ids } });
  await clearListCache();
  refreshPaths(`/projects/${projectId}`);
  return { projectId, versions: ids.length };
}

type CaseEdit = Pick<TestCase, "type" | "title" | "steps" | "expected">;

function cleanCase(data: CaseEdit): CaseEdit | { error: string } {
  const title = data.title?.trim() ?? "";
  const expected = data.expected?.trim() ?? "";
  const steps = (data.steps ?? []).map((step) => step.trim()).filter(Boolean);
  if (!CASE_TYPES.includes(data.type)) return { error: "Choose happy, negative or edge." };
  if (!title || !expected || !steps.length) return { error: "Title, steps and expected result are required." };
  if (title.length > 300 || expected.length > 2000 || steps.length > 30 || steps.some((s) => s.length > 500)) {
    return { error: "This test case is too long." };
  }
  return { type: data.type, title, steps, expected };
}

async function saveCases(
  suiteId: string,
  change: (cases: TestCase[]) => TestCase[] | { error: string },
): Promise<{ testCases: TestCase[] } | { error: string }> {
  const suite = await findSuite(suiteId);
  if (!suite) return { error: SUITE_NOT_FOUND };

  const next = change(suite.toObject().testCases as TestCase[]);
  if ("error" in next) return next;

  suite.testCases = next;
  await suite.save();
  const projectId = String(suite.projectId);
  await syncSuiteChunks({ suiteId, projectId, testCases: next });
  await clearListCache();
  refreshPaths(`/projects/${projectId}`);
  return { testCases: mapSuite(suite.toObject()).testCases };
}

export async function updateTestCase(suiteId: string, caseId: string, data: CaseEdit) {
  const cleaned = cleanCase(data);
  if ("error" in cleaned) return cleaned;
  return saveCases(suiteId, (cases) =>
    cases.some((item) => item.id === caseId)
      ? cases.map((item) => (item.id === caseId ? { ...item, ...cleaned } : item))
      : { error: "This test case no longer exists." },
  );
}

export async function deleteTestCase(suiteId: string, caseId: string) {
  return saveCases(suiteId, (cases) =>
    cases.some((item) => item.id === caseId)
      ? cases.filter((item) => item.id !== caseId)
      : { error: "This test case no longer exists." },
  );
}
