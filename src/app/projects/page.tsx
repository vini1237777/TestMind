"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { FiArrowUpRight, FiPlus } from "react-icons/fi";
import { Project } from "../types/testmind";
import ProjectModal from "../components/ProjectModal";
import CardSkeleton from "../components/CardSkeleton";
import FailedTest from "../components/FailedTest";
import { Page } from "../components/shell/AppShell";
import { shortId, timeAgo } from "../components/ui";

type LoadError = { status: number; message: string } | null;

export default function ProjectsPage() {
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [loadError, setLoadError] = useState<LoadError>(null);
  const [attempt, setAttempt] = useState(0);

  const retry = useCallback(() => {
    setHasLoaded(false);
    setLoadError(null);
    setAttempt((a) => a + 1);
  }, []);

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const res = await fetch("/api/projects", { cache: "no-store" });
        if (!isMounted) return;
        if (!res.ok) {
          setLoadError({
            status: res.status,
            message: res.status === 429 ? "429 Too Many Requests (limit is 10 per minute)" : `${res.status} from /api/projects`,
          });
          return;
        }
        const data = await res.json();
        if (isMounted) setProjects(data.projects || []);
      } catch (error) {
        console.error(error);
        if (isMounted) setLoadError({ status: 0, message: "Network error reaching /api/projects" });
      } finally {
        if (isMounted) setHasLoaded(true);
      }
    })();
    return () => {
      isMounted = false;
    };
  }, [attempt]);

  return (
    <Page>
      <header className="mb-7 flex items-end justify-between gap-4">
        <div>
          <p className="eyebrow">workspace</p>
          <h1 className="font-display mt-1 text-[34px] font-extrabold leading-none">Projects</h1>
          <p className="mt-2 text-[14px] text-muted">
            {!hasLoaded ? "Loading" : loadError ? "Could not load projects" : `${projects.length} project${projects.length === 1 ? "" : "s"}. Open one to see its suites.`}
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => setIsProjectModalOpen(true)}>
          <FiPlus /> New project
        </button>
      </header>

      {!hasLoaded ? (
        <CardSkeleton />
      ) : loadError ? (
        <FailedTest
          compact
          code={loadError.status === 429 ? "TC_429" : "TC_503"}
          title="Projects should load"
          expected="200 OK with a list of projects"
          received={loadError.message}
          hint={
            loadError.status === 429
              ? "You hit the rate limiter. It protects the AI budget and resets within a minute."
              : "The database or cache did not answer. The rest of the app still works, so try again or read how it is built."
          }
          onRetry={retry}
        />
      ) : projects.length === 0 ? (
        <div className="panel grid place-items-center px-6 py-16 text-center">
          <p className="font-display text-[22px] font-extrabold">No projects yet</p>
          <p className="mt-1 text-[14px] text-muted">Create one, add a feature, and generate your first suite.</p>
        </div>
      ) : (
        <section className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {projects.map((project, i) => (
            <Link
              key={project.id}
              href={`/projects/${project.id}`}
              className="panel group flex flex-col p-5 animate-rise transition-transform hover:-translate-y-1 hover:-rotate-[0.6deg]"
              style={{ animationDelay: `${Math.min(i, 12) * 45}ms` }}
            >
              <div className="flex items-start justify-between gap-3">
                <h2 className="text-[16px] font-bold leading-snug">{project.name}</h2>
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full border-[1.5px] border-fg transition-colors group-hover:bg-accent dark:border-line-strong">
                  <FiArrowUpRight className="transition-transform group-hover:rotate-45" />
                </span>
              </div>
              <p className="mt-1.5 line-clamp-2 min-h-[2.8em] text-[13.5px] leading-relaxed text-muted">{project.description || "No description"}</p>
              <p className="mt-5 flex items-center justify-between border-t border-dashed border-line-strong pt-3 font-mono text-[11px] text-muted">
                <span>{shortId(project.id)}</span>
                <span title={new Date(project.createdAt).toLocaleString()}>{timeAgo(project.createdAt)}</span>
              </p>
            </Link>
          ))}
        </section>
      )}

      <ProjectModal open={isProjectModalOpen} onClose={() => setIsProjectModalOpen(false)} onCreated={(p) => setProjects((prev) => [p, ...prev])} />
    </Page>
  );
}
