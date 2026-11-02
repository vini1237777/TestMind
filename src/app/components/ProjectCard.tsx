import Link from "next/link";
import type { Project } from "../types/testmind";
import ScoreRing from "./ScoreRing";
import TypeBar from "./TypeBar";
import { initials, pick, timeAgo } from "../lib/format";

// Warm tiles that sit with the amber theme
const TILES = [
  "bg-amber-100 text-amber-800",
  "bg-orange-100 text-orange-800",
  "bg-yellow-100 text-yellow-800",
  "bg-rose-100 text-rose-800",
  "bg-lime-100 text-lime-800",
  "bg-stone-200 text-stone-800",
] as const;

export default function ProjectCard({ project, index }: { project: Project; index: number }) {
  const s = project.stats;
  const empty = !s || s.suites === 0;

  return (
    <Link
      href={`/projects/${project.id}`}
      className="tm-rise group flex flex-col rounded-lg border border-gray-200 bg-white p-4 text-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-amber-400 hover:shadow-[0_12px_30px_-12px_rgba(217,119,6,0.35)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 dark:border-gray-700 dark:bg-gray-900 dark:hover:border-amber-500"
      style={{ animationDelay: `${Math.min(index, 12) * 45}ms` }}
    >
      <div className="flex items-start gap-3">
        <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-lg text-sm font-bold ${pick(project.id || project.name, TILES)}`} aria-hidden>
          {initials(project.name)}
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="truncate font-semibold">{project.name}</h2>
          <p className="text-[11px] text-gray-400">
            {s?.lastActivity ? `Active ${timeAgo(s.lastActivity)}` : `Created ${timeAgo(project.createdAt)}`}
          </p>
        </div>
        {!empty && <ScoreRing score={s!.avgScore} size={40} />}
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
