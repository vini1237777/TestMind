import type { FeedbackResult, TestCase } from "@/src/app/types/testmind";
import { completeJson } from "@/src/lib/ai/llm/complete-json";
import { buildReviewSuitePrompt } from "@/src/lib/ai/prompts/review-suite";
import { FeedbackResultSchema } from "@/src/lib/ai/schemas/feedback";
import { createRunLogger } from "@/src/lib/ai/utils/logger";
import type { LlmUsage } from "@/src/lib/ai/llm/openai";

type ReviewSuiteInput = {
  featureName: string;
  description: string;
  testCases: TestCase[];
};

export async function reviewSuiteService({
  featureName,
  description,
  testCases,
}: ReviewSuiteInput): Promise<{ feedback: FeedbackResult; usage: LlmUsage }> {
  const logger = createRunLogger("review-suite");
  logger.start("Reviewing test suite", {
    featureName,
    testCaseCount: testCases.length,
  });

  const prompt = buildReviewSuitePrompt({ featureName, description, testCases });

  const { data: validated, usage, provider } = await completeJson(prompt, FeedbackResultSchema);

  logger.end("Reviewed test suite successfully", {
    score: validated.score,
    suggestedCount: validated.suggestedTestCases.length,
    provider,
  });

  const feedback: FeedbackResult = {
    score: validated.score,
    summary: validated.summary,
    missingAreas: validated.missingAreas,
    suggestions: validated.suggestions,
    suggestedTestCases: validated.suggestedTestCases.map((testCase) => ({
      ...testCase,
      samplePayload: testCase.samplePayload ?? {},
    })),
  };

  return { feedback, usage };
}
