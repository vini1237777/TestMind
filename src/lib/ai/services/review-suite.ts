import type { FeedbackResult, TestCase } from "@/src/app/types/testmind";
import { getOpenAIClient } from "@/src/lib/ai/llm/openai";
import { buildReviewSuitePrompt } from "@/src/lib/ai/prompts/review-suite";
import { FeedbackResultSchema } from "@/src/lib/ai/schemas/feedback";
import { createRunLogger } from "@/src/lib/ai/utils/logger";
import { parseJson } from "@/src/lib/ai/utils/parse-json";
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

  const client = getOpenAIClient();
  const prompt = buildReviewSuitePrompt({ featureName, description, testCases });

  const completion = await client.chat.completions.create({
    model: "gpt-4o-mini",
    response_format: { type: "json_object" },
    messages: [{ role: "user", content: prompt }],
  });

  const raw = completion.choices[0]?.message?.content;
  if (!raw) throw new Error("No response from AI.");

  const parsed = parseJson<unknown>(raw);
  const validated = FeedbackResultSchema.parse(parsed);

  logger.end("Reviewed test suite successfully", {
    score: validated.score,
    suggestedCount: validated.suggestedTestCases.length,
  });

  const usage = {
    model: completion.model,
    promptTokens: completion.usage?.prompt_tokens,
    completionTokens: completion.usage?.completion_tokens,
  };

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
