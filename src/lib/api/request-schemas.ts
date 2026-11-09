import { NextResponse } from "next/server";
import { z } from "zod";

const OBJECT_ID = /^[a-f\d]{24}$/i;

const objectId = (message: string) => z.string().regex(OBJECT_ID, message);

// The client sends null or "" for an id it does not have yet.
const optionalObjectId = (message: string) =>
  z.preprocess(
    (value) => (value === null || value === "" ? undefined : value),
    objectId(message).optional(),
  );

const required = (message: string, max: number) =>
  z
    .string({ error: message })
    .trim()
    .min(1, message)
    .max(max, `Please keep this under ${max} characters.`);

// Cases can be older than the current rules, so this checks what the AI needs
// and keeps any other fields.
const IncomingTestCaseSchema = z.looseObject({
  title: z.string().min(1),
  steps: z.array(z.string()),
  expected: z.string(),
  type: z.string(),
});

const FEATURE_ERROR = "Feature name and description are required.";

export const GenerateTestsBodySchema = z.object({
  featureName: required(FEATURE_ERROR, 200),
  description: required(FEATURE_ERROR, 5000),
  projectId: objectId("Invalid project or suite id."),
  suiteId: optionalObjectId("Invalid project or suite id."),
  lastFeedbackSummary: z
    .string()
    .max(5000)
    .nullish()
    .transform((value) => value ?? undefined),
  lastFeedbackScore: z.number().min(0).max(100).nullish(),
  lastReviewedAt: z.string().nullish(),
});

export const FeedbackReviewBodySchema = z.object({
  featureName: required(FEATURE_ERROR, 200),
  description: required(FEATURE_ERROR, 5000),
  testCases: z
    .array(IncomingTestCaseSchema, {
      error: "At least one test case is required for feedback review.",
    })
    .min(1, "At least one test case is required for feedback review.")
    .max(100, "A review can cover up to 100 test cases."),
  suiteId: optionalObjectId("Invalid suite id."),
  projectId: optionalObjectId("Invalid project id."),
});

export const AddCasesBodySchema = z.object({
  suiteId: objectId("suiteId and testCases are required"),
  testCases: z
    .array(IncomingTestCaseSchema, {
      error: "suiteId and testCases are required",
    })
    .max(100, "Add up to 100 test cases at a time."),
});

export const CreateProjectBodySchema = z.object({
  name: required("Project name is required", 120),
  description: z.string().trim().max(2000).nullish(),
});

type Parsed<T> =
  | { ok: true; data: T }
  | { ok: false; response: NextResponse };

export async function parseBody<T>(
  req: Request,
  schema: z.ZodType<T>,
): Promise<Parsed<T>> {
  const fail = (error: string) => ({
    ok: false as const,
    response: NextResponse.json({ error }, { status: 400 }),
  });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return fail("The request body must be valid JSON.");
  }

  const result = schema.safeParse(body);
  if (!result.success) {
    return fail(result.error.issues[0]?.message ?? "Invalid request.");
  }
  return { ok: true, data: result.data };
}
