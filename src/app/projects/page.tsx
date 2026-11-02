"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";
import "react-loading-skeleton/dist/skeleton.css";
import { Project } from "../types/testmind";
import ProjectModal from "../components/ProjectModal";
import CardSkeleton from "../components/CardSkeleton";
import FailedTest from "../components/FailedTest";
import ProjectCard from "../components/ProjectCard";

export default function ProjectsPage() {
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [loadFailed, setLoadFailed] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<"recent" | "newest" | "name" | "cases" | "score">("recent");
  const searchRef = useRef<HTMLInputElement>(null);

  // "/" jumps to search, Escape clears it
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement;
      const typing = el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.isContentEditable;
      if (e.key === "/" && !typing) {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = q
      ? projects.filter((p) => `${p.name} ${p.description ?? ""}`.toLowerCase().includes(q))
      : [...projects];
    const t = (d?: string | null) => (d ? new Date(d).getTime() : 0);
    const by: Record<typeof sort, (a: Project, b: Project) => number> = {
      recent: (a, b) => t(b.stats?.lastActivity ?? b.createdAt) - t(a.stats?.lastActivity ?? a.createdAt),
      newest: (a, b) => t(b.createdAt) - t(a.createdAt),
      name: (a, b) => a.name.localeCompare(b.name),
      cases: (a, b) => (b.stats?.cases ?? 0) - (a.stats?.cases ?? 0),
      score: (a, b) => (b.stats?.avgScore ?? -1) - (a.stats?.avgScore ?? -1),
    };
    list.sort(by[sort]);
    return list;
  }, [projects, query, sort]);

  const totals = useMemo(() => {
    const withStats = projects.filter((p) => p.stats);
    const scored = withStats.filter((p) => typeof p.stats!.avgScore === "number");
    return {
      suites: withStats.reduce((n, p) => n + p.stats!.suites, 0),
      cases: withStats.reduce((n, p) => n + p.stats!.cases, 0),
      avg: scored.length ? Math.round(scored.reduce((n, p) => n + (p.stats!.avgScore as number), 0) / scored.length) : null,
    };
  }, [projects]);

  useEffect(() => {
    let isMounted = true;

    const loadProjects = async () => {
      try {
        const res = await fetch("/api/projects", {
          cache: "no-store",
        });

        if (res.status === 429) {
          toast.error("Too many requests. Please try again later.");
          setLoadFailed("429 Too Many Requests (limit is 10 per minute)");
          return;
        }

        if (!res.ok) {
          toast.error("Failed to load projects.");
          setLoadFailed(`${res.status} from /api/projects`);
          return;
        }

        const data = await res.json();
        if (!isMounted) return;

        setProjects(data.projects || []);
      } catch (error) {
        console.error(error);
        toast.error("Something went wrong while loading projects.");
        setLoadFailed("Network error reaching /api/projects");
      } finally {
        if (!isMounted) return;
        setHasLoaded(true);
      }
    };

    loadProjects();

    return () => {
      isMounted = false;
    };
  }, [attempt]);

  return (
    <main className="tm-zoom-in max-w-full mx-4 px-4 py-8">
      <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Projects</h1>
          <p className="text-sm text-gray-500">
            Each project holds features, and each feature gets an AI written, AI reviewed test suite.
          </p>
        </div>

        <button
          className="tm-press shrink-0 rounded bg-amber-500 px-3 py-2 text-xs font-medium text-white shadow-sm hover:bg-amber-600 dark:bg-gray-200 dark:text-black"
          onClick={() => setIsProjectModalOpen(true)}
        >
          + New Project
        </button>
      </header>

      {hasLoaded && !loadFailed && projects.length > 0 && (
        <dl className="tm-fade mb-6 grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-gray-200 bg-gray-200 sm:grid-cols-4 dark:border-gray-700 dark:bg-gray-700">
          {[
            ["Projects", projects.length],
            ["Test suites", totals.suites],
            ["Test cases", totals.cases],
            ["Avg review score", totals.avg === null ? "none yet" : `${totals.avg}/100`],
          ].map(([label, value]) => (
            <div key={label} className="bg-amber-50 px-4 py-3 dark:bg-gray-900">
              <dt className="text-[11px] uppercase tracking-wide text-gray-500">{label}</dt>
              <dd className="text-xl font-semibold">{value}</dd>
            </div>
          ))}
        </dl>
      )}

      {!hasLoaded ? (
        <CardSkeleton />
      ) : loadFailed ? (
        <FailedTest
          compact
          code="TC_503"
          title="Projects should load"
          expected="200 OK with a list of projects"
          received={loadFailed}
          hint="The database or cache did not answer in time. Everything else still works, so try again in a moment."
          onRetry={() => {
            setLoadFailed(null);
            setHasLoaded(false);
            setAttempt((a) => a + 1);
          }}
        />
      ) : projects.length === 0 ? (
        <div className="tm-rise rounded-lg border border-dashed p-10 text-center dark:border-gray-700">
          <p className="text-3xl" aria-hidden>🧪</p>
          <h2 className="mt-2 font-semibold">No projects yet</h2>
          <p className="mx-auto mt-1 max-w-sm text-sm text-gray-500">
            Create a project, add a feature with a short description, and TestMind drafts the first test suite for you.
          </p>
          <button
            onClick={() => setIsProjectModalOpen(true)}
            className="tm-press mt-4 rounded bg-amber-500 px-4 py-2 text-xs font-medium text-white hover:bg-amber-600"
          >
            Create your first project
          </button>
        </div>
      ) : (
        <>
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <div className="relative min-w-[220px] flex-1 sm:max-w-sm">
            <input
              ref={searchRef}
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Escape" && setQuery("")}
              placeholder="Search projects"
              aria-label="Search projects"
              className="w-full rounded border px-3 py-1.5 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 dark:border-gray-700 dark:bg-gray-900"
            />
            {!query && (
              <kbd className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 rounded border px-1.5 text-[10px] text-gray-400 dark:border-gray-700">/</kbd>
            )}
          </div>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as typeof sort)}
            aria-label="Sort projects"
            className="rounded border px-2 py-1.5 text-sm dark:border-gray-700 dark:bg-gray-900"
          >
            <option value="recent">Recently active</option>
            <option value="newest">Newest first</option>
            <option value="cases">Most test cases</option>
            <option value="score">Highest score</option>
            <option value="name">Name A to Z</option>
          </select>
          <span className="ml-auto text-xs text-gray-500">
            {visible.length === projects.length ? `${projects.length} projects` : `${visible.length} of ${projects.length} projects`}
          </span>
        </div>

        {visible.length === 0 ? (
          <p className="text-sm text-gray-500">
            No projects match &ldquo;{query}&rdquo;.{" "}
            <button className="underline text-amber-700" onClick={() => setQuery("")}>Clear search</button>
          </p>
        ) : (
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {visible.map((project, i) => (
            <ProjectCard key={project.id} project={project} index={i} />
          ))}
        </section>
        )}
        </>
      )}

      <ProjectModal
        open={isProjectModalOpen}
        onClose={() => setIsProjectModalOpen(false)}
        onCreated={(newProject) => setProjects((prev) => [newProject, ...prev])}
      />
    </main>
  );
}
