"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import type { FeedbackResult } from "@/src/app/types/testmind";
import { Feature, TestCase, TestSuite } from "@/src/app/types/testmind";
import { updateFeature } from "@/src/app/actions/features";
import ScoreBadge from "@/src/app/components/ScoreBadge";
import Skeleton from "react-loading-skeleton";
import PipelineTrace, { type RunStatus } from "@/src/app/components/PipelineTrace";
import type { RunTrace } from "@/src/lib/ai/graph/topology";
import { caseToMarkdown, download, slug, toCsv, toMarkdown, toPlaywrightSpec, typeCounts } from "@/src/app/lib/export-playwright";
import Breadcrumbs from "@/src/app/components/Breadcrumbs";
import TypeBar from "@/src/app/components/TypeBar";
import { caseLabel } from "@/src/app/lib/case-label";
import { timeAgo } from "@/src/app/lib/format";

const tabs = [
  { label: "All", value: "all" },
  { label: "Happy", value: "happy" },
  { label: "Negative", value: "negative" },
  { label: "Edge", value: "edge" },
];

type SuiteCaseProps = {
  feature: Feature;
  projectName?: string;
};


export default function SuiteCase({ feature, projectName = "Project" }: SuiteCaseProps) {
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
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [caseQuery, setCaseQuery] = useState("");
  const [exportOpen, setExportOpen] = useState(false);
  const toggleCase = (id: string) =>
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
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

  const [hasLoaded, setHasLoaded] = useState<boolean>(false);

  // Pipeline trace for the last generation and review runs.
  const [genStatus, setGenStatus] = useState<RunStatus>("idle");
  const [genTrace, setGenTrace] = useState<RunTrace | null>(null);
  const [reviewStatus, setReviewStatus] = useState<RunStatus>("idle");
  const [reviewTrace, setReviewTrace] = useState<RunTrace | null>(null);


  const handleFeedbackReview = async () => {
    if (!selectedSuite || !selectedSuite.testCases.length) {
      toast.error("No test cases found for this suite.");
      return;
    }

    setFeedbackError(null);
    setIsReviewing(true);
    setReviewTrace(null);
    setReviewStatus("running");

    try {
      const res = await fetch("/api/feedback-review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          featureName: name.trim(),
          description: description.trim(),
          testCases: selectedSuite.testCases,
          // Sent so the route can save the score on the suite.
          suiteId: selectedSuite.id,
          projectId: feature.projectId,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setReviewStatus("error");
        setFeedbackError(data.error || "Failed to get AI feedback.");
        return;
      }

      setFeedback({
        score: data.score,
        summary: data.summary,
        missingAreas: Array.isArray(data.missingAreas) ? data.missingAreas : [],
        suggestions: Array.isArray(data.suggestions) ? data.suggestions : [],
        suggestedTestCases: Array.isArray(data.suggestedTestCases) ? data.suggestedTestCases : [],
      });
      setReviewTrace(data.trace ?? null);
      setReviewStatus("done");
      setTestSuites((prev) =>
        prev.map((s) => (s.id === selectedSuite.id ? { ...s, lastFeedbackScore: data.score, lastFeedbackSummary: data.summary } : s))
      );

      setLastReviewedAt(new Date().toISOString());
      setLastFeedbackScore(data.score);
      setLastFeedbackSummary(data.summary);
    } catch (err) {
      console.error(err);
      setReviewStatus("error");
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
        const res = await fetch(`/api/suites?projectId=${feature.projectId}`, {
          next: { revalidate: 60 },
        });
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
          setHasLoaded(true);
        }
      } catch (err) {
        console.error(err);
        setHasLoaded(false);
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
    setGenTrace(null);
    setGenStatus("running");

    try {
      const res = await fetch("/api/generate-tests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          featureName: name.trim(),
          description: description.trim(),
          projectId: feature.projectId,
          suiteId: selectedSuiteId,
          // The last review steers the next generation prompt.
          lastFeedbackScore: feedback?.score ?? selectedSuite?.lastFeedbackScore ?? null,
          lastFeedbackSummary: feedback?.summary ?? selectedSuite?.lastFeedbackSummary ?? "",
          lastReviewedAt: lastReviewedAt || selectedSuite?.lastReviewedAt || "",
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setGenStatus("error");
        setError(data.error || "Failed to generate test cases");
        return;
      }
      setGenTrace(data.trace ?? null);
      setGenStatus("done");

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
      setExpandedIds(new Set());
      setFilterType("all");
      setIsDirty(false);
    } catch (err) {
      console.error(err);
      setGenStatus("error");
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

  const cq = caseQuery.trim().toLowerCase();
  const filteredCases =
    selectedSuite?.testCases.filter((tc) =>
      (filterType === "all" ? true : String(tc.type).toLowerCase() === filterType) &&
      (!cq || `${tc.id} ${tc.title} ${tc.expected} ${tc.steps.join(" ")}`.toLowerCase().includes(cq))
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
      <Breadcrumbs
        items={[
          { label: "Projects", href: "/projects" },
          { label: projectName, href: `/projects/${feature.projectId}` },
          { label: feature.name },
        ]}
      />
      <main className="w-full">
        <section className="mb-8 space-y-4 rounded-lg border bg-white p-5 shadow-sm dark:bg-gray-900">
          <div>
            <div className="flex items-center justify-between">
              <p className="text-[11px] uppercase tracking-wide text-gray-500">Feature</p>
              {isDirty && <span className="tm-fade rounded-full bg-amber-100 px-2 py-0.5 text-[10px] text-amber-800">Unsaved changes</span>}
            </div>
            <input
              type="text"
              aria-label="Feature name"
              className="mt-1 w-full rounded border border-transparent px-2 py-1 -mx-2 text-xl font-semibold hover:border-gray-200 focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-500/30 dark:bg-transparent"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setIsDirty(true);
              }}
            />
          </div>

          <div>
            <label className="text-[11px] uppercase tracking-wide text-gray-500">
              What should this feature do?
            </label>
            <textarea
              className="mt-1 min-h-24 w-full rounded border p-3 text-sm leading-relaxed focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-500/30 dark:bg-gray-950"
              value={description}
              onChange={(e) => {
                setDescription(e.target.value);
                setIsDirty(true);
              }}
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleGenerate}
              disabled={
                (!isFirstGeneration && !isDirty) ||
                isGenerating ||
                !name.trim() ||
                !description.trim()
              }
              title={!isFirstGeneration && !isDirty ? "Edit the description to generate a new version" : undefined}
              className="tm-press inline-flex items-center gap-2 rounded bg-amber-500 px-4 py-2 text-xs font-medium text-white shadow-sm hover:bg-amber-600 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isGenerating && <span className="h-3 w-3 animate-spin rounded-full border-2 border-white/40 border-t-white" />}
              {isGenerating ? "Generating..." : "Generate Test Cases"}
            </button>
            <button
              onClick={handleFeedbackReview}
              disabled={
                isReviewing ||
                !selectedSuite ||
                !selectedSuite.testCases.length
              }
              className="tm-press inline-flex items-center gap-2 rounded bg-gray-900 px-4 py-2 text-xs font-medium text-white shadow-sm hover:bg-black disabled:cursor-not-allowed disabled:opacity-50 dark:bg-gray-200 dark:text-black"
            >
              {isReviewing && <span className="h-3 w-3 animate-spin rounded-full border-2 border-white/40 border-t-white" />}
              {isReviewing ? "Reviewing..." : "Run AI Feedback Review"}
            </button>
            <button
              onClick={handleSaveFeature}
              disabled={isSavingFeature || !hasChanges || !name.trim()}
              className="tm-press rounded border px-4 py-2 text-xs font-medium hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40 dark:hover:bg-gray-800"
            >
              {isSavingFeature ? "Saving..." : "Save Feature"}
            </button>

            {feedbackError && (
              <p className="text-xs text-red-600">{feedbackError}</p>
            )}
            {error && <p className="text-xs text-red-600">{error}</p>}
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <PipelineTrace workflow="generation" status={genStatus} trace={genTrace} />
            <PipelineTrace workflow="review" status={reviewStatus} trace={reviewTrace} />
          </div>

          {feedback && (
            <div id="review-panel" className="tm-rise mt-6 scroll-mt-4 border-t pt-4">
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

              <p className="text-xs mb-2 dark:bg-gray-800">
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
                        className="rounded border border-amber-200 bg-amber-50 px-2 py-1 text-xs text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
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
              <div className="mt-6 border-t pt-4  dark:bg-gray-800">
                <h3 className="font-semibold text-sm mb-2">
                  AI Suggested Test Cases
                </h3>

                <ul className="flex flex-col gap-4">
                  {feedback.suggestedTestCases.map((tc, idx) => (
                    <li
                      key={idx}
                      className="tm-rise border rounded p-3 shadow-sm bg-gray-50 text-sm dark:bg-gray-900"
                      style={{ animationDelay: `${idx * 80}ms` }}
                    >
                      <div className="flex justify-between mb-1">
                        <span className="text-xs text-gray-500">
                          {caseLabel(tc.type)}
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
                        <pre className="mt-2 bg-white p-2 border rounded text-xs overflow-x-auto dark:bg-gray-800">
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

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
          <aside className="lg:border-r lg:pr-6">
            <h2 className="mb-3 flex items-center justify-between text-sm font-semibold">
              Test Suites
              <span className="text-[11px] font-normal text-gray-500">{testSuites.length} {testSuites.length === 1 ? "version" : "versions"}</span>
            </h2>

            {testSuites.length === 0 ? (
              hasLoaded ? (
                <p className="text-xs text-gray-500">
                  No suites yet. Generate test cases.
                </p>
              ) : (
                <span className="w-[92%]">
                  <Skeleton height={15} width={"100%"} />
                  <Skeleton height={15} width={"70%"} />
                </span>
              )
            ) : (
              <ul className="flex flex-col gap-2">
                {testSuites?.map((suite) => (
                  <li
                    key={suite.id}
                    onClick={() => {
                      setSelectedSuiteId(suite.id);
                      setExpandedIds(new Set());
                      setFilterType("all");
                    }}
                    className={`cursor-pointer rounded-lg border border-l-4 p-3 text-xs transition-colors dark:bg-gray-900 ${
                      suite.id === selectedSuiteId
                        ? "border-amber-200 border-l-amber-500 bg-amber-50 dark:border-gray-700 dark:border-l-amber-500"
                        : "border-l-transparent hover:bg-gray-50 dark:hover:bg-gray-800"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="line-clamp-2 font-medium">{suite.name}</span>
                      {suite?.lastFeedbackScore != null && (
                        <span title="AI review score" className="shrink-0 text-[11px] font-semibold text-gray-700 dark:text-gray-200">
                          {suite.lastFeedbackScore}/100
                        </span>
                      )}
                    </div>
                    <div className="mt-2">
                      <TypeBar cases={suite.testCases ?? []} />
                    </div>
                    <div className="mt-1.5 text-[10px] text-gray-500">
                      {suite.testCases?.length ?? 0} cases, {timeAgo(suite.createdAt)}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </aside>

          {hasLoaded ? (
            <section className="min-w-0">
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

                    <div className="relative">
                      <button
                        onClick={() => setExportOpen((o) => !o)}
                        disabled={!selectedSuite.testCases.length}
                        aria-haspopup="menu"
                        aria-expanded={exportOpen}
                        className="text-xs px-3 py-1.5 border rounded hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors disabled:opacity-50"
                      >
                        Export ▾
                      </button>
                      {exportOpen && (
                        <>
                          <div className="fixed inset-0 z-10" onClick={() => setExportOpen(false)} />
                          <div role="menu" className="tm-slide absolute right-0 z-20 mt-1 w-56 overflow-hidden rounded border bg-white text-xs shadow-lg dark:border-gray-700 dark:bg-gray-900">
                            {[
                              { label: "JSON", hint: "raw suite data", run: () => handleDownloadSuite(selectedSuite) },
                              { label: "Playwright spec", hint: "one test per case", run: () => download(`${slug(selectedSuite.name)}.spec.ts`, toPlaywrightSpec(selectedSuite), "text/typescript") },
                              { label: "CSV", hint: "for sheets or a test tool import", run: () => download(`${slug(selectedSuite.name)}.csv`, toCsv(selectedSuite), "text/csv") },
                              { label: "Markdown", hint: "for a ticket or PR", run: () => download(`${slug(selectedSuite.name)}.md`, toMarkdown(selectedSuite), "text/markdown") },
                            ].map((o) => (
                              <button
                                key={o.label}
                                role="menuitem"
                                onClick={() => {
                                  o.run();
                                  setExportOpen(false);
                                }}
                                className="flex w-full items-center justify-between px-3 py-2 text-left hover:bg-amber-50 dark:hover:bg-gray-800"
                              >
                                <span className="font-medium">{o.label}</span>
                                <span className="text-[10px] text-gray-400">{o.hint}</span>
                              </button>
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  {(() => {
                    const c = typeCounts(selectedSuite.testCases);
                    const score = feedback?.score ?? selectedSuite.lastFeedbackScore;
                    return (
                      <div className="mb-4 rounded border p-3 dark:border-gray-700">
                        <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2 text-xs">
                          <span>
                            <span className="text-base font-semibold">{selectedSuite.testCases.length}</span> test cases
                          </span>
                          <span className="text-gray-500">
                            {typeof score === "number" ? (
                              <>
                                Last review <span className="font-semibold text-gray-900 dark:text-white">{score}/100</span>
                              </>
                            ) : (
                              "Not reviewed yet"
                            )}
                          </span>
                        </div>
                        <TypeBar cases={selectedSuite.testCases} showLegend />
                        {c.negative + c.edge === 0 && selectedSuite.testCases.length > 0 && (
                          <p className="mt-2 text-[11px] text-amber-700">Only happy paths so far. Run a review to find negative and edge cases.</p>
                        )}
                      </div>
                    );
                  })()}

                  {(() => {
                    if (isGenerating || isReviewing || !selectedSuite.testCases.length) return null;
                    const score = feedback?.score ?? selectedSuite.lastFeedbackScore ?? null;
                    const waiting = feedback?.suggestedTestCases?.length ?? 0;
                    const step =
                      waiting > 0
                        ? {
                            tone: "amber",
                            text: `${waiting} suggested ${waiting === 1 ? "case is" : "cases are"} waiting from the review. Accept the ones you want to add.`,
                            cta: "Show suggestions",
                            run: () => document.getElementById("review-panel")?.scrollIntoView({ behavior: "smooth" }),
                          }
                        : score === null
                          ? {
                              tone: "amber",
                              text: "This suite has not been reviewed. A review scores coverage out of 100 and lists the cases that are missing.",
                              cta: "Run review",
                              run: handleFeedbackReview,
                            }
                          : score < 85
                            ? {
                                tone: "gray",
                                text: `Scored ${score}/100. Add the missing rules to the description and generate again; the next run uses this review to target the gaps.`,
                                cta: null,
                                run: null,
                              }
                            : {
                                tone: "green",
                                text: `Scored ${score}/100. Good coverage, ready to export.`,
                                cta: "Export",
                                run: () => setExportOpen(true),
                              };
                    const tones: Record<string, string> = {
                      amber: "border-amber-300 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30",
                      gray: "border-gray-200 bg-gray-50 dark:bg-gray-900",
                      green: "border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950/30",
                    };
                    return (
                      <div className={`tm-rise mb-4 flex flex-wrap items-center gap-3 rounded-lg border px-3 py-2.5 ${tones[step.tone]}`}>
                        <span className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">Next step</span>
                        <p className="min-w-0 flex-1 text-xs">{step.text}</p>
                        {step.cta && step.run && (
                          <button
                            onClick={step.run}
                            className="tm-press shrink-0 rounded bg-gray-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-black dark:bg-gray-200 dark:text-black"
                          >
                            {step.cta}
                          </button>
                        )}
                      </div>
                    );
                  })()}

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
                        <span className="ml-1 opacity-70">
                          {tab.value === "all" ? selectedSuite.testCases.length : typeCounts(selectedSuite.testCases)[tab.value as "happy" | "negative" | "edge"]}
                        </span>
                      </button>
                    ))}
                    <input
                      type="search"
                      value={caseQuery}
                      onChange={(e) => setCaseQuery(e.target.value)}
                      placeholder="Search cases"
                      aria-label="Search test cases"
                      className="ml-auto w-40 rounded border px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500 dark:border-gray-700 dark:bg-gray-900"
                    />
                    <button
                      onClick={() =>
                        setExpandedIds(expandedIds.size >= filteredCases.length ? new Set() : new Set(filteredCases.map((t) => t.id)))
                      }
                      className="text-xs px-2 py-1 border rounded hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800"
                    >
                      {expandedIds.size >= filteredCases.length && filteredCases.length > 0 ? "Collapse all" : "Expand all"}
                    </button>
                  </div>

                  {filteredCases.map((tc, i) => {
                    const expanded = expandedIds.has(tc.id);
                    const type = String(tc.type).toLowerCase();

                    return (
                      <div
                        key={tc.id}
                        className="tm-rise border rounded mb-3 text-sm transition-shadow hover:shadow-md dark:border-gray-700 dark:bg-gray-900"
                        style={{ animationDelay: `${Math.min(i, 10) * 50}ms` }}
                      >
                        <button
                          onClick={() => toggleCase(tc.id)}
                          aria-expanded={expanded}
                          className="flex w-full items-center gap-3 p-3 text-left"
                        >
                          <span title={tc.id} className="w-6 shrink-0 text-right text-xs tabular-nums text-gray-400">{i + 1}.</span>
                          <span className="min-w-0 flex-1 font-medium">{tc.title}</span>
                          <span className="shrink-0 text-xs text-gray-500">{caseLabel(type)}</span>
                          <span className={`shrink-0 text-gray-400 transition-transform ${expanded ? "rotate-180" : ""}`} aria-hidden>▾</span>
                        </button>

                        {expanded && (
                          <div className="tm-slide border-t px-3 pb-3 pt-2 dark:border-gray-700">

                            <p className="font-semibold text-xs">Steps:</p>
                            <ol className="list-decimal list-inside text-gray-700 dark:text-white">
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
                                <pre className="bg-gray-50 p-2 rounded border text-xs overflow-x-auto dark:bg-gray-950">
                                  {JSON.stringify(tc.samplePayload, null, 2)}
                                </pre>

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
                                      .then(() => toast.success("Copied!"))
                                  }
                                  className="text-[11px] underline mt-1"
                                >
                                  Copy payload
                                </button>
                              </div>
                            )}
                            <button
                              onClick={() =>
                                navigator.clipboard
                                  .writeText(caseToMarkdown(tc))
                                  .then(() => toast.success("Copied as Markdown"))
                              }
                              className="mt-3 text-[11px] border rounded px-2 py-1 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800"
                            >
                              Copy as Markdown
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {filteredCases.length === 0 && (
                    <p className="text-xs text-gray-500">
                      {cq ? `No test cases match "${caseQuery}".` : `No ${filterType} test cases in this suite.`}
                    </p>
                  )}
                </>
              )}
            </section>
          ) : (
            <section className="min-w-0">
              <div className="flex flex-col w-full gap-2">
                <div className="flex">
                  <div className="w-[80%]">
                    <Skeleton height={20} width={"50%"} />
                    <Skeleton height={20} width={"25%"} />
                  </div>
                  <div className="w-[20%] mt-1.5 justify-end!">
                    <Skeleton height={30} width={"100%"} />
                  </div>
                </div>

                <div className="flex w-[74%] gap-5">
                  <Skeleton height={20} width={"60px"} />
                  <Skeleton height={20} width={"60px"} />
                  <Skeleton height={20} width={"60px"} />
                  <Skeleton height={20} width={"60px"} />
                </div>
              </div>
              <div className="w-full mt-3">
                <Skeleton
                  height={80}
                  count={10}
                  width={"100%"}
                  className="mb-2.5"
                />
              </div>
            </section>
          )}
        </div>
      </main>
    </div>
  );
}
