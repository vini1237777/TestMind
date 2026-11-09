import Project from "@/src/app/models/Project";
import TestSuite from "@/src/app/models/TestSuite";
import { clearListCache, getCache, setCache } from "@/src/lib/cache";
import { connectDB } from "@/src/lib/mongodb";
import { CreateProjectBodySchema, parseBody } from "@/src/lib/api/request-schemas";
import { NextRequest, NextResponse } from "next/server";
import { apiUser, ownedProjectIds, projectIdIn } from "@/src/lib/auth/access";

export async function GET(req: NextRequest) {
  try {
    const auth = await apiUser();
    if ("response" in auth) return auth.response;
    // One cache entry per user. The key still contains /api/projects, so clearListCache finds it.
    const cacheKey = `${req.url}#${auth.user.id}`;
    const cached = await getCache(cacheKey);

    if (cached) return cached;

    const ids = await ownedProjectIds(auth.user);

    const typeCount = (t: string) => ({
      $size: {
        $filter: { input: { $ifNull: ["$testCases", []] }, cond: { $eq: [{ $toLower: { $ifNull: ["$$this.type", ""] } }, t] } },
      },
    });

    // One pass over suites gives every project card its numbers.
    const [projects, stats] = await Promise.all([
      Project.find({ ownerId: auth.user.id }).sort({ createdAt: -1 }).lean(),
      TestSuite.aggregate<{
        _id: string;
        suites: number;
        features: string[];
        cases: number;
        happy: number;
        negative: number;
        edge: number;
        avgScore: number | null;
        lastActivity: Date | null;
        lastSuiteId: unknown;
        lastSuiteName: string | null;
        lastSuiteScore: number | null;
        lastSuiteCases: number;
      }>([
        { $match: { projectId: projectIdIn(ids) } },
        { $sort: { createdAt: 1 } },
        {
          $project: {
            projectId: 1,
            createdAt: 1,
            featureName: 1,
            lastReviewedAt: 1,
            lastFeedbackScore: 1,
            cases: { $size: { $ifNull: ["$testCases", []] } },
            happy: typeCount("happy"),
            negative: typeCount("negative"),
            edge: typeCount("edge"),
          },
        },
        {
          $group: {
            _id: "$projectId",
            suites: { $sum: 1 },
            features: { $addToSet: "$featureName" },
            cases: { $sum: "$cases" },
            happy: { $sum: "$happy" },
            negative: { $sum: "$negative" },
            edge: { $sum: "$edge" },
            avgScore: { $avg: "$lastFeedbackScore" },
            lastActivity: { $max: { $ifNull: ["$lastReviewedAt", "$createdAt"] } },
            lastSuiteId: { $last: "$_id" },
            lastSuiteName: { $last: "$featureName" },
            lastSuiteScore: { $last: "$lastFeedbackScore" },
            lastSuiteCases: { $last: "$cases" },
          },
        },
      ]),
    ]);

    const byProject = new Map(stats.map((s) => [String(s._id), s]));
    const payload = {
      projects: projects.map((p) => {
        const id = typeof p._id === "string" ? p._id : p._id?.toString();
        const s = byProject.get(String(id));
        return {
          id,
          name: p.name,
          description: p.description,
          createdAt: p.createdAt,
          stats: {
            suites: s?.suites ?? 0,
            features: s?.features?.length ?? 0,
            cases: s?.cases ?? 0,
            happy: s?.happy ?? 0,
            negative: s?.negative ?? 0,
            edge: s?.edge ?? 0,
            avgScore: s?.avgScore == null ? null : Math.round(s.avgScore),
            lastActivity: s?.lastActivity ?? null,
            lastSuite: s?.lastSuiteId
              ? { id: String(s.lastSuiteId), name: s.lastSuiteName ?? "", score: s.lastSuiteScore ?? null, cases: s.lastSuiteCases ?? 0 }
              : null,
          },
        };
      }),
    };

    await setCache(cacheKey, payload);

    return NextResponse.json(payload);
  } catch (err) {
    console.error("AI Error:", err);
    return NextResponse.json(
      { error: "Failed to fetch projects." },
      { status: 500 },
    );
  }
}

export async function POST(req: Request) {
  const auth = await apiUser();
  if ("response" in auth) return auth.response;
  const body = await parseBody(req, CreateProjectBodySchema);
  if (!body.ok) return body.response;

  await connectDB();

  const project = await Project.create({
    name: body.data.name,
    description: body.data.description || "",
    ownerId: auth.user.id,
  });
  await clearListCache();

  return NextResponse.json(
    {
      project: {
        id: project._id.toString(),
        name: project.name,
        description: project.description,
        createdAt: project.createdAt,
      },
    },
    { status: 201 },
  );
}
