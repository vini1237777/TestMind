"use server";

import { Types } from "mongoose";
import { connectDB } from "@/lib/mongodb";
import TestSuiteModel from "@/app/models/TestSuite";
import type { TestSuite, TestCase } from "@/app/types/testmind";
import { revalidatePath } from "next/cache";

export type TestSuiteDb = {
  _id: Types.ObjectId;
  projectId: Types.ObjectId;
  name: string;
  featureName: string;
  description?: string;
  testCases: (TestCase & { _id?: Types.ObjectId })[];
  createdAt?: Date;
  lastFeedbackScore: number;
  lastReviewedAt: string | null;
  lastFeedbackSummary: string;
};

function mapSuite(doc: TestSuiteDb): TestSuite {
  return {
    id: doc._id.toString(),
    projectId: doc.projectId.toString(),
    name: doc?.name,
    featureName: doc?.featureName,
    description: doc?.description ?? "",
    createdAt: doc?.createdAt?.toISOString() ?? new Date().toISOString(),
    lastFeedbackScore: doc?.lastFeedbackScore ?? null,
    lastReviewedAt: doc?.lastReviewedAt ?? null,
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

export async function getSuitesByProject(
  projectId: string
): Promise<TestSuite[]> {
  await connectDB();

  const docs = await TestSuiteModel.find({ projectId })
    .sort({ createdAt: -1 })
    .lean<TestSuiteDb[]>();

  return docs.map(mapSuite);
}

export async function getSuiteById(id: string): Promise<TestSuite | null> {
  if (!id || id === "undefined") return null;

  await connectDB();

  const doc = await TestSuiteModel.findById(id).lean<TestSuiteDb | null>();

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
}): Promise<TestSuite> {
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

  const doc = (await TestSuiteModel.create({
    projectId: new Types.ObjectId(projectId),
    name: featureName,
    featureName,
    description,
    testCases,
    lastFeedbackSummary: lastFeedbackSummary || "",
    lastFeedbackScore: lastFeedbackScore || null,
    lastReviewedAt: lastReviewedAt || null,
  })) as TestSuiteDb;

  revalidatePath(`/projects/${data.projectId}`);

  return mapSuite(doc);
}

export async function addTestCasesToSuite(
  suiteId: string,
  newCases: TestCase[]
): Promise<TestSuite> {
  await connectDB();

  const doc = await TestSuiteModel.findById(suiteId);
  if (!doc) {
    throw new Error("Suite not found");
  }

  const updatedCases = [...doc.testCases, ...newCases];

  doc.testCases = updatedCases;

  await doc.save();

  return mapSuite(doc.toObject());
}
