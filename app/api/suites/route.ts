import TestSuite from "@/app/models/TestSuite";
import { connectDB } from "@/lib/mongodb";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  await connectDB();

  try {
    const projectId = req.nextUrl.searchParams.get("projectId");
    if (!projectId) {
      return NextResponse.json(
        { error: "Missing projectId parameter" },
        { status: 400 }
      );
    }

    const docs = await TestSuite.find().sort({ createdAt: -1 }).lean();

    const suites = docs.map((doc) => ({
      id: typeof doc._id === "string" ? doc._id : doc._id?.toString(),
      name: doc?.name || "",
      featureName: doc?.featureName || "",
      description: doc?.description || "",
      createdAt: doc?.createdAt || "",
      testCases: doc?.testCases || [],
      projectId: doc?.projectId?.toString() || "",
    }));

    return NextResponse.json({ suites }, { status: 200 });
  } catch (err) {
    console.error(err);

    return NextResponse.json(
      { error: "Failed to load suites" },
      { status: 500 }
    );
  }
}
