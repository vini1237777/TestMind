import Link from "next/link";
import type { Project } from "../types/testmind";
import TypeBar from "./TypeBar";
import ProjectTile from "./ProjectTile";
import { timeAgo } from "../lib/format";

export default function ProjectCard({ project, index }: { project: Project; index: number }) {
  const s = project.stats;
  const empty = !s || s.suites === 0;

  return (
    <Link
      href={`/projects/${project.id}`}
      className="tm-rise group flex flex-col rounded-lg border border-gray-200 bg-white p-4 text-sm transition-all duration-200 hover:-translate-x-0.5 hover:-translate-y-0.5 hover:border-black hover:shadow-[4px_4px_0_0_#fcd34d] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-amber-400 dark:hover:shadow-[4px_4px_0_0_rgba(251,191,36,0.35)]"
      style={{ animationDelay: `${Math.min(index, 12) * 45}ms` }}
    >
      <div className="flex items-start gap-3">
        <ProjectTile name={project.name} />
        <div className="min-w-0 flex-1">
          <h2 className="truncate font-semibold">{project.name}</h2>
          <p className="text-[11px] text-gray-400">
            {s?.lastActivity ? `Active ${timeAgo(s.lastActivity)}` : `Created ${timeAgo(project.createdAt)}`}
          </p>
        </div>
        {!empty &&
          (s!.avgScore === null ? (
            <span className="shrink-0 text-[11px] text-gray-400" title="No suite in this project has been reviewed yet">
              Not reviewed
            </span>
          ) : (
            <span className="shrink-0 text-right tabular-nums" title="Average review score">
              <span className="text-lg font-bold leading-none">{s!.avgScore}</span>
              <span className="text-[11px] text-gray-400">/100</span>
            </span>
          ))}
      </div>

      <p className="mt-3 line-clamp-2 min-h-[2.5em] text-xs text-gray-500 dark:text-gray-400">{project.description || "No description."}</p>

      <div className="mt-auto pt-4">
        {empty ? (
          <p className="flex items-center justify-between rounded border border-dashed border-gray-300 px-3 py-2 text-[11px] text-gray-500 dark:border-gray-700">
            No test suites yet
            <span className="text-amber-700 group-hover:underline dark:text-amber-400">Add one →</span>
          </p>
        ) : (
          <>
            <TypeBar counts={s!} />
            <div className="mt-2 flex items-center justify-between text-[11px] text-gray-500">
              <span>
                <b className="text-gray-900 dark:text-white">{s!.suites}</b> {s!.suites === 1 ? "suite" : "suites"},{" "}
                <b className="text-gray-900 dark:text-white">{s!.cases}</b> cases
              </span>
              <span className="translate-x-[-4px] text-amber-700 opacity-0 transition-all duration-200 group-hover:translate-x-0 group-hover:opacity-100 dark:text-amber-400">
                Open →
              </span>
            </div>
          </>
        )}
      </div>
    </Link>
  );
}
