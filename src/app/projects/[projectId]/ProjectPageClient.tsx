"use client";

import { useState } from "react";
import Link from "next/link";
import type { Project, TestSuite } from "@/src/app/types/testmind";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import FeatureModal from "@/src/app/components/FeatureModal";
import ProjectModal from "@/src/app/components/ProjectModal";
import ConfirmDelete from "@/src/app/components/ConfirmDelete";
import { deleteProject } from "@/src/app/actions/projects";
import { deleteFeature } from "@/src/app/actions/suites";
import CardActions from "@/src/app/components/CardActions";
import FeatureEditModal from "@/src/app/components/FeatureEditModal";
import { EXAMPLE } from "@/src/app/lib/example";
import Breadcrumbs from "@/src/app/components/Breadcrumbs";
import TypeBar from "@/src/app/components/TypeBar";
import { timeAgo } from "@/src/app/lib/format";

export default function ProjectPageClient({
  project: initialProject,
  suites,
}: {
  project: Project;
  suites: TestSuite[];
}) {
  const router = useRouter();
  const [project, setProject] = useState<Project>(initialProject);
  const [openFeatureModal, setOpenFeatureModal] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [openDelete, setOpenDelete] = useState(false);
  // The shared example opens from the home page, so it stays as it is.
  const canManage = project.name !== EXAMPLE.project;

  const handleDelete = async () => {
    try {
      const result = await deleteProject(project.id);
      if ("error" in result) {
        toast.error(result.error);
        return;
      }
      toast.success("Project deleted");
      router.push("/projects");
      router.refresh();
    } catch {
      toast.error("Could not delete the project. Please try again.");
    }
  };
  const [localSuites, setLocalSuites] = useState<TestSuite[]>(suites);
  const [editingFeature, setEditingFeature] = useState<TestSuite | null>(null);
  const [deletingFeature, setDeletingFeature] = useState<TestSuite | null>(null);
  const sameFeature = (a: TestSuite, b: TestSuite) => a.featureName.toLowerCase() === b.featureName.toLowerCase();

  const handleDeleteFeature = async () => {
    const target = deletingFeature;
    if (!target) return;
    try {
      const result = await deleteFeature(target.id);
      if ("error" in result) {
        toast.error(result.error);
        return;
      }
      // Every saved version of the feature goes with it.
      setLocalSuites((prev) => prev.filter((s) => !sameFeature(s, target)));
      setDeletingFeature(null);
      toast.success("Feature deleted");
      router.refresh();
    } catch {
      toast.error("Could not delete the feature. Please try again.");
    }
  };

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
        <div className="flex shrink-0 items-center gap-2">
          {canManage && (
            <>
              <button
                className="rounded border px-3 py-2 text-xs font-medium hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800"
                onClick={() => setOpenEdit(true)}
              >
                Edit project
              </button>
              <button
                className="rounded border border-red-200 px-3 py-2 text-xs font-medium text-red-700 hover:bg-red-50 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-950"
                onClick={() => setOpenDelete(true)}
              >
                Delete project
              </button>
            </>
          )}
          <button
            className="tm-press shrink-0 rounded bg-amber-500 px-3 py-2 text-xs font-medium text-white shadow-sm hover:bg-amber-600 dark:bg-amber-400 dark:text-black dark:hover:bg-amber-300"
            onClick={() => setOpenFeatureModal(true)}
          >
            + New Feature
          </button>
        </div>
      </header>

      <ProjectModal
        open={openEdit}
        onClose={() => setOpenEdit(false)}
        project={project}
        onSaved={(saved) => {
          setProject(saved);
          router.refresh();
        }}
      />

      <ConfirmDelete
        open={openDelete}
        onClose={() => setOpenDelete(false)}
        title="Delete project"
        actionLabel="Delete project"
        confirmText={project.name}
        onConfirm={handleDelete}
      >
        <p>
          This deletes <span className="font-semibold">{project.name}</span>
          {localSuites.length > 0
            ? `, its ${localSuites.length} ${localSuites.length === 1 ? "feature" : "features"} and ${totalCases} test cases`
            : ""}
          . It cannot be undone.
        </p>
      </ConfirmDelete>


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
          <div className={`hidden grid-cols-[minmax(0,1fr)_160px_80px_90px_120px] gap-4 bg-amber-300 py-2 pl-4 text-xs font-semibold text-black md:grid ${canManage ? "pr-[84px]" : "pr-4"}`}>
            <span>Feature</span>
            <span>Case mix</span>
            <span className="text-right">Cases</span>
            <span className="text-right">Score</span>
            <span className="text-right">Updated</span>
          </div>
          <ul className="divide-y dark:divide-slate-800">
            {localSuites.map((suite, i) => (
              <li
                key={suite.id}
                className="tm-rise group flex items-center transition-colors hover:bg-amber-50 dark:hover:bg-slate-900"
                style={{ animationDelay: `${Math.min(i, 12) * 30}ms` }}
              >
                <Link
                  href={`/projects/${project.id}/suites/${suite.id}`}
                  className="grid min-w-0 flex-1 grid-cols-1 gap-1 px-4 py-3 text-sm md:grid-cols-[minmax(0,1fr)_160px_80px_90px_120px] md:items-center md:gap-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-amber-500"
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
                {canManage && (
                  <CardActions
                    label={suite.featureName}
                    onEdit={() => setEditingFeature(suite)}
                    onDelete={() => setDeletingFeature(suite)}
                    className="shrink-0 pr-3"
                  />
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      <FeatureEditModal
        feature={editingFeature}
        onClose={() => setEditingFeature(null)}
        onSaved={({ name, description }) => {
          const target = editingFeature!;
          setLocalSuites((prev) =>
            prev.map((s) =>
              sameFeature(s, target)
                ? { ...s, name, featureName: name, description: s.id === target.id ? description : s.description }
                : s,
            ),
          );
          router.refresh();
        }}
      />

      <ConfirmDelete
        open={Boolean(deletingFeature)}
        onClose={() => setDeletingFeature(null)}
        title="Delete feature"
        actionLabel="Delete feature"
        onConfirm={handleDeleteFeature}
      >
        <p>
          This deletes <span className="font-semibold">{deletingFeature?.featureName}</span> and its{" "}
          {deletingFeature
            ? localSuites.filter((s) => sameFeature(s, deletingFeature)).reduce((n, s) => n + (s.testCases?.length ?? 0), 0)
            : 0}{" "}
          test cases. It cannot be undone.
        </p>
      </ConfirmDelete>

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
