import { Types } from "mongoose";
import TestSuite from "@/src/app/models/TestSuite";
import type { TestCase } from "@/src/app/types/testmind";
import type { RunTrace } from "@/src/lib/ai/graph/topology";
import { runGenerationWorkflow } from "@/src/lib/ai/services/suite-orchestrator/run-generation";
import { clearListCache } from "@/src/lib/cache";
import { connectDB } from "@/src/lib/mongodb";

export type GenerationInput = {
  featureName: string;
  description: string;
  projectId: string;
  suiteId?: string;
  lastFeedbackSummary?: string;
  lastFeedbackScore?: number | null;
  lastReviewedAt?: string | null;
};

export type GenerationResult = {
  suiteId: string;
  testCases: TestCase[];
  projectId: string;
  createdAt: string;
  lastFeedbackSummary: string;
  lastFeedbackScore: number | null;
  lastReviewedAt: string | null;
  workflow: "langgraph_generation";
  trace: RunTrace;
};

type SuiteDoc = {
  _id: Types.ObjectId;
  projectId: Types.ObjectId | string;
  testCases?: TestCase[];
  createdAt?: Date;
  lastFeedbackSummary?: string;
  lastFeedbackScore?: number | null;
  lastReviewedAt?: Date | string | null;
};

function toResult(doc: SuiteDoc, testCases: TestCase[], trace: RunTrace): GenerationResult {
  return {
    suiteId: doc._id.toString(),
    testCases,
    projectId: doc.projectId.toString(),
    createdAt: doc.createdAt?.toISOString?.() ?? new Date().toISOString(),
    lastFeedbackSummary: doc.lastFeedbackSummary ?? "",
    lastFeedbackScore: doc.lastFeedbackScore ?? null,
    lastReviewedAt:
      doc.lastReviewedAt instanceof Date
        ? doc.lastReviewedAt.toISOString()
        : doc.lastReviewedAt ?? null,
    workflow: "langgraph_generation",
    trace,
  };
}

// Runs outside Next.js too, so it uses the model directly and leaves page
// revalidation to the caller.
export async function generateAndSaveSuite(input: GenerationInput): Promise<GenerationResult> {
  const { featureName, description, projectId, suiteId, lastFeedbackSummary, lastFeedbackScore, lastReviewedAt } = input;

  const { testCases, trace } = await runGenerationWorkflow({
    featureName,
    description,
    projectId,
    suiteId,
    lastFeedbackSummary,
    lastFeedbackScore,
  });

  await connectDB();

  if (suiteId) {
    const updated = await TestSuite.findByIdAndUpdate(
      suiteId,
      {
        name: featureName,
        featureName,
        description,
        testCases,
        createdAt: new Date(),
        lastFeedbackSummary: lastFeedbackSummary ?? "",
        lastFeedbackScore: lastFeedbackScore ?? null,
        lastReviewedAt: lastReviewedAt ?? null,
      },
      { new: true },
    ).lean<SuiteDoc>();

    if (updated) {
      await clearListCache();
      return toResult(updated, (updated.testCases as TestCase[]) || [], trace);
    }
  }

  const created = (await TestSuite.create({
    projectId: new Types.ObjectId(projectId),
    name: featureName,
    featureName,
    description,
    testCases,
    lastFeedbackSummary: lastFeedbackSummary || "",
    lastFeedbackScore: lastFeedbackScore ?? null,
    lastReviewedAt: lastReviewedAt || null,
  })) as unknown as SuiteDoc;

  await clearListCache();
  return toResult(created, testCases, trace);
}
