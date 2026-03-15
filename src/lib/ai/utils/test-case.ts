import type { TestCase } from "@/src/app/types/testmind";

export function normalizeTestCases(testCases: TestCase[]): TestCase[] {
  return testCases.map((testCase, index) => ({
    ...testCase,
    id: testCase.id || `TC_${index + 1}`,
    steps: Array.isArray(testCase.steps) ? testCase.steps : [],
    samplePayload: testCase.samplePayload ?? {},
  }));
}

export function dedupeTestCases(testCases: TestCase[]): TestCase[] {
  const seen = new Set<string>();

  return normalizeTestCases(testCases)
    .filter((testCase) => {
      const signature = `${testCase.type}::${testCase.title.trim().toLowerCase()}`;
      if (seen.has(signature)) return false;
      seen.add(signature);
      return true;
    })
    .map((testCase, index) => ({
      ...testCase,
      id: `TC_${index + 1}`,
    }));
}
