import { TestCase, TestSuite } from "@/app/types/testmind";
import { getDb } from "@/lib/mongodb";
import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

export async function POST(req: NextRequest) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error("Missing OPENAI_API_KEY");
    }

    const client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY!,
    });

    const body = await req.json();
    const { featureName, description, projectId } = body;

    const feature = String(featureName || "").trim();
    const desc = String(description || "").trim();

    if (!feature || !desc) {
      return NextResponse.json(
        { error: "Feature name and description are required." },
        { status: 400 }
      );
    }

    const prompt = `
    You are a senior QA engineer designing test cases for a web application.
    
    Your goal:
    - Convert the following feature into a realistic, well-structured set of test cases.
    - Include a mix of happy, negative, and edge cases.
    - Focus on real user behavior, data variations, and validation.
    
    Feature Name:
    ${featureName}
    
    Feature Description:
    ${description}
    
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
          "samplePayload": {
           "field1": "example value",
           "field2": 123
          }
        }
      ]
    }
    
   Notes about samplePayload:
    - Represent a realistic input payload or form data for this test case.
    - Use simple JSON-safe values (strings, numbers, booleans).
    - Only include 3-8 fields.
    - If the feature is not data-driven, you can leave samplePayload as an empty object {}.

    Constraints:
    - "id" should be sequential like "TC_1", "TC_2", "TC_3", etc.
    - "type" must be one of: "happy", "negative", "edge".
    - Do NOT add any extra fields.
    - Do NOT wrap the JSON in backticks or markdown.
    - Do NOT add any text before or after the JSON.
    `;

    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      response_format: { type: "json_object" },
      messages: [{ role: "user", content: prompt }],
    });

    const raw = completion.choices[0].message.content;

    if (!raw) {
      return NextResponse.json(
        { error: "No response from AI." },
        { status: 500 }
      );
    }

    const parsed = JSON.parse(raw);

    if (!Array.isArray(parsed.testCases)) {
      return NextResponse.json(
        { error: "AI returned invalid test case format." },
        { status: 500 }
      );
    }

    const testCases: TestCase[] = parsed.testCases;

    const suite: Omit<TestSuite, "id"> = {
      name: feature || "untitled suite",
      featureName: feature,
      description: desc,
      createdAt: new Date().toISOString(),
      testCases,
      projectId: projectId || "",
    };

    const db = await getDb();

    const result = await db.collection("test_suites").insertOne(suite);

    return NextResponse.json(
      { suiteId: result.insertedId.toString(), testCases },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error("AI Error:", error);

    return NextResponse.json(
      { error: "Failed to generate test cases." },
      { status: 500 }
    );
  }
}
