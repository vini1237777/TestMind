"use client";

import { useState } from "react";
import Link from "next/link";
import { FiChevronRight, FiPlus } from "react-icons/fi";
import type { Project, TestSuite } from "@/src/app/types/testmind";
import FeatureModal from "@/src/app/components/FeatureModal";
import { CoverageBar, scoreTone, shortId, timeAgo } from "@/src/app/components/ui";

export default function ProjectPageClient({ project, suites }: { project: Project; suites: TestSuite[] }) {
  const [openFeatureModal, setOpenFeatureModal] = useState(false);
  const [localSuites, setLocalSuites] = useState<TestSuite[]>(suites);

  const totalCases = localSuites.reduce((n, s) => n + (s.testCases?.length ?? 0), 0);
  const reviewed = localSuites.filter((s) => s.lastFeedbackScore != null);
  const avgScore = reviewed.length
    ? Math.round(reviewed.reduce((n, s) => n + (s.lastFeedbackScore ?? 0), 0) / reviewed.length)
    : null;

  return (
    <>
      <nav className="mb-4 flex items-center gap-1 font-mono text-[12px] text-faint" aria-label="Breadcrumb">
        <Link href="/projects" className="hover:text-fg">projects</Link>
        <FiChevronRight />
        <span className="text-muted">{shortId(project.id)}</span>
      </nav>

      <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <h1 className="font-display text-[32px] font-extrabold leading-tight sm:text-[38px]">{project.name}</h1>
          {project.description && <p className="mt-1 max-w-xl text-[14px] text-muted">{project.description}</p>}
        </div>
        <button className="btn btn-primary self-start sm:self-auto" onClick={() => setOpenFeatureModal(true)}>
          <FiPlus /> New feature / test suite
        </button>
      </header>

      <dl className="panel mb-7 grid grid-cols-3 divide-x divide-line overflow-hidden">
        {[
          { k: "suites", v: localSuites.length },
          { k: "test cases", v: totalCases },
          { k: "avg coverage score", v: avgScore ?? "n/a" },
        ].map((m) => (
          <div key={m.k} className="bg-panel px-4 py-3">
            <dt className="eyebrow">{m.k}</dt>
            <dd className="font-display mt-1 text-[26px] font-extrabold">{m.v}</dd>
          </div>
        ))}
      </dl>

      {localSuites.length === 0 ? (
        <div className="panel px-6 py-14 text-center">
          <p className="font-medium">No test suites yet for this project.</p>
          <p className="mt-1 text-[13px] text-muted">Add a feature spec, then generate its suite.</p>
        </div>
      ) : (
        <section className="panel divide-y divide-line overflow-hidden">
          <div className="hidden md:grid grid-cols-[1fr_200px_100px_120px] gap-4 px-4 py-2.5 eyebrow">
            <span>feature</span><span>coverage mix</span><span>score</span><span className="text-right">updated</span>
          </div>
          {localSuites.map((suite, i) => {
            const n = suite.testCases?.length ?? 0;
            return (
              <article key={suite.id} className="animate-rise grid gap-3 px-4 py-4 transition-colors md:grid-cols-[1fr_200px_100px_120px] md:items-center md:gap-4 hover:bg-accent-soft" style={{ animationDelay: `${Math.min(i, 10) * 45}ms` }}>
                <div className="min-w-0">
                  <h2 className="font-medium">{suite.featureName}</h2>
                  <p className="mt-0.5 line-clamp-1 text-[13px] text-muted">{suite.description || "No spec yet"}</p>
                  <Link href={`/projects/${project.id}/suites/${suite.id}`}
                    className="mt-1.5 inline-flex items-center gap-1 text-[12.5px] font-medium text-accent hover:underline">
                    View test cases
                  </Link>
                </div>
                <div>
                  {n ? <CoverageBar cases={suite.testCases} /> : <div className="h-1.5 rounded-full bg-panel-2" />}
                  <p className="mt-1.5 font-mono text-[11px] text-faint">{n ? `${n} cases` : "not generated"}</p>
                </div>
                <p className="font-mono text-[13px]" style={{ color: suite.lastFeedbackScore != null ? scoreTone(suite.lastFeedbackScore) : undefined }}>
                  {suite.lastFeedbackScore ?? <span className="text-faint">not reviewed</span>}
                </p>
                <p className="font-mono text-[11px] text-faint md:text-right" title={new Date(suite.createdAt).toLocaleString()}>
                  {timeAgo(suite.createdAt)}
                </p>
              </article>
            );
          })}
        </section>
      )}

      <FeatureModal
        projectId={project.id}
        open={openFeatureModal}
        onClose={() => setOpenFeatureModal(false)}
        lastFeedbackSummary={localSuites[0]?.lastFeedbackSummary || ""}
        lastFeedbackScore={localSuites[0]?.lastFeedbackScore || null}
        lastReviewedAt={localSuites[0]?.lastReviewedAt || null}
        onCreated={(newSuite) =>
          setLocalSuites((prev) => (prev.some((s) => s.id === newSuite.id) ? prev : [newSuite, ...prev]))
        }
      />
    </>
  );
}
