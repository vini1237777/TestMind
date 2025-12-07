"use client";

import { useState } from "react";
import { useEffect } from "react";
import toast from "react-hot-toast";
import { TestCase, TestSuite } from "../types/testmind";

const tabs = [
  { label: "All", value: "all" },
  { label: "Happy", value: "happy" },
  { label: "Negative", value: "negative" },
  { label: "Edge", value: "edge" },
];

export default function Feature() {
  const [featureName, setFeatureName] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [testCases, setTestCases] = useState<TestCase[]>([]);
  const [testSuites, setTestSuites] = useState<TestSuite[]>([]);
  const [selectedSuiteId, setSelectedSuiteId] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<
    "all" | "happy" | "negative" | "edge"
  >("all");

  const [expandedCaseId, setExpandedCaseId] = useState<string | null>(null);

  useEffect(() => {
    const loadSuites = async () => {
      try {
        const res = await fetch("/api/suites", { next: { revalidate: 60 } });
        if (!res.ok) return;
        const data = await res.json();
        setTestSuites(data.suites || []);
      } catch (e) {
        console.error(e);
      }
    };

    loadSuites();
  }, []);

  const handleGenerate = async (featureName: string, description: string) => {
    setError(null);
    setIsGenerating(true);

    try {
      const res = await fetch("/api/generate-tests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ featureName, description }),
      });

      if (!res.ok) {
        const errorBody = await res?.json().catch(() => null);
        setError(errorBody?.error || "Failed to generate test cases");
        return;
      }

      const data = await res?.json();

      const cases: TestCase[] = data?.testCases || [];

      if (!cases?.length) {
        setError("No test cases returned by AI.");
        return;
      }

      setTestCases(cases);

      const suiteIdFromDb = data?.suiteId;

      const newSuite: TestSuite = {
        id: suiteIdFromDb || crypto.randomUUID(),
        name: featureName || "Untitled suite",
        featureName,
        description,
        createdAt: new Date().toISOString(),
        testCases: cases,
        projectId: data?.projectId,
      };

      setTestSuites((prev) => [newSuite, ...prev]);
      setSelectedSuiteId(newSuite.id);
      setFeatureName("");
      setDescription("");
    } catch (err) {
      console.error(err);
      setError("Something went wrong. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownloadSuite = (suite: TestSuite) => {
    const blob = new Blob([JSON.stringify(suite, null, 2)], {
      type: "application/json",
    });

    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = `${suite.name || "test-suite"}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  const selectedSuite = testSuites.find((s) => s.id === selectedSuiteId);

  const filteredCases =
    selectedSuite && selectedSuite.testCases
      ? selectedSuite.testCases.filter((tc) =>
          filterType === "all" ? true : tc.type === filterType
        )
      : [];

  return (
    <div className="min-h-screen">
      <main className="max-w-5xl mx-auto px-4 py-8 w-full">
        <section className="flex flex-col gap-4 max-w-5xl mt-10 mb-10 ml-6 mr-6">
          <label className="text-sm font-medium">Feature Name</label>
          <input
            type="text"
            placeholder="Feature Name"
            value={featureName}
            onChange={(e) => setFeatureName(e.target.value)}
            className="p-2 border border-gray-300 rounded"
          />
          <label className="text-sm font-medium">Feature Description</label>
          <textarea
            placeholder="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="p-2 border border-gray-300 rounded"
          />
          <button
            className="bg-amber-400 p-2 rounded hover:bg-amber-500 cursor-pointer w-full sm:w-auto"
            onClick={() => {
              handleGenerate(featureName, description);
            }}
            disabled={
              !featureName.trim() || !description.trim() || isGenerating
            }
          >
            {isGenerating ? "Generating..." : "Generate Test Cases"}{" "}
          </button>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <section className="w-full max-w-2xl mt-8 mb-8">
            {testCases.length === 0 ? (
              <p className="text-gray-500">
                No test cases yet. Click <strong>Generate Test Cases</strong>.
              </p>
            ) : (
              <ul className="flex flex-col gap-4">
                <h2 className="text-lg font-semibold">
                  Latest Generated Test Cases
                </h2>

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
                  <h2 className="text-lg font-semibold mb-2">
                    Saved Test Suites
                  </h2>
                  {testSuites.map((suite) => (
                    <li
                      key={suite.id}
                      onClick={() => {
                        setSelectedSuiteId(suite.id);
                        setFilterType("all");
                      }}
                      className={
                        suite.id === selectedSuiteId
                          ? "p-2 rounded cursor-pointer bg-amber-50 border border-amber-200"
                          : "p-2 rounded cursor-pointer hover:bg-gray-50 border"
                      }
                    >
                      {suite.name} -{" "}
                      {new Date(suite.createdAt).toLocaleString()}
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
                    <div className="flex items-center mb-2">
                      <div>
                        <h2 className="font-semibold">{selectedSuite.name}</h2>
                        <p className="text-xs text-gray-500">
                          {new Date(selectedSuite.createdAt).toLocaleString()}
                        </p>
                      </div>
                      <div className="ml-4 mb-2">
                        <button
                          onClick={() => handleDownloadSuite(selectedSuite)}
                          className="text-xs px-3 py-1 rounded border border-gray-300 hover:bg-gray-50"
                        >
                          Download JSON
                        </button>
                      </div>
                    </div>

                    <ul className="flex flex-col gap-4">
                      <div className="mb-3 flex flex-wrap gap-2">
                        {tabs.map((tab) => (
                          <button
                            key={tab.value}
                            onClick={() =>
                              setFilterType(
                                tab.value as unknown as
                                  | "all"
                                  | "happy"
                                  | "negative"
                                  | "edge"
                              )
                            }
                            className={
                              filterType === tab.value
                                ? "px-3 py-1 rounded-full text-xs font-medium bg-amber-500 text-white"
                                : "px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700 hover:bg-gray-200"
                            }
                          >
                            {tab.label}
                          </button>
                        ))}
                      </div>
                      <ul className="flex flex-col gap-4">
                        {filteredCases?.map((tc) => {
                          const isExpanded = expandedCaseId === tc.id;

                          return (
                            <li
                              key={tc?.id}
                              className="border border-gray-200 rounded p-3 shadow-sm mb-8"
                            >
                              <div className="flex justify-between text-sm mb-1">
                                <span className="font-mono text-xs">
                                  {tc.id}
                                </span>
                                <span className="uppercase text-xs text-gray-500">
                                  {tc.type}
                                </span>
                              </div>
                              <button
                                onClick={() =>
                                  setExpandedCaseId(isExpanded ? null : tc.id)
                                }
                                className="text-xs px-2 py-1 rounded border hover:bg-gray-50 dark:hover:bg-gray-900"
                              >
                                {isExpanded ? "Hide details" : "View details"}
                              </button>
                              {isExpanded ? (
                                <>
                                  <h3 className="font-semibold mb-1">
                                    {tc.title}
                                  </h3>
                                  <div className="mb-1">
                                    <p className="font-semibold text-sm">
                                      Steps:
                                    </p>
                                    <ol className="list-decimal list-inside text-sm text-gray-700">
                                      {tc.steps.map((step, i) => (
                                        <li key={i}>{step}</li>
                                      ))}
                                    </ol>
                                  </div>
                                  <p className="text-sm">
                                    <span className="font-semibold">
                                      Expected:
                                    </span>{" "}
                                    {tc.expected}
                                  </p>
                                  {tc.samplePayload &&
                                    Object.keys(tc.samplePayload).length >
                                      0 && (
                                      <div className="mt-2 dark:bg-gray-950">
                                        <p className="font-semibold text-sm mb-1">
                                          Sample Payload:
                                        </p>
                                        <pre className="bg-gray-50 text-xs p-2 rounded border overflow-x-auto ">
                                          {JSON.stringify(
                                            tc.samplePayload,
                                            null,
                                            2
                                          )}
                                        </pre>
                                      </div>
                                    )}
                                  <button
                                    onClick={() =>
                                      navigator.clipboard
                                        .writeText(
                                          JSON.stringify(
                                            tc.samplePayload,
                                            null,
                                            2
                                          )
                                        )
                                        .then(() =>
                                          toast.success("Copied Successfully!")
                                        )
                                    }
                                    className="mt-1 text-xs underline text-gray-600 cursor-pointer"
                                  >
                                    Copy payload
                                  </button>
                                </>
                              ) : (
                                <></>
                              )}
                            </li>
                          );
                        })}
                      </ul>
                    </ul>
                    {filteredCases.length === 0 ? (
                      <p className="text-sm text-gray-500">
                        No {filterType === "all" ? "" : filterType} test cases
                        in this suite.
                      </p>
                    ) : (
                      <ul>...</ul>
                    )}
                  </>
                )
              )}
            </section>
          </section>
        </section>
      </main>
    </div>
  );
}
