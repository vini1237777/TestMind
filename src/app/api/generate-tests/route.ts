import { revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";
import { generateAndSaveSuite } from "@/src/lib/ai/services/suite-orchestrator/generate-and-save";

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

    const result = await generateAndSaveSuite({
      featureName: feature,
      description: desc,
      projectId,
      suiteId,
      lastFeedbackSummary,
      lastFeedbackScore,
      lastReviewedAt,
    });

    revalidatePath(`/projects/${result.projectId}`);
    return NextResponse.json(result, { status: 200 });
  } catch (error: unknown) {
    console.error("LangGraph Generation Error:", error);
    return NextResponse.json(
      { error: "Failed to generate test cases via LangGraph workflow." },
      { status: 500 }
    );
  }
}
