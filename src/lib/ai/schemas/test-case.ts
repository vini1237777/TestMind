import { z } from "zod";

export const TestCaseSchema = z.object({
  id: z.string().min(1),
  type: z.enum(["happy", "negative", "edge"]),
  title: z.string().min(1),
  steps: z.array(z.string().min(1)).min(1),
  expected: z.string().min(1),
  samplePayload: z.record(z.string(), z.unknown()).optional().default({}),
});

export const GenerateSuiteResponseSchema = z.object({
  testCases: z.array(TestCaseSchema).min(1).max(8),
});

export type GeneratedTestCase = z.infer<typeof TestCaseSchema>;
export type GenerateSuiteResponse = z.infer<typeof GenerateSuiteResponseSchema>;
