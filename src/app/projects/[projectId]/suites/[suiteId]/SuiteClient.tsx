"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { FiCheck, FiChevronDown, FiChevronRight, FiCopy, FiDownload, FiPlay, FiSearch, FiX } from "react-icons/fi";
import type { FeedbackResult, Feature, TestCase, TestSuite } from "@/src/app/types/testmind";
import type { RunTrace } from "@/src/lib/ai/graph/topology";
import { updateFeature } from "@/src/app/actions/features";
import PipelineTrace, { type RunStatus } from "@/src/app/components/PipelineTrace";
import { CASE_TYPES, CoverageBar, ScoreRing, TypePill, caseType, countByType, shortId, timeAgo, type CaseType } from "@/src/app/components/ui";
import { download, slug, toPlaywrightSpec } from "@/src/app/lib/export-playwright";

type Filter = "all" | CaseType;

function CaseRow({ tc, expanded, onToggle, index = 0 }: { tc: TestCase; expanded: boolean; onToggle: () => void; index?: number }) {
  const hasPayload = tc.samplePayload && Object.keys(tc.samplePayload).length > 0;
  return (
    <li className="animate-rise" style={{ animationDelay: `${Math.min(index, 10) * 40}ms` }}>
      <button type="button" onClick={onToggle} aria-expanded={expanded}
        className="grid w-full grid-cols-[16px_56px_1fr_auto] items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-accent-soft">
        {expanded ? <FiChevronDown className="text-faint" /> : <FiChevronRight className="text-faint" />}
        <span className="font-mono text-[12px] text-muted">{tc.id}</span>
        <span className="truncate text-[13.5px]">{tc.title}</span>
        <TypePill type={caseType(tc)} />
      </button>
      {expanded && (
        <div className="grid gap-4 border-t border-line bg-panel-2/40 px-4 py-4 pl-[52px] md:grid-cols-2">
          <div>
            <p className="eyebrow mb-2">steps</p>
            <ol className="space-y-1.5 text-[13px]">
              {tc.steps.map((s, i) => (
                <li key={i} className="flex gap-2">
                  <span className="font-mono text-[11px] text-faint mt-0.5 w-4 shrink-0">{i + 1}</span>
                  <span>{s}</span>
                </li>
              ))}
            </ol>
            <p className="eyebrow mt-4 mb-1.5">expected</p>
            <p className="text-[13px]">{tc.expected}</p>
          </div>
          {hasPayload && (
            <div className="min-w-0">
              <div className="mb-2 flex items-center justify-between">
                <p className="eyebrow">sample payload</p>
                <button type="button" className="flex items-center gap-1 text-[11.5px] text-muted hover:text-fg"
                  onClick={() => navigator.clipboard.writeText(JSON.stringify(tc.samplePayload, null, 2)).then(() => toast.success("Copied!"))}>
                  <FiCopy /> Copy payload
                </button>
              </div>
              <pre className="overflow-x-auto rounded-lg border border-line bg-panel p-3 font-mono text-[11.5px] leading-relaxed">
                {JSON.stringify(tc.samplePayload, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}
    </li>
  );
}

export default function SuiteCase({ feature }: { feature: Feature }) {
  const router = useRouter();

  const [name, setName] = useState(feature.name);
  const [description, setDescription] = useState(feature.description ?? "");
  const [isSavingFeature, setIsSavingFeature] = useState(false);

  const [testSuites, setTestSuites] = useState<TestSuite[]>([]);
  const [selectedSuiteId, setSelectedSuiteId] = useState<string | null>(null);
  const [hasLoaded, setHasLoaded] = useState(false);

  const [filterType, setFilterType] = useState<Filter>("all");
  const [query, setQuery] = useState("");
  const [expandedCaseId, setExpandedCaseId] = useState<string | null>(null);
  const [isDirty, setIsDirty] = useState(false);

  const [genStatus, setGenStatus] = useState<RunStatus>("idle");
  const [genTrace, setGenTrace] = useState<RunTrace | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [reviewStatus, setReviewStatus] = useState<RunStatus>("idle");
  const [reviewTrace, setReviewTrace] = useState<RunTrace | null>(null);
  const [feedback, setFeedback] = useState<FeedbackResult | null>(null);
  const [feedbackError, setFeedbackError] = useState<string | null>(null);
  const [lastReviewedAt, setLastReviewedAt] = useState<string>("");

  const isGenerating = genStatus === "running";
  const isReviewing = reviewStatus === "running";

  const selectedSuite = testSuites.find((s) => s.id === selectedSuiteId) || null;
  const cases = selectedSuite?.testCases ?? [];
  const counts = countByType(cases);
  const filteredCases = cases.filter(
    (tc) =>
      (filterType === "all" || caseType(tc) === filterType) &&
      (!query || `${tc.id} ${tc.title}`.toLowerCase().includes(query.toLowerCase()))
  );
  const score = feedback?.score ?? selectedSuite?.lastFeedbackScore ?? null;
  const isFirstGeneration = !selectedSuite || cases.length === 0;
  const hasChanges = name.trim() !== feature.name || description.trim() !== (feature.description?.trim() || "");

  useEffect(() => {
    const loadSuites = async () => {
      try {
        const res = await fetch(`/api/suites?projectId=${feature.projectId}`, { next: { revalidate: 60 } });
        if (!res.ok) return;
        const all: TestSuite[] = (await res.json()).suites || [];
        const mine = all
          .filter((s) => s.featureName === feature.name)
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setTestSuites(mine);
        if (mine.length > 0) setSelectedSuiteId(mine[0].id);
      } catch (err) {
        console.error(err);
      } finally {
        setHasLoaded(true);
      }
    };
    loadSuites();
  }, [feature.name, feature.projectId]);

  const handleSaveFeature = async () => {
    if (!name.trim()) return void toast.error("Feature name is required.");
    setIsSavingFeature(true);
    try {
      await updateFeature(feature.id, { name: name.trim(), description: description.trim() });
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
          // Closes the loop: the last review steers the next generation prompt.
          lastFeedbackScore: feedback?.score ?? selectedSuite?.lastFeedbackScore ?? null,
          lastFeedbackSummary: feedback?.summary ?? selectedSuite?.lastFeedbackSummary ?? "",
          lastReviewedAt: lastReviewedAt || selectedSuite?.lastReviewedAt || "",
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setGenStatus("error");
        setError(res.status === 429 ? "Rate limited: 10 requests per minute per IP." : data.error || "Failed to generate test cases");
        return;
      }

      const suiteId = data.suiteId as string;
      const createdAt = data.createdAt as string;
      const testCases: TestCase[] = data.testCases || [];

      setTestSuites((prev) => {
        if (prev.some((s) => s.id === suiteId)) {
          return prev.map((s) =>
            s.id === suiteId
              ? { ...s, name: name.trim(), featureName: name.trim(), description: description.trim(), createdAt: createdAt || s.createdAt, testCases }
              : s
          );
        }
        return [
          {
            id: suiteId,
            name: name.trim(),
            featureName: name.trim(),
            description: description.trim(),
            projectId: feature.projectId,
            createdAt: createdAt || new Date().toISOString(),
            testCases,
            lastFeedbackSummary: "",
            lastFeedbackScore: null,
            lastReviewedAt: null,
          },
          ...prev,
        ];
      });

      setGenTrace(data.trace ?? null);
      setGenStatus("done");
      setSelectedSuiteId(suiteId);
      setExpandedCaseId(null);
      setFilterType("all");
      setFeedback(null);
      setReviewStatus("idle");
      setReviewTrace(null);
      setIsDirty(false);
    } catch (err) {
      console.error(err);
      setGenStatus("error");
      setError("Something went wrong.");
    }
  };

  const handleFeedbackReview = async () => {
    if (!selectedSuite || !selectedSuite.testCases.length) return void toast.error("No test cases found for this suite.");
    setFeedbackError(null);
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
          // Sent so the route can persist the score on the suite.
          suiteId: selectedSuite.id,
          projectId: feature.projectId,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setReviewStatus("error");
        setFeedbackError(res.status === 429 ? "Rate limited: 10 requests per minute per IP." : data.error || "Failed to get AI feedback.");
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
      setLastReviewedAt(new Date().toISOString());
      setTestSuites((prev) =>
        prev.map((s) => (s.id === selectedSuite.id ? { ...s, lastFeedbackScore: data.score, lastFeedbackSummary: data.summary } : s))
      );
    } catch (err) {
      console.error(err);
      setReviewStatus("error");
      setFeedbackError("Something went wrong while getting feedback.");
    }
  };

  const handleAcceptSuggested = async (testCase: TestCase, index: number) => {
    if (!selectedSuiteId) return;
    try {
      const res = await fetch("/api/suites/add-cases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ suiteId: selectedSuiteId, testCases: [testCase] }),
      });
      const data = await res.json();
      if (!res.ok) return void toast.error(data.error || "Failed to add test case");
      toast.success("Test case added!");
      setTestSuites((prev) =>
        prev.map((s) => (s.id === selectedSuiteId ? { ...s, testCases: [...(s.testCases || []), testCase] } : s))
      );
      setFeedback((prev) => (prev ? { ...prev, suggestedTestCases: prev.suggestedTestCases.filter((_, i) => i !== index) } : prev));
    } catch (err) {
      console.error(err);
      toast.error("Failed adding test case.");
    }
  };

  const handleRejectSuggested = (index: number) =>
    setFeedback((prev) => (prev ? { ...prev, suggestedTestCases: prev.suggestedTestCases.filter((_, i) => i !== index) } : prev));

  const selectSuite = (id: string) => {
    setSelectedSuiteId(id);
    setExpandedCaseId(null);
    setFilterType("all");
  };

  return (
    <div>
      <nav className="mb-4 flex flex-wrap items-center gap-1 font-mono text-[12px] text-faint" aria-label="Breadcrumb">
        <Link href="/projects" className="hover:text-fg">projects</Link>
        <FiChevronRight />
        <Link href={`/projects/${feature.projectId}`} className="hover:text-fg">{shortId(feature.projectId)}</Link>
        <FiChevronRight />
        <span className="text-muted">{feature.name}</span>
      </nav>

      <header className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="min-w-0">
          <p className="eyebrow">feature suite</p>
          <h1 className="font-display mt-1 text-[32px] font-extrabold leading-tight sm:text-[38px]">{name || "Untitled feature"}</h1>
          <p className="mt-1 font-mono text-[11.5px] text-faint">
            {selectedSuite ? (
              <>suite {shortId(selectedSuite.id)} · {cases.length} cases · {timeAgo(selectedSuite.createdAt)}</>
            ) : (
              "no suite generated yet"
            )}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button className="btn" disabled={!selectedSuite || !cases.length}
            onClick={() => selectedSuite && download(`${slug(selectedSuite.name)}.json`, JSON.stringify(selectedSuite, null, 2), "application/json")}>
            <FiDownload /> Download JSON
          </button>
          <button className="btn" disabled={!selectedSuite || !cases.length}
            onClick={() => selectedSuite && download(`${slug(selectedSuite.name)}.spec.ts`, toPlaywrightSpec(selectedSuite), "text/typescript")}>
            <FiDownload /> Playwright spec
          </button>
        </div>
      </header>

      <div className="grid gap-5 lg:grid-cols-[340px_minmax(0,1fr)]">
        {/* Left: spec + history */}
        <div className="flex flex-col gap-5">
          <section className="panel p-4">
            <p className="eyebrow mb-3">spec</p>
            <div className="flex flex-col gap-3">
              <label className="flex flex-col gap-1.5">
                <span className="text-[12.5px] font-medium text-muted">Feature</span>
                <input type="text" className="field" value={name} onChange={(e) => { setName(e.target.value); setIsDirty(true); }} />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="text-[12.5px] font-medium text-muted">Description</span>
                <textarea className="field min-h-36 resize-y leading-relaxed" value={description}
                  onChange={(e) => { setDescription(e.target.value); setIsDirty(true); }} />
              </label>
            </div>
            <div className="mt-4 flex flex-col gap-2">
              <button className="btn btn-primary w-full" onClick={handleGenerate}
                disabled={(!isFirstGeneration && !isDirty) || isGenerating || !name.trim() || !description.trim()}>
                <FiPlay /> {isGenerating ? "Generating…" : "Generate Test Cases"}
              </button>
              <button className="btn w-full" onClick={handleFeedbackReview} disabled={isReviewing || !selectedSuite || !cases.length}>
                <FiSearch /> {isReviewing ? "Reviewing…" : "Run AI Feedback Review"}
              </button>
              <button className="btn btn-ghost w-full text-muted" onClick={handleSaveFeature}
                disabled={isSavingFeature || !hasChanges || !name.trim()}>
                {isSavingFeature ? "Saving…" : "Save Feature"}
              </button>
              {!isFirstGeneration && !isDirty && (
                <p className="text-center text-[11.5px] text-faint">Edit the spec to regenerate.</p>
              )}
            </div>
            {(error || feedbackError) && (
              <p role="alert" className="mt-3 rounded-lg border border-negative/30 bg-negative/10 px-3 py-2 text-[12.5px] text-negative">
                {error || feedbackError}
              </p>
            )}
          </section>

          <section className="panel p-4">
            <h2 className="eyebrow mb-3">Test Suites</h2>
            {!hasLoaded ? (
              <div className="space-y-2 animate-pulse">
                <div className="h-12 rounded-lg bg-panel-2" />
                <div className="h-12 rounded-lg bg-panel-2" />
              </div>
            ) : testSuites.length === 0 ? (
              <p className="text-[13px] text-muted">No suites yet. Generate test cases.</p>
            ) : (
              <ul className="flex flex-col gap-1.5">
                {testSuites.map((suite) => {
                  const active = suite.id === selectedSuiteId;
                  return (
                    <li key={suite.id}>
                      <button type="button" onClick={() => selectSuite(suite.id)} aria-current={active}
                        className={`w-full rounded-lg border px-3 py-2.5 text-left transition-colors ${
                          active ? "border-fg bg-accent-soft shadow-[2px_2px_0_var(--ink)] dark:border-accent" : "border-line hover:bg-panel-2"
                        }`}>
                        <div className="flex items-center justify-between gap-2">
                          <span className="truncate text-[13px] font-medium">{suite.name}</span>
                          {suite.lastFeedbackScore != null && (
                            <span className="font-mono text-[11px] text-muted">{suite.lastFeedbackScore}/100</span>
                          )}
                        </div>
                        <div className="mt-1.5"><CoverageBar cases={suite.testCases || []} height={4} /></div>
                        <p className="mt-1.5 font-mono text-[10.5px] text-faint">
                          {shortId(suite.id)} · {suite.testCases?.length ?? 0} cases · {timeAgo(suite.createdAt)}
                        </p>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </div>

        {/* Right: pipeline, coverage, review, cases */}
        <div className="flex min-w-0 flex-col gap-5">
          <section className="panel p-4">
            <div className="mb-3 flex items-center justify-between">
              <p className="eyebrow">pipeline runs</p>
              <Link href="/architecture" className="text-[12px] text-muted hover:text-accent">how this works →</Link>
            </div>
            <div className="flex flex-col gap-3">
              <PipelineTrace workflow="generation" status={genStatus} trace={genTrace} />
              <PipelineTrace workflow="review" status={reviewStatus} trace={reviewTrace} />
            </div>
          </section>

          <section className="panel p-4">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <div className="flex-1 min-w-0">
                <div className="mb-2 flex items-center gap-2">
                  <p className="eyebrow">coverage</p>
                  {feedback && (
                    <span className="inline-flex items-center gap-1 rounded-full border border-accent/40 bg-accent-soft px-2 py-px text-[10.5px] font-medium text-accent">
                      <FiCheck /> AI Reviewed
                    </span>
                  )}
                </div>
                <CoverageBar cases={cases} height={8} legend />
                {lastReviewedAt && <p className="mt-2 font-mono text-[10.5px] text-faint">reviewed {timeAgo(lastReviewedAt)}</p>}
              </div>
              <div className="flex items-center gap-3 sm:border-l sm:border-line sm:pl-5">
                {score != null ? (
                  <>
                    <ScoreRing score={score} />
                    <div>
                      <p className="text-[12.5px] font-medium">AI Coverage Score</p>
                      <p className="text-[11.5px] text-muted">{score >= 85 ? "Strong" : score >= 60 ? "Moderate: gaps in edge or negative paths" : "Weak: significant gaps"}</p>
                    </div>
                  </>
                ) : (
                  <p className="max-w-[180px] text-[12px] text-faint">Run a review to score this suite&apos;s coverage.</p>
                )}
              </div>
            </div>

            {feedback && (
              <div className="mt-5 grid gap-5 border-t border-line pt-5 md:grid-cols-2">
                <div>
                  <p className="eyebrow mb-2">summary</p>
                  <p className="text-[13px] leading-relaxed">{feedback.summary}</p>
                  {feedback.missingAreas.length > 0 && (
                    <>
                      <p className="eyebrow mt-4 mb-2">missing / weak areas</p>
                      <div className="flex flex-wrap gap-1.5">
                        {feedback.missingAreas.map((item, i) => (
                          <span key={i} className="rounded-md border border-negative/30 bg-negative/10 px-2 py-0.5 text-[12px] text-negative">{item}</span>
                        ))}
                      </div>
                    </>
                  )}
                </div>
                {feedback.suggestions.length > 0 && (
                  <div>
                    <p className="eyebrow mb-2">suggestions</p>
                    <ul className="space-y-1.5 text-[13px]">
                      {feedback.suggestions.map((s, i) => (
                        <li key={i} className="flex gap-2"><FiCheck className="mt-1 shrink-0 text-accent" />{s}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {feedback && feedback.suggestedTestCases.length > 0 && (
              <div className="mt-5 border-t border-line pt-5">
                <p className="eyebrow mb-3">AI suggested test cases · {feedback.suggestedTestCases.length}</p>
                <ul className="grid gap-3 md:grid-cols-2">
                  {feedback.suggestedTestCases.map((tc, idx) => (
                    <li key={`${tc.id}-${idx}`} className="animate-pop flex flex-col rounded-xl border-[1.5px] border-dashed border-accent bg-accent-soft p-3">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[13px] font-medium">{tc.title}</span>
                        <TypePill type={caseType(tc)} />
                      </div>
                      <ol className="mt-2 list-decimal space-y-0.5 pl-4 text-[12px] text-muted">
                        {tc.steps.map((s, i) => <li key={i}>{s}</li>)}
                      </ol>
                      <p className="mt-2 text-[12px]"><span className="text-faint">Expected: </span>{tc.expected}</p>
                      <div className="mt-3 flex gap-2 pt-1">
                        <button className="btn btn-primary h-8 text-[12px]" onClick={() => handleAcceptSuggested(tc, idx)}><FiCheck /> Accept</button>
                        <button className="btn h-8 text-[12px]" onClick={() => handleRejectSuggested(idx)} aria-label="Reject"><FiX /></button>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </section>

          <section className="panel overflow-hidden">
            <div className="flex flex-col gap-3 border-b border-line p-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-wrap gap-1" role="tablist" aria-label="Filter by type">
                {(["all", ...CASE_TYPES] as Filter[]).map((t) => (
                  <button key={t} role="tab" aria-selected={filterType === t} onClick={() => setFilterType(t)}
                    className={`rounded-lg px-2.5 py-1 text-[12.5px] capitalize transition-colors ${
                      filterType === t ? "bg-panel-2 text-fg font-medium" : "text-muted hover:text-fg"
                    }`}>
                    {t} <span className="font-mono text-[11px] text-faint">{t === "all" ? cases.length : counts[t]}</span>
                  </button>
                ))}
              </div>
              <input type="search" placeholder="Filter by id or title" value={query} onChange={(e) => setQuery(e.target.value)}
                className="field h-8 py-0 text-[12.5px] sm:w-56" />
            </div>

            {!hasLoaded ? (
              <div className="space-y-px animate-pulse">
                {Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-11 bg-panel-2/60" />)}
              </div>
            ) : !selectedSuite ? (
              <p className="px-4 py-12 text-center text-[13px] text-muted">Write a spec and generate the first suite.</p>
            ) : filteredCases.length === 0 ? (
              <p className="px-4 py-12 text-center text-[13px] text-muted">
                {cases.length ? `No ${filterType === "all" ? "" : filterType + " "}cases match.` : "This suite is empty. Generate test cases."}
              </p>
            ) : (
              <ul className="divide-y divide-line">
                {filteredCases.map((tc, i) => (
                  <CaseRow key={tc.id} tc={tc} index={i} expanded={expandedCaseId === tc.id}
                    onToggle={() => setExpandedCaseId(expandedCaseId === tc.id ? null : tc.id)} />
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
