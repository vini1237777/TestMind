"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Project } from "../types/testmind";
import ProjectModal from "../components/ProjectModal";
import toast from "react-hot-toast";

export default function ProjectsPage() {
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);

  useEffect(() => {
    const loadProjects = async () => {
      try {
        const res = await fetch("/api/projects");
        if (res?.status === 429) {
          toast.error(
            res.statusText + "." + " " + "Please try again after sometime"
          );
        }
        if (!res.ok) return;

        const data = await res.json();
        setProjects(data.projects || []);
      } catch (e) {
        console.error(e);
      }
    };

    loadProjects();
  }, []);

  return (
    <main className="max-w-5xl mx-auto px-4 py-8">
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Projects</h1>
          <p className="text-sm text-gray-500">
            Select a project to view its AI-generated test suites.
          </p>
        </div>

        <button
          className="text-xs px-3 py-2 rounded bg-amber-500 text-white cursor-pointer"
          onClick={() => setIsProjectModalOpen(true)}
        >
          + New Project
        </button>
      </header>

      {projects.length === 0 ? (
        <p className="text-sm text-gray-500">
          No projects yet. Click{" "}
          <span className="font-semibold">+ New Project</span> to create one.
        </p>
      ) : (
        <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {projects.map((project) => (
            <Link
              key={project.id}
              href={`/projects/${project.id}`}
              className="border rounded p-4 shadow-sm hover:shadow-md transition text-sm"
            >
              <h2 className="font-semibold mb-1">{project.name}</h2>
              <p className="text-xs text-gray-500 mb-2 line-clamp-2">
                {project.description}
              </p>
              <p className="text-[11px] text-gray-400">
                Created: {new Date(project.createdAt).toLocaleString()}
              </p>
            </Link>
          ))}
        </section>
      )}

      <ProjectModal
        open={isProjectModalOpen}
        onClose={() => setIsProjectModalOpen(false)}
        onCreated={(newProject) => {
          setProjects((prev) => [newProject, ...prev]);
        }}
      />
    </main>
  );
}
