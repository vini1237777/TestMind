import { NextRequest, NextResponse } from "next/server";
import { GenerateTestsBodySchema, parseBody } from "@/src/lib/api/request-schemas";
import { connectDB } from "@/src/lib/mongodb";
import { enqueueGeneration, QueueBusyError } from "@/src/lib/queue/generation-queue";
import { DUPLICATE_FEATURE_ERROR, isFeatureNameTaken } from "@/src/lib/suites/names";
import { apiUser, notFound, ownedProject, ownedSuite } from "@/src/lib/auth/access";

export async function POST(req: NextRequest) {
  try {
    const auth = await apiUser();
    if ("response" in auth) return auth.response;
    // A bad id would only fail after the worker had paid for the model call.
    const body = await parseBody(req, GenerateTestsBodySchema);
    if (!body.ok) return body.response;

    await connectDB();
    const { projectId, featureName, suiteId } = body.data;
    if (!(await ownedProject(auth.user, projectId))) return notFound();
    if (suiteId) {
      const suite = await ownedSuite(auth.user, suiteId);
      if (!suite || String(suite.projectId) !== projectId) return notFound();
    }
    if (await isFeatureNameTaken(projectId, featureName, suiteId)) {
      return NextResponse.json({ error: DUPLICATE_FEATURE_ERROR }, { status: 409 });
    }

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
