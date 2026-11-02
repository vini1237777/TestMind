"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import type { FeedbackResult } from "@/src/app/types/testmind";
import { Feature, TestCase, TestSuite } from "@/src/app/types/testmind";
import { updateFeature } from "@/src/app/actions/features";
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

      toast.success("Case added");

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

  const handleAcceptAll = async () => {
    const all = feedback?.suggestedTestCases ?? [];
    if (!selectedSuiteId || !all.length) return;
    try {
      const res = await fetch("/api/suites/add-cases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ suiteId: selectedSuiteId, testCases: all }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Could not add the cases");
        return;
      }
      toast.success(`${all.length} ${all.length === 1 ? "case" : "cases"} added`);
      setTestSuites((prev) => prev.map((x) => (x.id === selectedSuiteId ? { ...x, testCases: [...(x.testCases || []), ...all] } : x)));
      setFeedback((prev) => (prev ? { ...prev, suggestedTestCases: [] } : prev));
    } catch (err) {
      console.error(err);
      toast.error("Could not add the cases");
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

  // Opened from "Run it for real" on the home page (?run=1): start the run once the suite is loaded.
  const autoRan = useRef(false);
  useEffect(() => {
    if (autoRan.current || !selectedSuiteId || !isFirstGeneration) return;
    const url = new URL(window.location.href);
    if (url.searchParams.get("run") !== "1") return;
    autoRan.current = true;
    url.searchParams.delete("run");
    window.history.replaceState(null, "", url);
    handleGenerate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSuiteId, isFirstGeneration]);

  const versionIndex = selectedSuite ? testSuites.length - testSuites.findIndex((x) => x.id === selectedSuite.id) : 0;
  const reviewScore = feedback?.score ?? selectedSuite?.lastFeedbackScore ?? null;
  const reviewSummary = feedback?.summary ?? selectedSuite?.lastFeedbackSummary ?? "";
  const hasCases = !!selectedSuite?.testCases.length;
  const verdict = (n: number) =>
    n >= 85
      ? "Good coverage. Only small gaps left."
      : n >= 60
        ? "The basics are covered, but some failure and edge cases are missing."
        : "Large parts of this feature are not tested yet.";
  const cleanStep = (st: string) => st.replace(/^step\s*\d+\s*[:.]\s*/i, "");

  return (
    <div className="mx-auto min-h-screen max-w-6xl">
      <Breadcrumbs
        items={[
          { label: "Projects", href: "/projects" },
          { label: projectName, href: `/projects/${feature.projectId}` },
          { label: feature.name },
        ]}
      />

      {/* What is being tested */}
      <section className="mt-2 max-w-3xl">
        <input
          type="text"
          aria-label="Feature name"
          className="-mx-2 w-full rounded border border-transparent px-2 py-1 text-2xl font-semibold hover:border-gray-200 focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-500/30 dark:bg-transparent"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            setIsDirty(true);
          }}
        />
        <label htmlFor="feature-description" className="mt-3 block text-xs text-gray-500">
          What this feature should do
        </label>
        <textarea
          id="feature-description"
          rows={3}
          className="mt-1 w-full resize-y rounded border p-3 text-sm leading-relaxed focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-500/30 dark:bg-gray-950"
          value={description}
          onChange={(e) => {
            setDescription(e.target.value);
            setIsDirty(true);
          }}
        />

        <div className="mt-2 flex flex-wrap items-center gap-2">
          {(isFirstGeneration || isDirty || isGenerating) && (
            <button
              onClick={handleGenerate}
              disabled={isGenerating || !name.trim() || !description.trim()}
              className="tm-press inline-flex items-center gap-2 rounded bg-amber-500 px-4 py-2 text-xs font-medium text-white shadow-sm hover:bg-amber-600 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-amber-400 dark:text-black dark:hover:bg-amber-300"
            >
              {isGenerating && <span className="h-3 w-3 animate-spin rounded-full border-2 border-white/40 border-t-white" />}
              {isGenerating ? "Writing test cases" : isFirstGeneration ? "Generate test cases" : "Generate a new version"}
            </button>
          )}
          {hasChanges && (
            <button
              onClick={handleSaveFeature}
              disabled={isSavingFeature || !name.trim()}
              className="tm-fade tm-press rounded border px-4 py-2 text-xs font-medium hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40 dark:hover:bg-gray-800"
            >
              {isSavingFeature ? "Saving" : "Save changes"}
            </button>
          )}
          {!isFirstGeneration && !isDirty && !isGenerating && (
            <p className="text-xs text-gray-500">Change the description to generate a new version.</p>
          )}
          {error && <p className="text-xs text-red-600">{error}</p>}
        </div>
        {genStatus !== "idle" && (
          <div className="tm-slide mt-1">
            <PipelineTrace workflow="generation" status={genStatus} trace={genTrace} />
          </div>
        )}
      </section>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
        {/* The test cases */}
        <section className="min-w-0 border border-amber-300 dark:border-amber-500/40">
          {!hasLoaded ? (
            isGenerating ? (
              <p className="p-4 text-sm text-gray-500">The cases will appear here in a few seconds.</p>
            ) : (
              <div className="p-4">
                <Skeleton height={20} width="40%" />
                <Skeleton height={44} count={6} className="mt-2" />
              </div>
            )
          ) : !selectedSuite ? (
            <p className="p-4 text-sm text-gray-500">Select a version.</p>
          ) : (
            <>
              <div className="flex min-h-10 flex-wrap items-center gap-2 bg-amber-300 px-3 py-1.5 text-black dark:bg-amber-400">
                <h2 className="text-sm font-semibold">
                  Test cases <span className="font-normal">({selectedSuite.testCases.length})</span>
                </h2>
                {testSuites.length > 1 && (
                  <select
                    aria-label="Version"
                    value={selectedSuite.id}
                    onChange={(e) => {
                      setSelectedSuiteId(e.target.value);
                      setExpandedIds(new Set());
                      setFilterType("all");
                    }}
                    className="rounded-md border-0 bg-amber-200 px-2 py-1 text-xs text-black focus:outline-none focus:ring-2 focus:ring-black/30 dark:bg-amber-300"
                  >
                    {testSuites.map((v, i) => (
                      <option key={v.id} value={v.id}>
                        Version {testSuites.length - i}
                        {i === 0 ? " (latest)" : ""}, {timeAgo(v.createdAt)}
                        {v.lastFeedbackScore != null ? `, reviewed ${v.lastFeedbackScore}` : ""}
                      </option>
                    ))}
                  </select>
                )}

                <div className="relative ml-auto">
                  <button
                    onClick={() => setExportOpen((o) => !o)}
                    disabled={!hasCases}
                    aria-haspopup="menu"
                    aria-expanded={exportOpen}
                    className="rounded-md px-2 py-1 text-sm font-medium transition-colors hover:bg-amber-200 disabled:opacity-50 dark:hover:bg-amber-300"
                  >
                    Export ▾
                  </button>
                  {exportOpen && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setExportOpen(false)} />
                      <div role="menu" className="tm-slide absolute right-0 z-20 mt-1 w-56 overflow-hidden rounded border bg-white text-xs shadow-lg dark:border-gray-700 dark:bg-gray-900">
                        {[
                          { label: "Playwright spec", hint: "one test per case", run: () => download(`${slug(selectedSuite.name)}.spec.ts`, toPlaywrightSpec(selectedSuite), "text/typescript") },
                          { label: "CSV", hint: "for a sheet or test tool", run: () => download(`${slug(selectedSuite.name)}.csv`, toCsv(selectedSuite), "text/csv") },
                          { label: "Markdown", hint: "for a ticket or PR", run: () => download(`${slug(selectedSuite.name)}.md`, toMarkdown(selectedSuite), "text/markdown") },
                          { label: "JSON", hint: "raw data", run: () => handleDownloadSuite(selectedSuite) },
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

              <div className="px-3 pt-3">
              <TypeBar cases={selectedSuite.testCases} />

              <div className="mt-3 flex flex-wrap items-center gap-1 border-b pb-3 text-sm dark:border-gray-700">
                {tabs.map((tab) => {
                  const count = tab.value === "all" ? selectedSuite.testCases.length : typeCounts(selectedSuite.testCases)[tab.value as "happy" | "negative" | "edge"];
                  const on = filterType === tab.value;
                  return (
                    <button
                      key={tab.value}
                      onClick={() => setFilterType(tab.value as "all" | "happy" | "negative" | "edge")}
                      className={`rounded-md px-2 py-1 transition-colors ${on ? "bg-amber-200 font-medium text-black dark:bg-amber-300" : "text-gray-600 hover:bg-amber-100 dark:text-gray-300 dark:hover:bg-gray-800"}`}
                    >
                      {tab.value === "all" ? "All" : caseLabel(tab.value)} ({count})
                    </button>
                  );
                })}
                <div className="ml-auto flex items-center gap-2">
                  <input
                    type="search"
                    value={caseQuery}
                    onChange={(e) => setCaseQuery(e.target.value)}
                    placeholder="Search cases"
                    aria-label="Search test cases"
                    className="w-40 rounded border px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500/40 dark:border-gray-700 dark:bg-gray-900"
                  />
                  <button
                    onClick={() => setExpandedIds(expandedIds.size >= filteredCases.length ? new Set() : new Set(filteredCases.map((t) => t.id)))}
                    className="rounded-md px-2 py-1 text-xs hover:bg-amber-100 dark:hover:bg-gray-800"
                  >
                    {expandedIds.size >= filteredCases.length && filteredCases.length > 0 ? "Collapse all" : "Expand all"}
                  </button>
                </div>
              </div>

              </div>
              <ul className="divide-y px-3 dark:divide-gray-700">
                {filteredCases.map((tc, i) => {
                  const expanded = expandedIds.has(tc.id);
                  return (
                    <li key={tc.id} className="tm-rise text-sm" style={{ animationDelay: `${Math.min(i, 10) * 40}ms` }}>
                      <button
                        onClick={() => toggleCase(tc.id)}
                        aria-expanded={expanded}
                        className="flex w-full items-center gap-3 px-1 py-2.5 text-left hover:bg-amber-50 dark:hover:bg-gray-900"
                      >
                        <span title={tc.id} className="w-6 shrink-0 text-right text-xs tabular-nums text-gray-400">
                          {i + 1}.
                        </span>
                        <span className="min-w-0 flex-1">{tc.title}</span>
                        <span className="shrink-0 text-xs text-gray-500">{caseLabel(tc.type)}</span>
                        <span className={`shrink-0 text-xs text-gray-400 transition-transform ${expanded ? "rotate-180" : ""}`} aria-hidden>
                          ▾
                        </span>
                      </button>

                      {expanded && (
                        <div className="tm-slide pb-4 pl-10 pr-2 text-[13px] text-gray-700 dark:text-gray-300">
                          <ol className="list-decimal space-y-0.5 pl-4 marker:text-gray-400">
                            {tc.steps.map((step, k) => (
                              <li key={k}>{cleanStep(step)}</li>
                            ))}
                          </ol>
                          <p className="mt-2">
                            <span className="text-gray-500">Expected:</span> {tc.expected}
                          </p>
                          {tc.samplePayload && Object.keys(tc.samplePayload).length > 0 && (
                            <pre className="mt-2 overflow-x-auto rounded bg-gray-50 p-2 text-xs dark:bg-gray-950">{JSON.stringify(tc.samplePayload, null, 2)}</pre>
                          )}
                          <div className="mt-2 flex gap-3 text-xs text-gray-500">
                            {tc.samplePayload && Object.keys(tc.samplePayload).length > 0 && (
                              <button
                                className="underline-offset-2 hover:text-gray-800 hover:underline dark:hover:text-gray-200"
                                onClick={() => navigator.clipboard.writeText(JSON.stringify(tc.samplePayload, null, 2)).then(() => toast.success("Payload copied"))}
                              >
                                Copy payload
                              </button>
                            )}
                            <button
                              className="underline-offset-2 hover:text-gray-800 hover:underline dark:hover:text-gray-200"
                              onClick={() => navigator.clipboard.writeText(caseToMarkdown(tc)).then(() => toast.success("Copied as Markdown"))}
                            >
                              Copy as Markdown
                            </button>
                          </div>
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>

              {filteredCases.length === 0 && (
                <p className="px-3 py-6 text-sm text-gray-500">
                  {cq ? `No test cases match "${caseQuery}".` : filterType === "all" ? "No test cases yet." : `No ${caseLabel(filterType).toLowerCase()} cases in this version.`}
                </p>
              )}
              {testSuites.length > 1 && (
                <p className="px-3 py-2 text-xs text-gray-500">
                  Showing version {versionIndex} of {testSuites.length}.
                </p>
              )}
            </>
          )}
        </section>

        {/* The review, kept beside the cases it talks about */}
        <aside id="review-panel" className="scroll-mt-4 lg:sticky lg:top-4 lg:self-start">
          <div className="border border-amber-300 text-sm dark:border-amber-500/40">
            <div className="flex min-h-10 items-center justify-between gap-4 bg-amber-300 px-3 py-1.5 text-black dark:bg-amber-400">
              <h2 className="font-semibold">Review</h2>
              {reviewScore != null && !isReviewing && (
                <p className="tabular-nums">
                  <span className="text-base font-bold">{reviewScore}</span>/100
                </p>
              )}
            </div>
            {/* Score as a strip under the header, the same shape as the case mix */}
            {reviewScore != null && !isReviewing && (
              <div className="h-1 bg-amber-100 dark:bg-slate-800" title={`${reviewScore} out of 100`}>
                <div className="tm-grow h-full bg-black dark:bg-amber-300" style={{ width: `${reviewScore}%` }} />
              </div>
            )}

            <div className="p-4">
              {isReviewing ? (
                <div className="space-y-3">
                  <PipelineTrace workflow="review" status={reviewStatus} trace={reviewTrace} />
                  <p className="text-xs text-gray-500">Reading {selectedSuite?.testCases.length ?? 0} cases against the description. This takes about ten seconds.</p>
                  <div className="space-y-2" aria-hidden>
                    <div className="h-3 w-11/12 animate-pulse rounded bg-amber-100 dark:bg-slate-800" />
                    <div className="h-3 w-4/5 animate-pulse rounded bg-amber-100 dark:bg-slate-800" />
                    <div className="h-3 w-2/3 animate-pulse rounded bg-amber-100 dark:bg-slate-800" />
                  </div>
                </div>
              ) : reviewScore == null ? (
                <>
                  <p className="font-medium">How complete are these tests?</p>
                  <p className="mt-1 text-gray-600 dark:text-gray-400">
                    {hasCases
                      ? "A review reads the cases against the description, scores them out of 100 and suggests the ones that are missing."
                      : "Generate the test cases first, then come back here to check them for gaps."}
                  </p>
                  <button
                    onClick={handleFeedbackReview}
                    disabled={!hasCases}
                    className="tm-press mt-4 w-full rounded bg-amber-500 px-4 py-2 text-xs font-medium text-white shadow-sm hover:bg-amber-600 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-amber-400 dark:text-black dark:hover:bg-amber-300"
                  >
                    Review coverage
                  </button>
                </>
              ) : (
                <>
                  <p className="font-semibold leading-snug">{verdict(reviewScore)}</p>
                  {reviewSummary && (
                    <details className="group mt-1">
                      <summary className="cursor-pointer list-none text-[13px] leading-relaxed text-gray-600 dark:text-gray-400">
                        <span className="line-clamp-2 group-open:line-clamp-none">{reviewSummary}</span>
                        <span className="text-xs text-amber-700 hover:underline group-open:hidden dark:text-amber-400">Read more</span>
                      </summary>
                    </details>
                  )}

                  {feedback && feedback.missingAreas.length > 0 && (
                    <div className="mt-4">
                      <p className="text-xs font-semibold">Not covered yet</p>
                      <ul className="mt-1.5 space-y-1.5 text-[13px] text-gray-700 dark:text-gray-300">
                        {feedback.missingAreas.map((item, idx) => (
                          <li key={idx} className="flex gap-2">
                            <span aria-hidden className="mt-[7px] h-1.5 w-1.5 shrink-0 bg-amber-500" />
                            <span>{item.replace(/\.$/, "")}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {feedback && feedback.suggestedTestCases.length > 0 && (
                    <div className="mt-5">
                      <div className="flex items-baseline justify-between">
                        <p className="text-xs font-semibold">
                          Suggested cases <span className="font-normal text-gray-500">({feedback.suggestedTestCases.length})</span>
                        </p>
                        {feedback.suggestedTestCases.length > 1 && (
                          <button onClick={handleAcceptAll} className="text-xs font-medium text-amber-700 hover:underline dark:text-amber-400">
                            Accept all
                          </button>
                        )}
                      </div>
                      <ul className="mt-2 space-y-3">
                        {feedback.suggestedTestCases.map((tc, idx) => (
                          <li key={idx} className="tm-rise border border-gray-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-900" style={{ animationDelay: `${idx * 60}ms` }}>
                            <p className="text-xs text-gray-500">{caseLabel(tc.type)}</p>
                            <p className="mt-0.5 font-semibold leading-snug">{tc.title}</p>

                            <p className="mt-2 text-xs font-semibold">Steps</p>
                            <ol className="mt-0.5 list-decimal space-y-0.5 pl-4 text-xs text-gray-700 dark:text-gray-300">
                              {tc.steps.map((st, k) => (
                                <li key={k}>{cleanStep(st)}</li>
                              ))}
                            </ol>

                            <p className="mt-2 text-xs">
                              <span className="font-semibold">Expected:</span> <span className="text-gray-700 dark:text-gray-300">{tc.expected}</span>
                            </p>

                            {tc.samplePayload && Object.keys(tc.samplePayload).length > 0 && (
                              <pre className="mt-2 overflow-x-auto border bg-gray-50 p-2 text-[11px] dark:border-slate-700 dark:bg-slate-950">{JSON.stringify(tc.samplePayload, null, 2)}</pre>
                            )}

                            <div className="mt-3 flex gap-2">
                              <button
                                className="tm-press rounded bg-amber-500 px-3 py-1 text-xs font-medium text-white hover:bg-amber-600 dark:bg-amber-400 dark:text-black dark:hover:bg-amber-300"
                                onClick={() => handleAcceptSuggested(tc, idx)}
                              >
                                Accept
                              </button>
                              <button
                                className="tm-press rounded bg-gray-200 px-3 py-1 text-xs font-medium text-gray-800 hover:bg-gray-300 dark:bg-slate-700 dark:text-gray-100 dark:hover:bg-slate-600"
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

                  <div className="mt-5 flex items-center justify-between gap-2 border-t pt-3 text-xs dark:border-slate-700">
                    <span
                      className="text-gray-500"
                      title={reviewTrace ? `Took ${(reviewTrace.totalMs / 1000).toFixed(1)}s` : undefined}
                    >
                      {reviewStatus === "done"
                        ? "Reviewed just now"
                        : selectedSuite?.lastReviewedAt
                          ? `Reviewed ${timeAgo(String(selectedSuite.lastReviewedAt))}`
                          : "Reviewed earlier"}
                    </span>
                    <button onClick={handleFeedbackReview} disabled={!hasCases} className="rounded px-2 py-1 font-medium hover:bg-amber-100 dark:hover:bg-slate-800">
                      Review again
                    </button>
                  </div>
                </>
              )}
              {feedbackError && <p className="mt-2 text-xs text-red-600">{feedbackError}</p>}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
