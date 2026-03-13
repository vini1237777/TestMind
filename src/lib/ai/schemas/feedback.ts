import { z } from "zod";
import { TestCaseSchema } from "./test-case";

export const FeedbackResultSchema = z.object({
  score: z.number().min(0).max(100),
  summary: z.string().min(1),
  missingAreas: z.array(z.string()).default([]),
  suggestions: z.array(z.string()).default([]),
  suggestedTestCases: z.array(TestCaseSchema).default([]),
});

export type ParsedFeedbackResult = z.infer<typeof FeedbackResultSchema>;
