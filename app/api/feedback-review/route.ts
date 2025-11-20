import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import type { TestCase, FeedbackResult } from "@/app/types/testmind";
import TestSuite from "@/app/models/TestSuite";

export async function POST(req: NextRequest) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error("Missing OPENAI_API_KEY");
    }

    const client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY!,
    });

    const body = await req.json();
    const { featureName, description, testCases, suiteId } = body as {
      featureName: string;
      description: string;
      testCases: TestCase[];
      suiteId: string;
    };

    const feature = String(featureName || "").trim();
    const desc = String(description || "").trim();

    if (!feature || !desc) {
      return NextResponse.json(
        { error: "Feature name and description are required." },
        { status: 400 }
      );
    }

    if (!Array.isArray(testCases) || testCases.length === 0) {
      return NextResponse.json(
        { error: "At least one test case is required for feedback review." },
        { status: 400 }
      );
    }

    const prompt = `
You are a senior QA lead reviewing a test suite for a web application feature.

Your job:
- Review the given feature description and existing test cases.
- Identify coverage gaps and missing scenarios.
- Suggest improvements and extra test cases if needed.

Input:
- Feature Name: ${feature}
- Feature Description: ${desc}
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

    const parsed = JSON.parse(raw) as FeedbackResult;

    const feedback: FeedbackResult = {
      score:
        typeof parsed.score === "number"
          ? Math.min(Math.max(parsed.score, 0), 100)
          : 0,
      summary: parsed.summary || "No summary provided.",
      missingAreas: Array.isArray(parsed.missingAreas)
        ? parsed.missingAreas
        : [],
      suggestions: Array.isArray(parsed.suggestions) ? parsed.suggestions : [],
      suggestedTestCases: Array.isArray(parsed.suggestedTestCases)
        ? parsed.suggestedTestCases
        : [],
    };

    await TestSuite.findByIdAndUpdate(suiteId, {
      lastFeedbackScore: feedback.score,
      lastFeedbackSummary: feedback.summary,
      lastReviewedAt: new Date(),
    });

    return NextResponse.json(feedback, { status: 200 });
  } catch (error) {
    console.error("Feedback AI Error:", error);
    return NextResponse.json(
      { error: "Failed to generate feedback." },
      { status: 500 }
    );
  }
}
