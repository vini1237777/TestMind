export type TestCase = {
  id: string;
  type: "happy" | "negative" | "edge";
  title: string;
  steps: string[];
  expected: string;
};

export type TestSuite = {
  id: string;
  name: string;
  featureName: string;
  description: string;
  createdAt: string;
  testCases: TestCase[];
};
