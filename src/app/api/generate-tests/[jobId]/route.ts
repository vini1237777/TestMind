import { revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";
import { getGenerationStatus } from "@/src/lib/queue/generation-queue";

export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ jobId: string }> }) {
  try {
    const { jobId } = await params;
    const job = await getGenerationStatus(jobId);

    if (!job) {
      return NextResponse.json({ error: "Generation not found." }, { status: 404 });
    }
    if (job.status === "failed") {
      return NextResponse.json({
        status: "failed",
        error: "Failed to generate test cases. Please try again.",
      });
    }
    // The worker runs outside Next.js and can't refresh its page cache.
    if (job.status === "done") {
      revalidatePath(`/projects/${job.result.projectId}`);
    }
    return NextResponse.json(job);
  } catch (error: unknown) {
    console.error("Generation status error:", error);
    return NextResponse.json({ error: "Couldn't read generation status." }, { status: 503 });
  }
}
