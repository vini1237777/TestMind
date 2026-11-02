"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import type { TestSuite } from "@/src/app/types/testmind";
import { createSuite } from "@/src/app/actions/suites";
import Modal, { btnGhost, btnPrimary, fieldClass, labelClass } from "./Modal";

const EXAMPLES = [
  {
    name: "Password reset",
    description: "Users request a reset link by email. The link expires after 30 minutes and works only once. The new password needs 8+ characters with a number.",
  },
  {
    name: "Checkout with coupon",
    description: "Shoppers can apply one coupon per order. Coupons have an expiry date and a minimum cart value. Totals update before payment.",
  },
  {
    name: "Profile photo upload",
    description: "Users upload a JPG or PNG up to 5 MB. Images are cropped to a square. The old photo is replaced only after the upload succeeds.",
  },
];

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
        err instanceof Error ? err.message : "Failed to create suite",
      );
    } finally {
      setIsSaving(false);
    }
  };

  const isDisabled = isSaving || !featureName.trim();
  const words = description.trim() ? description.trim().split(/\s+/).length : 0;
  const quality = words === 0 ? null : words < 12 ? "Short. Add rules and limits for better edge cases." : words < 25 ? "Good. A limit or error case or two more would help." : "Detailed. Expect strong negative and edge cases.";

  return (
    <Modal
      open={open}
      onClose={onClose}
      busy={isSaving}
      onSubmit={isDisabled ? undefined : handleSave}
      title="Create new feature"
      subtitle="Describe one feature. TestMind turns it into a test suite you can generate and review."
      width="max-w-2xl"
      footer={
        <>
          <button type="button" className={btnGhost} onClick={onClose} disabled={isSaving}>
            Cancel
          </button>
          <button type="button" className={btnPrimary} onClick={handleSave} disabled={isDisabled}>
            {isSaving && <span className="h-3 w-3 animate-spin rounded-full border-2 border-white/40 border-t-white" />}
            {isSaving ? "Creating..." : "Create feature"}
          </button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          <span className="text-gray-500">Start from an example:</span>
          {EXAMPLES.map((ex) => (
            <button
              key={ex.name}
              type="button"
              onClick={() => {
                setFeatureName(ex.name);
                setDescription(ex.description);
              }}
              className={`rounded-full border px-2.5 py-0.5 transition-colors ${
                featureName === ex.name
                  ? "border-amber-500 bg-amber-500 text-white"
                  : "border-amber-200 bg-amber-50 text-amber-800 hover:border-amber-400 hover:bg-amber-100 dark:border-gray-700 dark:bg-gray-800 dark:text-amber-300"
              }`}
            >
              {ex.name}
            </button>
          ))}
        </div>

        <div>
          <label htmlFor="feature-name" className={labelClass}>
            Feature name
          </label>
          <input
            id="feature-name"
            type="text"
            maxLength={100}
            placeholder="Feature name, e.g. User login"
            value={featureName}
            onChange={(e) => setFeatureName(e.target.value)}
            className={fieldClass}
          />
        </div>

        <div>
          <label htmlFor="feature-description" className={labelClass}>
            What should it do?
          </label>
          <textarea
            id="feature-description"
            rows={5}
            placeholder="Description: what the feature does, its rules and limits"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className={`${fieldClass} resize-y leading-relaxed`}
          />
          <div className="mt-1.5 flex items-center gap-2 text-[11px]">
            <div className="h-1 w-24 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800" aria-hidden>
              <div
                className={`h-full rounded-full transition-[width,background-color] duration-300 ${words < 12 ? "bg-red-400" : words < 25 ? "bg-amber-400" : "bg-green-500"}`}
                style={{ width: `${Math.min(100, (words / 30) * 100)}%` }}
              />
            </div>
            <span className="text-gray-500">{quality ?? "Tip: mention limits, expiry times and error cases."}</span>
          </div>
        </div>
      </div>
    </Modal>
  );
}
