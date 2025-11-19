import { connectDB } from "@/lib/mongodb";
import { TestCase } from "../models/TestCase";
import { TestCase as TestCaseType } from "../types/testmind";

export async function createTestCase(
  projectId: string,
  testCaseData: TestCaseType
) {
  await connectDB();

  const suite = await TestCase.insertOne({
    ...testCaseData,
    projectId,
  });

  return JSON.parse(JSON.stringify(suite));
}
