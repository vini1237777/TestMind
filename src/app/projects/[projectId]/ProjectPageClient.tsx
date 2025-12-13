"use client";

import { useState } from "react";
import Link from "next/link";
import type { Project, TestSuite } from "@/src/app/types/testmind";
import FeatureModal from "@/src/app/components/FeatureModal";
import { useRouter } from "next/navigation";

export default function ProjectPageClient({
  project,
  suites,
}: {
  project: Project;
  suites: TestSuite[];
}) {
  const router = useRouter();
  const [openFeatureModal, setOpenFeatureModal] = useState(false);
  const [localSuites, setLocalSuites] = useState<TestSuite[]>(suites);

  const handleBack = () => {
    router.push(`/projects`);
  };

  return (
    <>
      <button onClick={handleBack} className="text-sm mb-4 cursor-pointer">
        ← Back to Project
      </button>
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{project.name}</h1>
          <p className="text-sm text-gray-500 max-w-xl">
            {project.description}
          </p>
        </div>
        <button
          className="text-xs px-3 py-2 rounded bg-amber-500 text-white hover:bg-amber-300"
          onClick={() => setOpenFeatureModal(true)}
        >
          + New Feature / Test Suite
        </button>
      </header>

      {localSuites?.length === 0 ? (
        <p className="text-sm text-gray-500">
          No test suites yet for this project.
        </p>
      ) : (
        <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {localSuites.map((suite) => (
            <article
              key={suite.id}
              className="border rounded p-4 shadow-sm text-sm hover:shadow-2xl dark:hover:shadow-md dark:hover:shadow-white"
            >
              <h2 className="font-semibold mb-1">{suite.featureName}</h2>
              <p className="text-xs text-gray-500 mb-2 line-clamp-2">
                {suite.description}
              </p>
              <p className="text-[11px] text-gray-400 mb-2">
                Created: {new Date(suite.createdAt).toLocaleString()}
              </p>
              <Link
                href={`/projects/${project.id}/suites/${suite.id}`}
                className="text-xs underline text-amber-700 dark:hover:text-amber-400"
              >
                View test cases
              </Link>
            </article>
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
