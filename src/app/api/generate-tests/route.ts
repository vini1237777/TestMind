import { NextRequest, NextResponse } from "next/server";
import { GenerateTestsBodySchema, parseBody } from "@/src/lib/api/request-schemas";
import { enqueueGeneration, QueueBusyError } from "@/src/lib/queue/generation-queue";

export async function POST(req: NextRequest) {
  try {
    // A bad id would only fail after the worker had paid for the model call.
    const body = await parseBody(req, GenerateTestsBodySchema);
    if (!body.ok) return body.response;

    const jobId = await enqueueGeneration(body.data);

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
