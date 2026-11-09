import "@/src/worker/load-env";
import mongoose from "mongoose";
import TestSuite from "@/src/app/models/TestSuite";
import type { TestCase } from "@/src/app/types/testmind";
import { writeSuiteChunks } from "@/src/lib/ai/rag/chunks";
import { connectDB } from "@/src/lib/mongodb";

type SuiteRow = {
  _id: { toString(): string };
  projectId: { toString(): string };
  testCases?: TestCase[];
};

// Counts by default. Pass --write to embed, which costs OpenAI credit. Safe to run
// again, because a case that is already stored is skipped.
async function main() {
  const write = process.argv.includes("--write");
  await connectDB();

  const suites = await TestSuite.find(
    {},
    { projectId: 1, "testCases.type": 1, "testCases.title": 1, "testCases.steps": 1, "testCases.expected": 1 },
  ).lean<SuiteRow[]>();
  const caseCount = suites.reduce((sum, s) => sum + (s.testCases?.length ?? 0), 0);
  console.log(`${suites.length} suites, ${caseCount} test cases`);

  if (!write) {
    console.log("Nothing written. Run with --write to add the chunks.");
    return;
  }

  let embedded = 0;
  let failed = 0;
  for (const suite of suites) {
    try {
      const result = await writeSuiteChunks({
        suiteId: suite._id.toString(),
        projectId: suite.projectId.toString(),
        testCases: suite.testCases ?? [],
      });
      embedded += result.embedded;
    } catch (err) {
      failed += 1;
      console.error(`Suite ${suite._id.toString()} failed:`, (err as Error).message);
    }
  }
  console.log(`Embedded ${embedded} new cases. ${failed} suites failed.`);
  if (failed) process.exitCode = 1;
}

main()
  .catch((err) => {
    console.error(err.message);
    process.exitCode = 1;
  })
  .finally(() => mongoose.disconnect());
