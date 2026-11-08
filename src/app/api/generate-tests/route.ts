import { NextRequest, NextResponse } from "next/server";
import { enqueueGeneration, QueueBusyError } from "@/src/lib/queue/generation-queue";

const OBJECT_ID = /^[a-f\d]{24}$/i;

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
    // A bad id would only fail after the worker had paid for the model call.
    if (!OBJECT_ID.test(String(projectId)) || (suiteId && !OBJECT_ID.test(String(suiteId)))) {
      return NextResponse.json({ error: "Invalid project or suite id." }, { status: 400 });
    }

    const jobId = await enqueueGeneration({
      featureName: feature,
      description: desc,
      projectId,
      suiteId,
      lastFeedbackSummary,
      lastFeedbackScore,
      lastReviewedAt,
    });

    return NextResponse.json({ jobId }, { status: 202 });
  } catch (error: unknown) {
    if (error instanceof QueueBusyError) {
      return NextResponse.json(
        { error: "A lot of people are generating right now. Please try again in a minute." },
        { status: 503 },
      );
    }
    console.error("Generation enqueue error:", error);
    return NextResponse.json(
      { error: "Generation isn't available right now. Please try again in a minute." },
      { status: 503 },
    );
  }
}
