"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import type { TestSuite } from "@/src/app/types/testmind";
import { createSuite } from "@/src/app/actions/suites";
import { Field, Modal } from "./ui";

export default function FeatureModal({
  projectId,
  open,
  onClose,
  onCreated,
  lastFeedbackSummary,
  lastFeedbackScore,
  lastReviewedAt,
}: {
  projectId: string;
  open: boolean;
  onClose: () => void;
  onCreated?: (suite: TestSuite) => void;
  lastFeedbackSummary: string;
  lastFeedbackScore: number | null;
  lastReviewedAt: string | null;
}) {
  const [featureName, setFeatureName] = useState("");
  const [description, setDescription] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    const trimmedName = featureName.trim();
    if (!trimmedName) return toast.error("Feature name is required");
    if (!projectId) return toast.error("Missing projectId");

    setIsSaving(true);
    try {
      const suite = await createSuite({
        projectId,
        featureName: trimmedName,
        description: description.trim(),
        testCases: [],
        lastFeedbackSummary,
        lastFeedbackScore,
        lastReviewedAt,
      });
      toast.success("Feature / suite created");
      onCreated?.(suite);
      setFeatureName("");
      setDescription("");
      onClose();
    } catch (err) {
      console.error(err);
      toast.error(err instanceof Error ? err.message : "Failed to create suite");
    } finally {
      setIsSaving(false);
    }
  };

  if (!open) return null;

  return (
    <Modal
      title="Create New Feature / Suite"
      onClose={onClose}
      footer={
        <>
          <button type="button" className="btn" onClick={onClose} disabled={isSaving}>Cancel</button>
          <button type="button" className="btn btn-primary" onClick={handleSave} disabled={isSaving || !featureName.trim()}>
            {isSaving ? "Saving…" : "Save"}
          </button>
        </>
      }
    >
      <Field label="Feature">
        <input autoFocus type="text" className="field" placeholder="Feature name, e.g. Password reset"
          value={featureName} onChange={(e) => setFeatureName(e.target.value)} />
      </Field>
      <Field label="Spec" hint="Write it like a ticket: behavior, rules, limits. The more specific, the better the edge cases.">
        <textarea className="field min-h-28 resize-y" placeholder="e.g. Users request a reset link by email. Links expire after 30 minutes and can be used once. Unknown emails get the same response."
          value={description} onChange={(e) => setDescription(e.target.value)} />
      </Field>
    </Modal>
  );
}
