import type { FeedbackResult, TestCase } from "@/src/app/types/testmind";

export type GraphActionType =
  | "initial_generation"
  | "review"
  | "ai_improvement"
  | "manual_edit"
  | "restore";

export type SuiteGraphState = {
  featureName: string;
  description: string;
  projectId?: string;
  suiteId?: string;
  currentTestCases: TestCase[];
  generatedTestCases: TestCase[];
  feedback: FeedbackResult | null;
  improvedTestCases: TestCase[];
  lastFeedbackSummary?: string;
  lastFeedbackScore?: number | null;
  lastReviewedAt?: string | null;
  actionType?: GraphActionType;
  errors: string[];
};
