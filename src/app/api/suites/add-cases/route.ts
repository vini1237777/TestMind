import { NextRequest, NextResponse } from "next/server";
import { addTestCasesToSuite } from "@/src//app/actions/suites";
import type { TestCase } from "@/src/app/types/testmind";
import { AddCasesBodySchema, parseBody } from "@/src/lib/api/request-schemas";

export async function POST(req: NextRequest) {
  try {
    const body = await parseBody(req, AddCasesBodySchema);
    if (!body.ok) return body.response;
    const { suiteId, testCases } = body.data;

    const result = await addTestCasesToSuite(suiteId, testCases as unknown as TestCase[]);

    return NextResponse.json(result, { status: 200 });
  } catch (err) {
    console.error(err);

    return NextResponse.json(
      { error: "Failed to add test cases to suite" },
      { status: 500 }
    );
  }
}
