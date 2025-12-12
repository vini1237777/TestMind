"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import { Project } from "../types/testmind";
import ProjectModal from "../components/ProjectModal";
import CardSkeleton from "../components/CardSkeleton";

export default function ProjectsPage() {
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [hasLoaded, setHasLoaded] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const loadProjects = async () => {
      try {
        const res = await fetch("/api/projects", {
          cache: "no-store",
        });

        if (res.status === 429) {
          toast.error("Too many requests. Please try again later.");
          return;
        }

        if (!res.ok) {
          toast.error("Failed to load projects.");
          return;
        }

        const data = await res.json();
        if (!isMounted) return;

        setProjects(data.projects || []);
      } catch (error) {
        console.error(error);
        toast.error("Something went wrong while loading projects.");
      } finally {
        if (!isMounted) return;
        setHasLoaded(true);
      }
    };

    loadProjects();

    return () => {
      isMounted = false;
    };
  }, []);

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
      ) : projects.length === 0 ? (
        <p className="text-sm text-gray-500">
          No projects yet. Click{" "}
          <span className="font-semibold">+ New Project</span> to create one.
        </p>
      ) : (
        <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {projects?.map((project) => (
            <Link
              key={project?.id}
              href={`/projects/${project.id}`}
              className="border rounded p-4 hover:shadow-2xl transition text-sm dark:hover:shadow-md dark:hover:shadow-white"
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
