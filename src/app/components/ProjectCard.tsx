import Link from "next/link";
import type { Project } from "../types/testmind";
import ProjectTile from "./ProjectTile";
import { timeAgo } from "../lib/format";

/** A project at a glance: name, what it is, and one line of numbers. Details live inside. */
export default function ProjectCard({ project, index }: { project: Project; index: number }) {
  const s = project.stats;
  const empty = !s || s.suites === 0;

  return (
    <Link
      href={`/projects/${project.id}`}
      className="tm-rise group flex flex-col rounded-lg border border-gray-200 bg-white p-4 text-sm transition-all duration-200 hover:-translate-x-0.5 hover:-translate-y-0.5 hover:border-black hover:shadow-[4px_4px_0_0_#fcd34d] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-amber-400 dark:hover:shadow-[4px_4px_0_0_rgba(251,191,36,0.35)]"
      style={{ animationDelay: `${Math.min(index, 12) * 45}ms` }}
    >
      <div className="flex items-center gap-3">
        <ProjectTile name={project.name} />
        <div className="min-w-0">
          <h2 className="truncate font-semibold">{project.name}</h2>
          <p className="text-xs text-gray-500">{timeAgo(s?.lastActivity || project.createdAt)}</p>
        </div>
      </div>

      {project.description && <p className="mt-3 line-clamp-2 text-gray-600 dark:text-gray-400">{project.description}</p>}

      <p className="mt-auto flex items-baseline justify-between pt-4 text-xs text-gray-500">
        {empty ? (
          <span>No features yet</span>
        ) : (
          <span>
            {(() => {
              const f = s!.features ?? s!.suites;
              return `${f} ${f === 1 ? "feature" : "features"}, ${s!.cases} cases`;
            })()}
          </span>
        )}
        {!empty && s!.avgScore !== null && (
          <span title="Average review score" className="tabular-nums">
            <span className="text-sm font-bold text-gray-900 dark:text-white">{s!.avgScore}</span>/100
          </span>
        )}
      </p>
    </Link>
  );
}
