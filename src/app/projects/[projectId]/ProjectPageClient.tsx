"use client";

import { useState } from "react";
import Link from "next/link";
import type { Project, TestSuite } from "@/src/app/types/testmind";
import FeatureModal from "@/src/app/components/FeatureModal";
import Breadcrumbs from "@/src/app/components/Breadcrumbs";
import TypeBar from "@/src/app/components/TypeBar";
import { timeAgo } from "@/src/app/lib/format";

export default function ProjectPageClient({
  project,
  suites,
}: {
  project: Project;
  suites: TestSuite[];
}) {
  const [openFeatureModal, setOpenFeatureModal] = useState(false);
  const [localSuites, setLocalSuites] = useState<TestSuite[]>(suites);

  const totalCases = localSuites.reduce((n, s) => n + (s.testCases?.length ?? 0), 0);
  const scored = localSuites.filter((s) => typeof s.lastFeedbackScore === "number");
  const avgScore = scored.length
    ? Math.round(scored.reduce((n, s) => n + (s.lastFeedbackScore as number), 0) / scored.length)
    : null;

  return (
    <>
      <Breadcrumbs items={[{ label: "Projects", href: "/projects" }, { label: project.name || "Project" }]} />
      <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">{project.name}</h1>
          <p className="max-w-xl text-sm text-gray-500">
            {project.description}
            {localSuites.length > 0 && (
              <span className="block text-xs text-gray-400">
                {localSuites.length} {localSuites.length === 1 ? "feature" : "features"}, {totalCases} test cases{avgScore !== null ? `, average score ${avgScore}/100` : ""}
              </span>
            )}
          </p>
        </div>
        <button
          className="tm-press shrink-0 rounded bg-amber-500 px-3 py-2 text-xs font-medium text-white shadow-sm hover:bg-amber-600 dark:bg-amber-400 dark:text-black dark:hover:bg-amber-300"
          onClick={() => setOpenFeatureModal(true)}
        >
          + New Feature
        </button>
      </header>


      {localSuites?.length === 0 ? (
        <div className="tm-rise rounded-lg border border-dashed p-10 text-center">
          <h2 className="font-semibold">No test suites yet</h2>
          <p className="mx-auto mt-1 max-w-sm text-sm text-gray-500">
            Add a feature with a short description of what it should do. TestMind writes the first suite and you can review it from there.
          </p>
          <button
            onClick={() => setOpenFeatureModal(true)}
            className="tm-press mt-4 rounded bg-amber-500 px-4 py-2 text-xs font-medium text-white hover:bg-amber-600 dark:bg-amber-400 dark:text-black dark:hover:bg-amber-300"
          >
            Add the first feature
          </button>
        </div>
      ) : (
        <div className="border border-amber-300 dark:border-amber-500/40">
          <div className="hidden grid-cols-[minmax(0,1fr)_160px_80px_90px_120px] gap-4 bg-amber-300 px-4 py-2 text-xs font-semibold text-black md:grid">
            <span>Feature</span>
            <span>Case mix</span>
            <span className="text-right">Cases</span>
            <span className="text-right">Score</span>
            <span className="text-right">Updated</span>
          </div>
          <ul className="divide-y dark:divide-slate-800">
            {localSuites.map((suite, i) => (
              <li key={suite.id} className="tm-rise" style={{ animationDelay: `${Math.min(i, 12) * 30}ms` }}>
                <Link
                  href={`/projects/${project.id}/suites/${suite.id}`}
                  className="grid grid-cols-1 gap-1 px-4 py-3 text-sm transition-colors hover:bg-amber-50 md:grid-cols-[minmax(0,1fr)_160px_80px_90px_120px] md:items-center md:gap-4 dark:hover:bg-slate-900"
                >
                  <span className="min-w-0">
                    <span className="block truncate font-medium">{suite.featureName}</span>
                    <span className="block truncate text-xs text-gray-500">{suite.description || "No description"}</span>
                  </span>
                  <span className="hidden md:block">{suite.testCases?.length ? <TypeBar cases={suite.testCases} /> : <span className="text-xs text-gray-400">Not generated</span>}</span>
                  <span className="hidden text-right tabular-nums md:block">{suite.testCases?.length ?? 0}</span>
                  <span className={`hidden text-right tabular-nums md:block ${typeof suite.lastFeedbackScore === "number" ? "" : "text-gray-400"}`}>
                    {typeof suite.lastFeedbackScore === "number" ? `${suite.lastFeedbackScore}/100` : "None"}
                  </span>
                  <span className="hidden text-right text-gray-500 md:block">{timeAgo(suite.lastReviewedAt || suite.createdAt)}</span>
                  <span className="text-xs text-gray-500 md:hidden">
                    {suite.testCases?.length ?? 0} cases{typeof suite.lastFeedbackScore === "number" ? `, score ${suite.lastFeedbackScore}/100` : ""}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      <FeatureModal
        projectId={project.id}
        open={openFeatureModal}
        onClose={() => setOpenFeatureModal(false)}
        lastFeedbackSummary={localSuites[0]?.lastFeedbackSummary || ""}
        lastFeedbackScore={localSuites[0]?.lastFeedbackScore || null}
        lastReviewedAt={localSuites[0]?.lastReviewedAt || null}
        onCreated={(newSuite) => {
          setLocalSuites((prev) =>
            prev.some((s) => s.id === newSuite.id) ? prev : [newSuite, ...prev]
          );
        }}
      />
    </>
  );
}
