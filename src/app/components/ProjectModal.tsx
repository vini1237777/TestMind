"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { Project } from "../types/testmind";
import { createProject } from "../actions/projects";
import Modal, { btnGhost, btnPrimary, fieldClass, labelClass } from "./Modal";
import { initials } from "../lib/format";

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

  const name = project.name.trim();

  return (
    <Modal
      open={open}
      onClose={onClose}
      busy={isSaving}
      onSubmit={name ? handleSave : undefined}
      title="Create project"
      subtitle="A project groups related features, like an app or a service."
      footer={
        <>
          <button type="button" className={btnGhost} onClick={onClose} disabled={isSaving}>
            Cancel
          </button>
          <button type="button" className={btnPrimary} onClick={handleSave} disabled={isSaving || !name}>
            {isSaving && <span className="h-3 w-3 animate-spin rounded-full border-2 border-white/40 border-t-white" />}
            {isSaving ? "Creating..." : "Create project"}
          </button>
        </>
      }
    >
      <div className="space-y-4">
        <div>
          <label htmlFor="project-name" className={labelClass}>
            Project name
          </label>
          <input
            id="project-name"
            type="text"
            maxLength={80}
            placeholder="Project name, e.g. Checkout service"
            value={project.name}
            onChange={(e) => setProject((prev) => ({ ...prev, name: e.target.value }))}
            className={fieldClass}
          />
        </div>

        <div>
          <label htmlFor="project-description" className={labelClass}>
            Description <span className="font-normal text-gray-400">(optional)</span>
          </label>
          <textarea
            id="project-description"
            rows={3}
            maxLength={240}
            placeholder="Project description: what it covers"
            value={project.description}
            onChange={(e) => setProject((prev) => ({ ...prev, description: e.target.value }))}
            className={`${fieldClass} resize-none`}
          />
          <p className="mt-1 text-right text-[11px] text-gray-400">{project.description.length}/240</p>
        </div>

        {/* Live preview of the card this will create */}
        <div>
          <p className="mb-1.5 text-[11px] uppercase tracking-wide text-gray-400">Preview</p>
          <div className="flex items-center gap-3 rounded-lg border border-dashed p-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-amber-100 text-sm font-bold text-amber-800">
              {name ? initials(name) : "?"}
            </span>
            <div className="min-w-0">
              <p className={`truncate text-sm font-semibold ${name ? "" : "text-gray-400"}`}>{name || "Your project"}</p>
              <p className="truncate text-xs text-gray-500">{project.description.trim() || "No description."}</p>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}
