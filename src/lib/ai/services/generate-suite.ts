import type { TestCase } from "@/src/app/types/testmind";
import { getOpenAIClient } from "@/src/lib/ai/llm/openai";
import { buildGenerateTestsPrompt } from "@/src/lib/ai/prompts/generate-tests";
import { GenerateSuiteResponseSchema } from "@/src/lib/ai/schemas/test-case";
import { createRunLogger } from "@/src/lib/ai/utils/logger";
import { parseJson } from "@/src/lib/ai/utils/parse-json";

type GenerateSuiteInput = {
  featureName: string;
  description: string;
  lastFeedbackSummary?: string;
  lastFeedbackScore?: number | null;
};

export async function generateSuiteService({
  featureName,
  description,
  lastFeedbackSummary,
  lastFeedbackScore,
}: GenerateSuiteInput): Promise<TestCase[]> {
  const logger = createRunLogger("generate-suite");
  logger.start("Generating test suite", { featureName });

  const client = getOpenAIClient();
  const prompt = buildGenerateTestsPrompt({
    featureName,
    description,
    lastFeedbackSummary,
    lastFeedbackScore,
  });

  const completion = await client.chat.completions.create({
    model: "gpt-4o-mini",
    response_format: { type: "json_object" },
    messages: [{ role: "user", content: prompt }],
  });

  const raw = completion.choices[0]?.message?.content;
  if (!raw) throw new Error("No response from AI.");

  const parsed = parseJson<unknown>(raw);
  const validated = GenerateSuiteResponseSchema.parse(parsed);

  logger.end("Generated test suite successfully", {
    count: validated.testCases.length,
  });

  return validated.testCases.map((testCase) => ({
    ...testCase,
    samplePayload: testCase.samplePayload ?? {},
  }));
}
