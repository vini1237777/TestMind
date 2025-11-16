import { TestCase } from "@/app/types/testmind";
import { NextRequest, NextResponse } from "next/server";

function generateTestCases(
  featureName: string,
  description: string
): TestCase[] {
  if (!featureName.trim() || !description.trim()) return [];

  return [
    {
      id: "TC_1",
      type: "happy",
      title: `Verify that "${featureName}" works as described`,
      steps: [
        "Set up preconditions based on the feature description.",
        "Perform the main user flow.",
        "Verify that the expected success behavior happens.",
      ],
      expected: "Feature behaves correctly for valid input.",
    },
    {
      id: "TC_2",
      type: "negative",
      title: `Check edge cases for "${featureName}"`,
      steps: [
        "Try boundary values or unusual inputs.",
        "Observe system response.",
      ],
      expected: "System should not break and should show clear errors.",
    },
    {
      id: "TC_3",
      type: "negative",
      title: `Ensure "${featureName}" handles invalid input gracefully`,
      steps: ["Provide invalid or empty values.", "Trigger the feature."],
      expected: "User sees helpful error messages; no crashes.",
    },
  ];
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const { featureName, description } = body;

    if (!featureName?.trim() || !description?.trim()) {
      return NextResponse.json(
        {
          error: "Feature name and description are required",
        },
        {
          status: 400,
        }
      );
    }

    const testCases: TestCase[] = generateTestCases(featureName, description);
    return NextResponse.json({ testCases }, { status: 200 });
  } catch (err) {
    console.error("Error in /api/generate-tests", err);
    return NextResponse.json(
      {
        error: "Something went wrong while generating test cases",
      },
      {
        status: 500,
      }
    );
  }
}
