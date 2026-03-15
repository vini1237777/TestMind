import { createSuite, TestSuiteDb } from "@/src/app/actions/suites";
import TestSuite from "@/src/app/models/TestSuite";
import type { TestCase } from "@/src/app/types/testmind";
import { runGenerationWorkflow } from "@/src/lib/ai/services/suite-orchestrator/run-generation";
import { connectDB } from "@/src/lib/mongodb";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      featureName,
      description,
      projectId,
      suiteId,
      lastFeedbackSummary,
      lastFeedbackScore,
      lastReviewedAt,
    } = body;

    const feature = String(featureName || "").trim();
    const desc = String(description || "").trim();

    if (!feature || !desc) {
      return NextResponse.json({ error: "Feature name and description are required." }, { status: 400 });
    }
    if (!projectId) {
      return NextResponse.json({ error: "projectId is required." }, { status: 400 });
    }

    const testCases = await runGenerationWorkflow({
      featureName: feature,
      description: desc,
      projectId,
      suiteId,
      lastFeedbackSummary,
      lastFeedbackScore,
    });

    await connectDB();

    if (suiteId) {
      const updated = await TestSuite.findByIdAndUpdate(
        suiteId,
        {
          name: feature,
          featureName: feature,
          description: desc,
          testCases,
          createdAt: new Date(),
          lastFeedbackSummary: lastFeedbackSummary ?? "",
          lastFeedbackScore: lastFeedbackScore ?? null,
          lastReviewedAt: lastReviewedAt ?? null,
        },
        { new: true }
      ).lean<TestSuiteDb>();

      if (updated) {
        return NextResponse.json(
          {
            suiteId: updated._id.toString(),
            testCases: (updated.testCases as TestCase[]) || [],
            projectId: typeof updated.projectId === "string" ? updated.projectId : updated.projectId.toString(),
            createdAt: updated.createdAt?.toISOString?.() ?? new Date().toISOString(),
            lastFeedbackSummary: updated.lastFeedbackSummary ?? "",
            lastFeedbackScore: updated.lastFeedbackScore ?? null,
            lastReviewedAt:
              updated.lastReviewedAt instanceof Date
                ? updated.lastReviewedAt.toISOString()
                : updated.lastReviewedAt ?? null,
            workflow: "langgraph_generation",
          },
          { status: 200 }
        );
      }
    }

    const suite = await createSuite({
      projectId,
      featureName: feature,
      description: desc,
      testCases,
      lastFeedbackSummary,
      lastFeedbackScore,
      lastReviewedAt,
    });

    return NextResponse.json(
      {
        suiteId: suite.id,
        testCases: suite.testCases,
        projectId: suite.projectId,
        createdAt: suite.createdAt,
        lastFeedbackSummary: suite.lastFeedbackSummary ?? "",
        lastFeedbackScore: suite.lastFeedbackScore ?? null,
        lastReviewedAt: suite.lastReviewedAt ?? null,
        workflow: "langgraph_generation",
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error("LangGraph Generation Error:", error);
    return NextResponse.json(
      { error: "Failed to generate test cases via LangGraph workflow." },
      { status: 500 }
    );
  }
}
