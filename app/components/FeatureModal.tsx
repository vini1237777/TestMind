"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import type { TestSuite } from "@/app/types/testmind";
import { createSuite } from "@/app/actions/suites";

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
  lastFeedbackScore: number;
  lastReviewedAt: string;
}) {
  const [featureName, setFeatureName] = useState("");
  const [description, setDescription] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    const trimmedName = featureName.trim();
    const trimmedDesc = description.trim();

    if (!trimmedName) {
      toast.error("Feature name is required");
      return;
    }

    if (!projectId) {
      toast.error("Missing projectId");
      return;
    }

    setIsSaving(true);
    try {
      const suite = await createSuite({
        projectId,
        featureName: trimmedName,
        description: trimmedDesc,
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
      toast.error(
        err instanceof Error ? err.message : "Failed to create suite"
      );
    } finally {
      setIsSaving(false);
    }
  };

  if (!open) return null;

  const isDisabled = isSaving || !featureName.trim();

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
      <div className="bg-white w-[480px] rounded shadow-md overflow-hidden">
        <header className="px-4 py-3 border-b font-medium text-sm">
          Create New Feature / Suite
        </header>

        <div className="px-4 py-4 flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium">Feature Name</label>
            <input
              type="text"
              placeholder="e.g. Apply coupon on checkout"
              value={featureName}
              onChange={(e) => setFeatureName(e.target.value)}
              className="p-2 border rounded focus:ring-2 focus:ring-amber-500 outline-none"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium">Description</label>
            <textarea
              placeholder="Short description of what this feature covers"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="p-2 border rounded h-20 focus:ring-2 focus:ring-amber-500 outline-none"
            />
          </div>
        </div>

        <footer className="flex justify-between px-4 py-2 border-t">
          <button
            className="px-3 py-1 text-sm rounded bg-gray-200 hover:bg-gray-300 disabled:opacity-60"
            onClick={onClose}
            disabled={isSaving}
          >
            Cancel
          </button>
          <button
            className="px-3 py-1 text-sm rounded bg-amber-500 text-white disabled:opacity-60 disabled:cursor-not-allowed"
            onClick={handleSave}
            disabled={isDisabled}
          >
            {isSaving ? "Saving..." : "Save"}
          </button>
        </footer>
      </div>
    </div>
  );
}
