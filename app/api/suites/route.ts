import { TestSuite } from "@/app/types/testmind";
import { getDb } from "@/lib/mongodb";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const db = await getDb();

    const docs = await db
      .collection("test_suites")
      .find({})
      .sort({ createdAt: -1 })
      .toArray();

    const suites: TestSuite[] = docs.map((doc) => ({
      id: doc._id.toString(),
      name: doc.name,
      featureName: doc.featureName,
      description: doc.description,
      createdAt: doc.createdAt,
      testCases: doc.testCases,
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
