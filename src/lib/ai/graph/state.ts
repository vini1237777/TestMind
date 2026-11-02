import type { FeedbackResult, TestCase } from "@/src/app/types/testmind";
import type { NodeTrace } from "@/src/lib/ai/graph/topology";

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
  trace: NodeTrace[];
};
