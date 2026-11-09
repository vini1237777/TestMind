import { NextRequest, NextResponse } from "next/server";
import TestSuite from "@/src/app/models/TestSuite";
import type { TestCase } from "@/src/app/types/testmind";
import { runReviewWorkflow } from "@/src/lib/ai/services/suite-orchestrator/run-review";
import { connectDB } from "@/src/lib/mongodb";
import { clearListCache } from "@/src/lib/cache";
import { FeedbackReviewBodySchema, parseBody } from "@/src/lib/api/request-schemas";

export async function POST(req: NextRequest) {
  try {
    const body = await parseBody(req, FeedbackReviewBodySchema);
    if (!body.ok) return body.response;
    const { featureName, description, testCases, suiteId, projectId } = body.data;

    const { feedback, improvedTestCases, trace } = await runReviewWorkflow({
      featureName,
      description,
      projectId,
      suiteId,
      currentTestCases: testCases as unknown as TestCase[],
    });

    if (suiteId) {
      await connectDB();
      await TestSuite.findByIdAndUpdate(suiteId, {
        lastFeedbackScore: feedback.score,
        lastFeedbackSummary: feedback.summary,
        lastReviewedAt: new Date(),
      });
      // So the project page and project list show the new score straight away.
      await clearListCache();
    }

    return NextResponse.json(
      {
        ...feedback,
        improvedTestCases,
        workflow: "langgraph_review",
        trace,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("LangGraph Review Error:", error);
    return NextResponse.json(
      { error: "Failed to generate feedback via LangGraph workflow." },
      { status: 500 }
    );
  }
}
