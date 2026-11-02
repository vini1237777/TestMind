"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import { Project } from "../types/testmind";
import ProjectModal from "../components/ProjectModal";
import CardSkeleton from "../components/CardSkeleton";
import FailedTest from "../components/FailedTest";

export default function ProjectsPage() {
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [loadFailed, setLoadFailed] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

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
    <main className="max-w-full mx-4 px-4 py-8">
      <header className="mb-6 flex items-center justify-between">
        <div className="w-full">
          <h1 className="text-2xl font-semibold">Projects</h1>
          {!hasLoaded ? (
            <span className="w-[92%]">
              <Skeleton height={20} width={"50%"} />
            </span>
          ) : (
            <p className="text-sm text-gray-500">
              Select a project to view its AI-generated test suites.
            </p>
          )}
        </div>

        <button
          className="text-xs px-3 py-2 rounded bg-amber-500 text-white hover:bg-amber-300 dark:bg-gray-200 dark:text-black"
          onClick={() => setIsProjectModalOpen(true)}
        >
          + New Project
        </button>
      </header>

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
        <p className="text-sm text-gray-500">
          No projects yet. Click{" "}
          <span className="font-semibold">+ New Project</span> to create one.
        </p>
      ) : (
        <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {projects?.map((project, i) => (
            <Link
              key={project?.id}
              href={`/projects/${project.id}`}
              className="tm-rise tm-lift border rounded p-4 hover:shadow-2xl text-sm dark:hover:shadow-md dark:hover:shadow-white"
              style={{ animationDelay: `${Math.min(i, 12) * 50}ms` }}
            >
              <h2 className="font-semibold mb-1">{project?.name}</h2>
              <p className="text-xs text-gray-500 mb-2 line-clamp-2">
                {project?.description}
              </p>
              <p className="text-[11px] text-gray-400">
                Created: {new Date(project?.createdAt).toLocaleString()}
              </p>
            </Link>
          ))}
        </section>
      )}

      <ProjectModal
        open={isProjectModalOpen}
        onClose={() => setIsProjectModalOpen(false)}
        onCreated={(newProject) => setProjects((prev) => [newProject, ...prev])}
      />
    </main>
  );
}
