import type { FeedbackResult, TestCase } from "@/src/app/types/testmind";

export type SuiteGraphState = {
  featureName: string;
  description: string;
  projectId?: string;
  suiteId?: string;
  generatedTestCases?: TestCase[];
  feedback?: FeedbackResult;
  lastFeedbackSummary?: string;
  lastFeedbackScore?: number | null;
  lastReviewedAt?: string | null;
};
