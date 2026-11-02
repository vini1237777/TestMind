"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { Project } from "../types/testmind";
import { createProject } from "../actions/projects";
import { Field, Modal } from "./ui";

type ProjectModalProps = {
  open: boolean;
  onClose: () => void;
  onCreated?: (project: Project) => void;
};

export default function ProjectModal({ open, onClose, onCreated }: ProjectModalProps) {
  const [project, setProject] = useState({ name: "", description: "" });
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!project.name.trim()) {
      toast.error("Project name is required.");
      return;
    }
    setIsSaving(true);
    try {
      const created: Project = await createProject({ name: project.name, description: project.description });
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
    <Modal
      title="Create project"
      onClose={onClose}
      footer={
        <>
          <button type="button" className="btn" onClick={onClose} disabled={isSaving}>Cancel</button>
          <button type="button" className="btn btn-primary" onClick={handleSave} disabled={isSaving || !project.name.trim()}>
            {isSaving ? "Saving…" : "Save"}
          </button>
        </>
      }
    >
      <Field label="Name">
        <input autoFocus type="text" placeholder="Project name, e.g. Checkout service" className="field"
          value={project.name} onChange={(e) => setProject((p) => ({ ...p, name: e.target.value }))}
          onKeyDown={(e) => e.key === "Enter" && handleSave()} />
      </Field>
      <Field label="Description" hint="Optional. Shown on the project card.">
        <input type="text" placeholder="Project description" className="field"
          value={project.description} onChange={(e) => setProject((p) => ({ ...p, description: e.target.value }))} />
      </Field>
    </Modal>
  );
}
