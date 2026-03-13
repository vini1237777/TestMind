import { NextRequest, NextResponse } from "next/server";
import TestSuite from "@/src/app/models/TestSuite";
import type { TestCase } from "@/src/app/types/testmind";
import { reviewSuiteService } from "@/src/lib/ai/services/review-suite";
import { connectDB } from "@/src/lib/mongodb";

export async function POST(req: NextRequest) {
  try {
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

    const feedback = await reviewSuiteService({
      featureName: feature,
      description: desc,
      testCases,
    });

    if (suiteId) {
      await connectDB();

      await TestSuite.findByIdAndUpdate(suiteId, {
        lastFeedbackScore: feedback.score,
        lastFeedbackSummary: feedback.summary,
        lastReviewedAt: new Date(),
      });
    }

    return NextResponse.json(feedback, { status: 200 });
  } catch (error) {
    console.error("Feedback AI Error:", error);

    return NextResponse.json(
      { error: "Failed to generate feedback." },
      { status: 500 }
    );
  }
}
