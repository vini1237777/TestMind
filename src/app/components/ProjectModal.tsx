"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { Project } from "../types/testmind";
import { createProject } from "../actions/projects";

type ProjectModalProps = {
  open: boolean;
  onClose: () => void;
  onCreated?: (project: Project) => void;
};

export default function ProjectModal({
  open,
  onClose,
  onCreated,
}: ProjectModalProps) {
  const [project, setProject] = useState({
    name: "",
    description: "",
  });
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!project.name.trim()) {
      toast.error("Project name is required.");
      return;
    }

    setIsSaving(true);
    try {
      const created: Project = await createProject({
        name: project.name,
        description: project.description,
      });

      onCreated?.(created);
      toast.success("Project created");

      setProject({ name: "", description: "" });
      onClose();
    } catch (err) {
      console.error(err);
      toast.error("Failed to create project");
    } finally {
      setIsSaving(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="max-w-[800px] bg-white shadow-lg rounded-md w-[600px]">
        <h2 className="text-sm font-medium text-amber-700 border-b border-gray-300 py-3 px-4 mb-4">
          Create Project
        </h2>

        <div className="flex flex-col gap-4 mt-4 mb-6 mx-6">
          <label className="text-sm font-medium text-gray-800">
            Project Name
          </label>
          <input
            type="text"
            placeholder="Project Name"
            value={project.name}
            onChange={(e) =>
              setProject((prev) => ({ ...prev, name: e.target.value }))
            }
            className="p-2 border border-gray-300 rounded focus:ring-2 focus:ring-amber-500 outline-none"
          />

          <label className="text-sm font-medium text-gray-800">
            Project Description
          </label>
          <input
            type="text"
            placeholder="Project Description"
            value={project.description}
            onChange={(e) =>
              setProject((prev) => ({
                ...prev,
                description: e.target.value,
              }))
            }
            className="p-2 border border-gray-300 rounded focus:ring-2 focus:ring-amber-500 outline-none"
          />
        </div>

        <div className="border-t border-gray-300 flex justify-between items-center px-4 py-2">
          <button
            type="button"
            className="h-8 px-3 text-sm rounded-md bg-gray-600 text-white hover:bg-gray-700 disabled:opacity-60"
            onClick={onClose}
            disabled={isSaving}
          >
            Close
          </button>

          <button
            type="button"
            className="h-8 px-3 text-sm rounded-md bg-amber-600 text-white hover:bg-amber-700 disabled:opacity-60"
            onClick={handleSave}
            disabled={isSaving}
          >
            {isSaving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}
