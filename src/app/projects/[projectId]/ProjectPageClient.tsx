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

  const scoreTone = (n: number) =>
    n >= 80 ? "border-green-200 bg-green-50 text-green-700" : n >= 60 ? "border-amber-200 bg-amber-50 text-amber-700" : "border-red-200 bg-red-50 text-red-700";

  return (
    <>
      <Breadcrumbs items={[{ label: "Projects", href: "/projects" }, { label: project.name || "Project" }]} />
      <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">{project.name}</h1>
          <p className="text-sm text-gray-500 max-w-xl">
            {project.description}
          </p>
        </div>
        <button
          className="tm-press shrink-0 rounded bg-amber-500 px-3 py-2 text-xs font-medium text-white shadow-sm hover:bg-amber-600 dark:bg-gray-200 dark:text-black"
          onClick={() => setOpenFeatureModal(true)}
        >
          + New Feature
        </button>
      </header>

      {localSuites.length > 0 && (
        <dl className="tm-fade mb-6 grid grid-cols-3 gap-px overflow-hidden rounded-lg border border-gray-200 bg-gray-200 dark:border-gray-700 dark:bg-gray-700 sm:max-w-xl">
          {[
            ["Suites", localSuites.length],
            ["Test cases", totalCases],
            ["Avg review score", avgScore ?? "not reviewed"],
          ].map(([label, value]) => (
            <div key={label} className="bg-amber-50 px-4 py-3 dark:bg-gray-900">
              <dt className="text-[11px] uppercase tracking-wide text-gray-500">{label}</dt>
              <dd className={`font-semibold ${typeof value === "number" ? "text-xl" : "text-xs leading-7 text-gray-400"}`}>{value}</dd>
            </div>
          ))}
        </dl>
      )}

      {localSuites?.length === 0 ? (
        <div className="tm-rise rounded-lg border border-dashed p-10 text-center">
          <h2 className="font-semibold">No test suites yet</h2>
          <p className="mx-auto mt-1 max-w-sm text-sm text-gray-500">
            Add a feature with a short description of what it should do. TestMind writes the first suite and you can review it from there.
          </p>
          <button
            onClick={() => setOpenFeatureModal(true)}
            className="tm-press mt-4 rounded bg-amber-500 px-4 py-2 text-xs font-medium text-white hover:bg-amber-600"
          >
            Add the first feature
          </button>
        </div>
      ) : (
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {localSuites.map((suite, i) => (
            <Link
              key={suite.id}
              href={`/projects/${project.id}/suites/${suite.id}`}
              className="tm-rise group flex flex-col rounded-lg border border-gray-200 bg-white p-4 text-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-amber-400 hover:shadow-[0_12px_30px_-12px_rgba(217,119,6,0.35)] dark:border-gray-700 dark:bg-gray-900 dark:hover:border-amber-500"
              style={{ animationDelay: `${Math.min(i, 12) * 50}ms` }}
            >
              <div className="mb-1 flex items-start justify-between gap-2">
                <h2 className="font-semibold">{suite.featureName}</h2>
                {typeof suite.lastFeedbackScore === "number" && (
                  <span title="Last AI review score" className={`shrink-0 rounded-full border px-2 py-0.5 text-[11px] font-semibold ${scoreTone(suite.lastFeedbackScore)}`}>
                    {suite.lastFeedbackScore}/100
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-500 mb-3 line-clamp-2">
                {suite.description}
              </p>
              <div className="mt-auto">
              <TypeBar cases={suite.testCases ?? []} />
              </div>
              <div className="mt-2 flex items-center justify-between text-[11px] text-gray-400">
                <span>
                  <b className="text-gray-900 dark:text-white">{suite.testCases?.length ?? 0}</b> cases, {timeAgo(suite.lastReviewedAt || suite.createdAt)}
                </span>
                <span className="text-amber-700 opacity-0 transition-opacity group-hover:opacity-100 dark:text-amber-400">Open →</span>
              </div>
            </Link>
          ))}
        </section>
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
