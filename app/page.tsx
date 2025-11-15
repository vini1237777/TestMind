"use client";

import { useState } from "react";

type TestCase = {
  id: string;
  type: "happy" | "negative" | "edge";
  title: string;
  steps: string[];
  expected: string;
};

type TestSuite = {
  id: string;
  name: string;
  featureName: string;
  description: string;
  createdAt: string;
  testCases: TestCase[];
};

export default function HomePage() {
  const [featureName, setFeatureName] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [testCases, setTestCases] = useState<TestCase[]>([]);
  const [testSuites, setTestSuites] = useState<TestSuite[]>([]);
  const [selectedSuiteId, setSelectedSuiteId] = useState<string | null>(null);

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

  const handleGenerate = (featureName: string, description: string) => {
    const cases = generateTestCases(featureName, description);
    setTestCases(cases);
    if (!cases.length) return;

    const newSuite: TestSuite = {
      id: crypto.randomUUID(),
      name: featureName || "Untitled suite",
      featureName,
      description,
      createdAt: new Date().toISOString(),
      testCases: cases,
    };

    setTestSuites((prev) => [newSuite, ...prev]);
    setSelectedSuiteId(newSuite.id);
    setFeatureName("");
    setDescription("");
  };

  const selectedSuite = testSuites.find((s) => s.id === selectedSuiteId);

  return (
    <main className="flex flex-col gap-4 items-center max-w-3xl mx-auto">
      <nav className="w-screen bg-amber-200 h-12">
        <h1 className="mt-3 ml-3">TestMind</h1>
      </nav>

      <div className="flex flex-col gap-4 w-full max-w-md mt-10 mb-10">
        <label className="text-sm font-medium">Feature Description</label>
        <input
          type="text"
          placeholder="Feature Name"
          value={featureName}
          onChange={(e) => setFeatureName(e.target.value)}
          className="p-2 border border-gray-300 rounded"
        />
        <label className="text-sm font-medium">Description Name</label>
        <textarea
          placeholder="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="p-2 border border-gray-300 rounded"
        />
        <button
          className="bg-amber-400 p-2 rounded hover:bg-amber-500 cursor-pointer"
          onClick={() => {
            handleGenerate(featureName, description);
          }}
          disabled={!featureName.trim() || !description.trim()}
        >
          Generate Test Cases
        </button>
        <section className="w-full max-w-2xl mt-8 mb-8">
          {testCases.length === 0 ? (
            <p className="text-gray-500">
              No test cases yet. Click <strong>Generate Test Cases</strong>.
            </p>
          ) : (
            <ul className="flex flex-col gap-4">
              {testCases?.map((tc) => (
                <li
                  key={tc?.id}
                  className="border border-gray-200 rounded p-3 shadow-sm"
                >
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-mono text-xs">{tc.id}</span>
                    <span className="uppercase text-xs text-gray-500">
                      {tc.type}
                    </span>
                  </div>
                  <h3 className="font-semibold mb-1">{tc.title}</h3>
                  <div className="mb-1">
                    <p className="font-semibold text-sm">Steps:</p>
                    <ol className="list-decimal list-inside text-sm text-gray-700">
                      {tc.steps.map((step, i) => (
                        <li key={i}>{step}</li>
                      ))}
                    </ol>
                  </div>
                  <p className="text-sm">
                    <span className="font-semibold">Expected:</span>{" "}
                    {tc.expected}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>
        <section className="w-full max-w-4xl mt-8 flex gap-6">
          <aside className="w-1/3 border-r pr-4">
            <h2 className="font-semibold mb-2 text-sm">Test Suites</h2>
            {testSuites.length === 0 ? (
              <p className="text-gray-500 text-sm">
                No suites yet. Generate your first one.
              </p>
            ) : (
              <ul className="flex flex-col gap-2">
                {testSuites.map((suite) => (
                  <li
                    key={suite.id}
                    onClick={() => setSelectedSuiteId(suite.id)}
                    className={
                      suite.id === selectedSuiteId
                        ? "p-2 rounded cursor-pointer bg-amber-50 border border-amber-200"
                        : "p-2 rounded cursor-pointer hover:bg-gray-50 border"
                    }
                  >
                    {suite.name} - {new Date(suite.createdAt).toLocaleString()}
                  </li>
                ))}
              </ul>
            )}
          </aside>

          <section className="w-2/3 pl-4">
            {!selectedSuiteId ? (
              <p className="text-gray-500 text-sm">
                Select a suite from the left to view test cases.
              </p>
            ) : (
              selectedSuite && (
                <>
                  <h2 className="font-semibold mb-1">{selectedSuite.name}</h2>
                  <p className="text-xs text-gray-500 mb-4">
                    {new Date(selectedSuite.createdAt).toLocaleString()}
                  </p>

                  <ul className="flex flex-col gap-4">
                    {selectedSuite.testCases?.map((tc) => (
                      <li
                        key={tc?.id}
                        className="border border-gray-200 rounded p-3 shadow-sm mb-8"
                      >
                        <div className="flex justify-between text-sm mb-1">
                          <span className="font-mono text-xs">{tc.id}</span>
                          <span className="uppercase text-xs text-gray-500">
                            {tc.type}
                          </span>
                        </div>
                        <h3 className="font-semibold mb-1">{tc.title}</h3>
                        <div className="mb-1">
                          <p className="font-semibold text-sm">Steps:</p>
                          <ol className="list-decimal list-inside text-sm text-gray-700">
                            {tc.steps.map((step, i) => (
                              <li key={i}>{step}</li>
                            ))}
                          </ol>
                        </div>
                        <p className="text-sm">
                          <span className="font-semibold">Expected:</span>{" "}
                          {tc.expected}
                        </p>
                      </li>
                    ))}
                  </ul>
                </>
              )
            )}
          </section>
        </section>
      </div>
    </main>
  );
}
