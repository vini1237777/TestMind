import { NextRequest, NextResponse } from "next/server";
import { addTestCasesToSuite } from "@/app/actions/suites";

export async function POST(req: NextRequest) {
  try {
    const { suiteId, testCases } = await req.json();

    if (!suiteId || !Array.isArray(testCases)) {
      return NextResponse.json(
        { error: "suiteId and testCases are required" },
        { status: 400 }
      );
    }

    const result = await addTestCasesToSuite(suiteId, testCases);

    return NextResponse.json(result, { status: 200 });
  } catch (err) {
    console.error(err);

    return NextResponse.json(
      { error: "Failed to add test cases to suite" },
      { status: 500 }
    );
  }
}
