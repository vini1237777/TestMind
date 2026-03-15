import { Annotation } from "@langchain/langgraph";

export const SuiteGraphAnnotation = Annotation.Root({
  featureName: Annotation<string>({ reducer: (_, right) => right, default: () => "" }),
  description: Annotation<string>({ reducer: (_, right) => right, default: () => "" }),
  projectId: Annotation<string | undefined>({ reducer: (_, right) => right, default: () => undefined }),
  suiteId: Annotation<string | undefined>({ reducer: (_, right) => right, default: () => undefined }),
  currentTestCases: Annotation<any[]>({ reducer: (_, right) => right, default: () => [] }),
  generatedTestCases: Annotation<any[]>({ reducer: (_, right) => right, default: () => [] }),
  feedback: Annotation<any | null>({ reducer: (_, right) => right, default: () => null }),
  improvedTestCases: Annotation<any[]>({ reducer: (_, right) => right, default: () => [] }),
  lastFeedbackSummary: Annotation<string | undefined>({ reducer: (_, right) => right, default: () => undefined }),
  lastFeedbackScore: Annotation<number | null | undefined>({ reducer: (_, right) => right, default: () => null }),
  lastReviewedAt: Annotation<string | null | undefined>({ reducer: (_, right) => right, default: () => null }),
  actionType: Annotation<string | undefined>({ reducer: (_, right) => right, default: () => undefined }),
  errors: Annotation<string[]>({ reducer: (left, right) => [...left, ...right], default: () => [] }),
});
