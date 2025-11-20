"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import type { FeedbackResult } from "@/app/types/testmind";
import { Feature, TestCase, TestSuite } from "@/app/types/testmind";
import { updateFeature } from "@/app/actions/features";
import ScoreBadge from "@/app/components/ScoreBadge";

const tabs = [
  { label: "All", value: "all" },
  { label: "Happy", value: "happy" },
  { label: "Negative", value: "negative" },
  { label: "Edge", value: "edge" },
];

type SuiteCaseProps = {
  feature: Feature;
};

export default function SuiteCase({ feature }: SuiteCaseProps) {
  const router = useRouter();

  const [name, setName] = useState(feature.name);
  const [description, setDescription] = useState(feature.description ?? "");

  const [isSavingFeature, setIsSavingFeature] = useState(false);

  const [testSuites, setTestSuites] = useState<TestSuite[]>([]);
  const [selectedSuiteId, setSelectedSuiteId] = useState<string | null>(null);

  const [isGenerating, setIsGenerating] = useState(false);
  const [filterType, setFilterType] = useState<
    "all" | "happy" | "negative" | "edge"
  >("all");
  const [expandedCaseId, setExpandedCaseId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDirty, setIsDirty] = useState(false);

  const [isReviewing, setIsReviewing] = useState(false);
  const [feedback, setFeedback] = useState<FeedbackResult | null>(null);
  const [feedbackError, setFeedbackError] = useState<string | null>(null);

  const [lastReviewedAt, setLastReviewedAt] = useState<string>("");
  const [lastFeedbackScore, setLastFeedbackScore] = useState<number | null>(
    null
  );
  const [lastFeedbackSummary, setLastFeedbackSummary] = useState<string>("");

  const handleBack = () => {
    router.push(`/projects/${feature.projectId}`);
  };

  const handleFeedbackReview = async () => {
    if (!selectedSuite || !selectedSuite.testCases.length) {
      toast.error("No test cases found for this suite.");
      return;
    }

    setFeedbackError(null);
    setIsReviewing(true);

    try {
      const res = await fetch("/api/feedback-review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          featureName: name.trim(),
          description: description.trim(),
          testCases: selectedSuite.testCases,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setFeedbackError(data.error || "Failed to get AI feedback.");
        return;
      }

      setFeedback(data as FeedbackResult);

      setLastReviewedAt(new Date().toISOString());
      setLastFeedbackScore(data.score);
      setLastFeedbackSummary(data.summary);
    } catch (err) {
      console.error(err);
      setFeedbackError("Something went wrong while getting feedback.");
    } finally {
      setIsReviewing(false);
    }
  };

  const hasChanges =
    name.trim() !== feature.name ||
    (description.trim() || "") !== (feature.description?.trim() || "");

  useEffect(() => {
    const loadSuites = async () => {
      try {
        const res = await fetch(`/api/suites?projectId=${feature.projectId}`);
        if (!res.ok) return;

        const response = await res.json();
        const allSuites: TestSuite[] = response.suites || [];

        const suitesForFeature = allSuites.filter(
          (suite) => suite.featureName === feature.name
        );

        suitesForFeature.sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );

        setTestSuites(suitesForFeature);
        if (suitesForFeature.length > 0) {
          setSelectedSuiteId(suitesForFeature[0].id);
        }
      } catch (err) {
        console.error(err);
      }
    };

    loadSuites();
  }, [feature.name, feature.projectId]);

  const handleSaveFeature = async () => {
    if (!name.trim()) {
      toast.error("Feature name is required.");
      return;
    }

    setIsSavingFeature(true);

    try {
      await updateFeature(feature.id, {
        name: name.trim(),
        description: description.trim(),
      });

      toast.success("Feature updated!");
      router.refresh();
    } catch (err) {
      console.error(err);
      toast.error("Failed to update feature.");
    } finally {
      setIsSavingFeature(false);
    }
  };

  const handleGenerate = async () => {
    if (!name.trim() || !description.trim()) return;

    setError(null);
    setIsGenerating(true);

    try {
      const res = await fetch("/api/generate-tests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          featureName: name.trim(),
          description: description.trim(),
          projectId: feature.projectId,
          suiteId: selectedSuiteId,
          lastFeedbackScore: feature.lastFeedbackScore || null,
          lastFeedbackSummary: feature.lastFeedbackSummary || "",
          lastReviewedAt: feature.lastReviewedAt || "",
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to generate test cases");
        return;
      }

      const suiteId = data.suiteId as string;
      const createdAt = data.createdAt as string;
      const testCases: TestCase[] = data.testCases || [];

      setTestSuites((prev) => {
        const exists = prev.some((s) => s.id === suiteId);

        if (exists) {
          return prev.map((s) =>
            s.id === suiteId
              ? {
                  ...s,
                  name: name.trim(),
                  featureName: name.trim(),
                  description: description.trim(),
                  createdAt: createdAt || s.createdAt,
                  testCases,
                }
              : s
          );
        }

        const newSuite: TestSuite = {
          id: suiteId,
          name: name.trim(),
          featureName: name.trim(),
          description: description.trim(),
          projectId: feature.projectId,
          createdAt: createdAt || new Date().toISOString(),
          testCases,
          lastFeedbackSummary,
          lastFeedbackScore,
          lastReviewedAt,
        };

        return [newSuite, ...prev];
      });

      setSelectedSuiteId(suiteId);
      setExpandedCaseId(null);
      setFilterType("all");
      setIsDirty(false);
    } catch (err) {
      console.error(err);
      setError("Something went wrong.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAcceptSuggested = async (testCase: TestCase, index: number) => {
    if (!selectedSuiteId) return;

    try {
      const res = await fetch("/api/suites/add-cases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          suiteId: selectedSuiteId,
          testCases: [testCase],
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Failed to add test case");
        return;
      }

      toast.success("Test case added!");

      // ✅ Local state update only – no API re-fetch
      setTestSuites((prev) =>
        prev.map((suite) =>
          suite.id === selectedSuiteId
            ? {
                ...suite,
                testCases: [...(suite.testCases || []), testCase],
              }
            : suite
        )
      );

      // ✅ Accepted wale suggestion ko list se hata do
      setFeedback((prev) =>
        prev
          ? {
              ...prev,
              suggestedTestCases: prev.suggestedTestCases.filter(
                (_, i) => i !== index
              ),
            }
          : prev
      );
    } catch (err) {
      console.error(err);
      toast.error("Failed adding test case.");
    }
  };

  const handleRejectSuggested = (index: number) => {
    const updated = feedback!.suggestedTestCases.filter((_, i) => i !== index);
    setFeedback({ ...feedback!, suggestedTestCases: updated });
  };

  const selectedSuite =
    testSuites.find((s) => s.id === selectedSuiteId) || null;

  const filteredCases =
    selectedSuite?.testCases.filter((tc) =>
      filterType === "all" ? true : tc.type === filterType
    ) ?? [];

  const handleDownloadSuite = (suite: TestSuite) => {
    const blob = new Blob([JSON.stringify(suite, null, 2)], {
      type: "application/json",
    });

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${suite.name}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const isFirstGeneration =
    !selectedSuite || (selectedSuite.testCases?.length ?? 0) === 0;

  return (
    <div className="min-h-screen">
      <button onClick={handleBack} className="text-xs">
        ← Back to Feature
      </button>
      <main className="max-w-5xl mx-auto px-4 py-8 w-full">
        <section className="border border-gray-200 bg-white shadow-sm rounded p-4 mb-8 space-y-4">
          <div>
            <p className="text-[11px] uppercase text-gray-500">Feature</p>
            <input
              type="text"
              className="text-sm w-full mt-1 p-2 border rounded focus:ring-2 focus:ring-amber-500"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setIsDirty(true);
              }}
            />
          </div>

          <div>
            <label className="text-xs font-medium text-gray-700">
              Description
            </label>
            <textarea
              className="text-sm w-full p-2 border rounded focus:ring-2 focus:ring-amber-500 min-h-20"
              value={description}
              onChange={(e) => {
                setDescription(e.target.value);
                setIsDirty(true);
              }}
            />
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleSaveFeature}
              disabled={isSavingFeature || !hasChanges || !name.trim()}
              className="bg-amber-500 text-white text-xs px-3 rounded
                hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSavingFeature ? "Saving..." : "Save Feature"}
            </button>

            <button
              onClick={handleGenerate}
              disabled={
                (!isFirstGeneration && !isDirty) ||
                isGenerating ||
                !name.trim() ||
                !description.trim()
              }
              className="bg-amber-500 text-white text-xs px-3 rounded
                hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isGenerating ? "Generating..." : "Generate Test Cases"}
            </button>
            <div className="flex gap-3 mt-2">
              <button
                onClick={handleFeedbackReview}
                disabled={
                  isReviewing ||
                  !selectedSuite ||
                  !selectedSuite.testCases.length
                }
                className="bg-gray-800 text-white text-xs px-3 py-2 rounded
                hover:bg-gray-900 disabled:opacity-50 disabled:cursor-not-allowed mb-0.5"
              >
                {isReviewing ? "Reviewing..." : "Run AI Feedback Review"}
              </button>
            </div>

            {feedbackError && (
              <p className="text-xs text-red-600 mt-1">{feedbackError}</p>
            )}
            {error && <p className="text-xs text-red-600">{error}</p>}
          </div>

          {feedback && (
            <div className="mt-6 border-t pt-4">
              <h3 className="text-sm font-semibold mb-2">AI Feedback Review</h3>

              <div className="flex items-center gap-2 mb-2">
                <ScoreBadge score={feedback.score} />
                <p className="text-xs text-gray-600">AI Coverage Score</p>
              </div>
              {feedback && (
                <p className="text-[12px] mb-2">
                  <span className="font-semibold">Coverage:</span>{" "}
                  {feedback.score >= 85
                    ? "Strong (good coverage with minor improvements)"
                    : feedback.score >= 60
                    ? "Moderate (covers basics but missing important edge/negative cases)"
                    : "Weak (significant gaps in test coverage)"}
                </p>
              )}

              <p className="text-xs mb-2">
                <span className="font-semibold">Summary:</span>{" "}
                {feedback.summary}
              </p>

              {feedback.missingAreas.length > 0 && (
                <div className="mb-2">
                  <p className="text-xs font-semibold mb-1">
                    Missing / Weak Areas:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {feedback.missingAreas.map((item, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs"
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {feedback.suggestions.length > 0 && (
                <div className="mb-2">
                  <p className="text-xs font-semibold mb-1">
                    Improvement Suggestions:
                  </p>
                  <ul className="flex flex-col gap-1 text-xs text-gray-700">
                    {feedback.suggestions.map((s, i) => (
                      <li key={i} className="flex items-start gap-1">
                        <span className="text-green-600">✔</span>
                        {s}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
          {feedback?.suggestedTestCases &&
            feedback.suggestedTestCases.length > 0 && (
              <div className="mt-6 border-t pt-4">
                <h3 className="font-semibold text-sm mb-2">
                  AI Suggested Test Cases
                </h3>

                <ul className="flex flex-col gap-4">
                  {feedback.suggestedTestCases.map((tc, idx) => (
                    <li
                      key={idx}
                      className="border rounded p-3 shadow-sm bg-gray-50 text-sm"
                    >
                      <div className="flex justify-between mb-1">
                        <span className="uppercase text-xs text-gray-600">
                          {tc.type}
                        </span>
                      </div>

                      <h4 className="font-semibold">{tc.title}</h4>

                      <p className="mt-1 font-semibold text-xs">Steps:</p>
                      <ol className="list-decimal list-inside text-xs">
                        {tc.steps.map((s, i) => (
                          <li key={i}>{s}</li>
                        ))}
                      </ol>

                      <p className="mt-2 text-xs">
                        <span className="font-semibold">Expected:</span>{" "}
                        {tc.expected}
                      </p>

                      {tc.samplePayload && (
                        <pre className="mt-2 bg-white p-2 border rounded text-xs overflow-x-auto">
                          {JSON.stringify(tc.samplePayload, null, 2)}
                        </pre>
                      )}

                      <div className="flex gap-2 mt-3">
                        <button
                          className="px-3 py-1 text-xs bg-amber-500 text-white rounded hover:bg-amber-600"
                          onClick={() => handleAcceptSuggested(tc, idx)}
                        >
                          Accept
                        </button>

                        <button
                          className="px-3 py-1 text-xs bg-gray-300 rounded hover:bg-gray-400"
                          onClick={() => handleRejectSuggested(idx)}
                        >
                          Reject
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
        </section>

        <div className="flex gap-6">
          <aside className="w-1/3 border-r pr-4">
            <h2 className="font-semibold text-sm mb-3">Test Suites</h2>

            {testSuites.length === 0 ? (
              <p className="text-xs text-gray-500">
                No suites yet. Generate test cases.
              </p>
            ) : (
              <ul className="flex flex-col gap-2">
                {testSuites.map((suite) => (
                  <li
                    key={suite.id}
                    onClick={() => {
                      setSelectedSuiteId(suite.id);
                      setExpandedCaseId(null);
                      setFilterType("all");
                    }}
                    className={`p-2 border rounded cursor-pointer text-xs ${
                      suite.id === selectedSuiteId
                        ? "bg-amber-50 border-amber-200"
                        : "hover:bg-gray-50"
                    }`}
                  >
                    <div className="font-medium">{suite.name}</div>
                    <div className="text-[10px] text-gray-500">
                      {new Date(suite.createdAt).toLocaleString()}
                    </div>
                    {suite?.lastFeedbackScore != null && (
                      <div className="text-[10px] text-emerald-700 mt-1">
                        AI Score: {suite.lastFeedbackScore}/100
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </aside>

          <section className="w-2/3 pl-4">
            {!selectedSuite ? (
              <p className="text-sm text-gray-500">Select a suite.</p>
            ) : (
              <>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h2 className="font-semibold text-sm">
                      {selectedSuite.name}
                    </h2>
                    <p className="text-[11px] text-gray-500">
                      {new Date(selectedSuite.createdAt).toLocaleString()}
                    </p>

                    {feedback && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-emerald-50 text-[10px] font-medium text-emerald-700 border border-emerald-200">
                        AI Reviewed
                      </span>
                    )}
                    {lastReviewedAt && (
                      <p className="text-[10px] text-gray-500 mt-1">
                        Last reviewed at:{" "}
                        {new Date(lastReviewedAt).toLocaleString()}
                      </p>
                    )}
                  </div>

                  <button
                    onClick={() => handleDownloadSuite(selectedSuite)}
                    className="text-xs px-3 py-1 border rounded hover:bg-gray-50"
                  >
                    Download JSON
                  </button>
                </div>

                <div className="flex flex-wrap gap-2 mb-4">
                  {tabs.map((tab) => (
                    <button
                      key={tab.value}
                      onClick={() =>
                        setFilterType(
                          tab.value as "all" | "happy" | "negative" | "edge"
                        )
                      }
                      className={`px-3 py-1 text-xs rounded-full ${
                        filterType === tab.value
                          ? "bg-amber-500 text-white"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                {filteredCases.map((tc) => {
                  const expanded = expandedCaseId === tc.id;

                  return (
                    <div
                      key={tc.id}
                      className="border rounded p-3 mb-4 shadow-sm text-sm"
                    >
                      <div className="flex justify-between">
                        <span className="font-mono text-xs">{tc.id}</span>
                        <span className="uppercase text-xs text-gray-500">
                          {tc.type}
                        </span>
                      </div>

                      <button
                        onClick={() =>
                          setExpandedCaseId(expanded ? null : tc.id)
                        }
                        className="text-[11px] mt-2 border px-2 py-1 rounded hover:bg-gray-50"
                      >
                        {expanded ? "Hide" : "View"} details
                      </button>

                      {expanded && (
                        <>
                          <h3 className="font-semibold mt-2 mb-1">
                            {tc.title}
                          </h3>

                          <p className="font-semibold text-xs">Steps:</p>
                          <ol className="list-decimal list-inside text-gray-700">
                            {tc.steps.map((step, i) => (
                              <li key={i}>{step}</li>
                            ))}
                          </ol>

                          <p className="mt-2">
                            <span className="font-semibold">Expected:</span>{" "}
                            {tc.expected}
                          </p>

                          {tc.samplePayload && (
                            <div className="mt-2">
                              <p className="font-semibold text-xs mb-1">
                                Sample Payload:
                              </p>
                              <pre className="bg-gray-50 p-2 rounded border text-xs overflow-x-auto">
                                {JSON.stringify(tc.samplePayload, null, 2)}
                              </pre>

                              <button
                                onClick={() =>
                                  navigator.clipboard
                                    .writeText(
                                      JSON.stringify(tc.samplePayload, null, 2)
                                    )
                                    .then(() => toast.success("Copied!"))
                                }
                                className="text-[11px] underline mt-1"
                              >
                                Copy payload
                              </button>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  );
                })}

                {filteredCases.length === 0 && (
                  <p className="text-xs text-gray-500">
                    No {filterType} test cases in this suite.
                  </p>
                )}
              </>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
