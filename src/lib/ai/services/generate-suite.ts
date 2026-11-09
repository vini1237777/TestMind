import type { TestCase } from "@/src/app/types/testmind";
import { completeJson } from "@/src/lib/ai/llm/complete-json";
import { buildGenerateTestsPrompt } from "@/src/lib/ai/prompts/generate-tests";
import { GenerateSuiteResponseSchema } from "@/src/lib/ai/schemas/test-case";
import { createRunLogger } from "@/src/lib/ai/utils/logger";
import type { LlmUsage } from "@/src/lib/ai/llm/openai";

type GenerateSuiteInput = {
  featureName: string;
  description: string;
  lastFeedbackSummary?: string;
  lastFeedbackScore?: number | null;
  retrievedCases?: { text: string }[];
};

export async function generateSuiteService({
  featureName,
  description,
  lastFeedbackSummary,
  lastFeedbackScore,
  retrievedCases,
}: GenerateSuiteInput): Promise<{ testCases: TestCase[]; usage: LlmUsage }> {
  const logger = createRunLogger("generate-suite");
  logger.start("Generating test suite", { featureName });

  const prompt = buildGenerateTestsPrompt({
    featureName,
    description,
    lastFeedbackSummary,
    lastFeedbackScore,
    retrievedCases,
  });

  const { data: validated, usage, provider } = await completeJson(prompt, GenerateSuiteResponseSchema);

  logger.end("Generated test suite successfully", {
    count: validated.testCases.length,
    provider,
  });

  return {
    testCases: validated.testCases.map((testCase) => ({
      ...testCase,
      samplePayload: testCase.samplePayload ?? {},
    })),
    usage,
  };
}
