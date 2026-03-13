import type { TestCase } from "@/src/app/types/testmind";

type BuildReviewSuitePromptInput = {
  featureName: string;
  description: string;
  testCases: TestCase[];
};

export function buildReviewSuitePrompt({
  featureName,
  description,
  testCases,
}: BuildReviewSuitePromptInput) {
  return `
You are a senior QA lead reviewing a test suite for a web application feature.

Your job:
- Review the given feature description and existing test cases.
- Identify coverage gaps and missing scenarios.
- Suggest improvements and extra test cases if needed.

Input:
- Feature Name: ${featureName}
- Feature Description: ${description}
- Existing Test Cases (JSON):
${JSON.stringify(testCases, null, 2)}

You MUST respond as a single JSON object only, no prose, no markdown, no comments.

JSON shape:
{
  "score": 85,
  "summary": "Short summary of how good the current coverage is.",
  "missingAreas": [
    "What types of scenarios are missing or weak"
  ],
  "suggestions": [
    "Concrete recommendations to improve this suite"
  ],
  "suggestedTestCases": [
    {
      "id": "TC_extra_1",
      "type": "edge",
      "title": "Clear descriptive title",
      "steps": ["Step 1", "Step 2"],
      "expected": "Expected behavior here",
      "samplePayload": {
        "field1": "value"
      }
    }
  ]
}

Rules:
- score MUST be between 0 and 100
- type MUST be one of: "happy", "negative", "edge"
- suggestedTestCases can be empty if coverage is already excellent
- Do not include any extra fields or text outside JSON.
`;
}
