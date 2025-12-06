import TestSuite from "@/src/app/models/TestSuite";
import { getCache, setCache } from "@/src/lib/cache";
import { connectDB } from "@/src/lib/mongodb";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const cached = await getCache(req.url);
  if (cached) return cached;
  await connectDB();

  try {
    // const projectId = req.nextUrl.searchParams.get("projectId");
    // if (!projectId) {
    //   return NextResponse.json(
    //     { error: "Missing projectId parameter" },
    //     { status: 400 }
    //   );
    // }

    const docs = await TestSuite.find().sort({ createdAt: -1 }).lean();

    const suites = docs.map((doc) => ({
      id: typeof doc._id === "string" ? doc._id : doc._id?.toString(),
      name: doc?.name || "",
      featureName: doc?.featureName || "",
      description: doc?.description || "",
      createdAt: doc?.createdAt || "",
      testCases: doc?.testCases || [],
      projectId: doc?.projectId?.toString() || "",
      lastFeedbackSummary: doc?.lastFeedbackSummary,
      lastFeedbackScore: doc?.lastFeedbackScore,
      lastReviewedAt: doc?.lastReviewedAt,
    }));
    await setCache(req.url, { suites });

    return NextResponse.json({ suites }, { status: 200 });
  } catch (err) {
    console.error(err);

    return NextResponse.json(
      { error: "Failed to load suites" },
      { status: 500 }
    );
  }
}
