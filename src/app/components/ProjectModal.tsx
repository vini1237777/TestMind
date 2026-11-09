"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Project } from "../types/testmind";
import { createProject, updateProject } from "../actions/projects";
import ProjectTile from "./ProjectTile";
import Modal, { btnGhost, btnPrimary, fieldClass, labelClass } from "./Modal";

type ProjectModalProps = {
  open: boolean;
  onClose: () => void;
  onCreated?: (project: Project) => void;
  // With a project, the modal edits it instead of creating one.
  project?: Project;
  onSaved?: (project: Project) => void;
};

export default function ProjectModal({
  open,
  onClose,
  onCreated,
  project: editing,
  onSaved,
}: ProjectModalProps) {
  const [project, setProject] = useState({
    name: "",
    description: "",
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!open || !editing) return;
    setProject({ name: editing.name, description: editing.description ?? "" });
  }, [open, editing]);

  const handleSave = async () => {
    if (!project.name.trim()) {
      toast.error("Project name is required.");
      return;
    }

    setIsSaving(true);
    if (editing) {
      try {
        const result = await updateProject(editing.id, project);
        if ("error" in result) {
          toast.error(result.error);
          return;
        }
        onSaved?.(result.project);
        toast.success("Project saved");
        onClose();
      } catch {
        toast.error("Could not save the project. Please try again.");
      } finally {
        setIsSaving(false);
      }
      return;
    }
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
      title={editing ? "Edit project" : "Create project"}
      subtitle={editing ? undefined : "A project groups related features, like an app or a service."}
      footer={
        <>
          <button type="button" className={btnGhost} onClick={onClose} disabled={isSaving}>
            Cancel
          </button>
          <button type="button" className={btnPrimary} onClick={handleSave} disabled={isSaving || !name}>
            {isSaving && <span className="h-3 w-3 animate-spin rounded-full border-2 border-white/40 border-t-white" />}
            {editing ? (isSaving ? "Saving..." : "Save project") : isSaving ? "Creating..." : "Create project"}
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
          <p className="mb-1.5 text-xs text-gray-500">How it will look</p>
          <div className="flex items-center gap-3 rounded-lg border border-dashed p-3">
            <ProjectTile name={name} />
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
