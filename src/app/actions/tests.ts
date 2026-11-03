import { connectDB } from "@/src/lib/mongodb";
import { TestCase } from "../models/TestCase";
import { TestCase as TestCaseType } from "../types/testmind";
import { clearListCache } from "@/src/lib/cache";

export async function createTestCase(
  projectId: string,
  testCaseData: TestCaseType
) {
  await connectDB();

  const suite = await TestCase.insertOne({
    ...testCaseData,
    projectId,
  });
  await clearListCache();

  return JSON.parse(JSON.stringify(suite));
}
