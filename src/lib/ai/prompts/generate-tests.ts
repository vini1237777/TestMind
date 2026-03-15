type BuildGenerateTestsPromptInput = {
  featureName: string;
  description: string;
  lastFeedbackSummary?: string;
  lastFeedbackScore?: number | null;
};

export function buildGenerateTestsPrompt({
  featureName,
  description,
  lastFeedbackSummary,
  lastFeedbackScore,
}: BuildGenerateTestsPromptInput) {
  const feedbackContext =
    lastFeedbackSummary || typeof lastFeedbackScore === "number"
      ? `
Previous review context:
- Last feedback score: ${lastFeedbackScore ?? "N/A"}
- Last feedback summary: ${lastFeedbackSummary ?? "N/A"}

Use this context to improve coverage and avoid repeating weak areas.
`
      : "";

  return `
You are a senior QA engineer designing test cases for a web application.

Your goal:
- Convert the following feature into a realistic, well-structured set of test cases.
- Include a mix of happy, negative, and edge cases.
- Focus on real user behavior, data variations, and validation.
- Improve quality using any prior feedback context if available.

Feature Name:
${featureName}

Feature Description:
${description}

${feedbackContext}

Requirements for test cases:
- Always generate between 4 and 8 test cases.
- Use a mix of "happy", "negative", and "edge" types.
- "happy" = valid inputs, expected successful flow.
- "negative" = invalid inputs, errors, security, validation failures.
- "edge" = boundary conditions, extreme values, weird but possible scenarios.
- Make every "title" very clear and specific.
- "steps" should be concrete, step-by-step user or system actions.
- "expected" should clearly describe the correct behavior or system result.
- Assume this is a modern web app with forms, buttons, API calls, and validation.

Response format (IMPORTANT):
- Respond with a single JSON object.
- NO explanation, NO prose, NO comments outside JSON.
- The JSON MUST have this exact schema:

{
  "testCases": [
    {
      "id": "TC_1",
      "type": "happy",
      "title": "Clear descriptive title here",
      "steps": [
        "Step 1: ...",
        "Step 2: ...",
        "Step 3: ..."
      ],
      "expected": "Clear description of what should happen.",
      "samplePayload": { "field1": "example value", "field2": 123 }
    }
  ]
}

Constraints:
- "id" should be sequential like "TC_1", "TC_2", "TC_3", etc.
- "type" must be one of: "happy", "negative", "edge".
- Do NOT add any extra fields.
- Do NOT wrap the JSON in backticks or markdown.
- Do NOT add any text before or after the JSON.
`;
}
