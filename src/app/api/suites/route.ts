import TestSuite from "@/src/app/models/TestSuite";
import { apiUser, ownedProjectIds, projectIdIn } from "@/src/lib/auth/access";
import { getCache, setCache } from "@/src/lib/cache";
import { NextRequest, NextResponse } from "next/server";

// The signed in user's suites, or one project's when ?projectId= is given.
export async function GET(req: NextRequest) {
  try {
    const auth = await apiUser();
    if ("response" in auth) return auth.response;

    const cacheKey = `${req.url}#${auth.user.id}`;
    const cached = await getCache(cacheKey);
    if (cached) return cached;

    const owned = await ownedProjectIds(auth.user);
    const asked = req.nextUrl.searchParams.get("projectId");
    const ids = asked ? owned.filter((id) => id === asked) : owned;

    const docs = ids.length
      ? await TestSuite.find({ projectId: projectIdIn(ids) }).sort({ createdAt: -1 }).lean()
      : [];

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
    await setCache(cacheKey, { suites });

    return NextResponse.json({ suites }, { status: 200 });
  } catch (err) {
    console.error(err);

    return NextResponse.json(
      { error: "Failed to load suites" },
      { status: 500 }
    );
  }
}
