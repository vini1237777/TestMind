"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import Modal, { btnGhost, btnPrimary, fieldClass, labelClass } from "./Modal";
import { editFeature } from "../actions/suites";

type Feature = { id: string; featureName: string; description?: string };

/** Renames a feature and changes its description, from the project page. */
export default function FeatureEditModal({ feature, onClose, onSaved }: {
  feature: Feature | null;
  onClose: () => void;
  onSaved: (saved: { name: string; description: string }) => void;
}) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!feature) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setName(feature.featureName);
    setDescription(feature.description ?? "");
    setError(null);
  }, [feature]);

  const save = async () => {
    if (!feature || busy) return;
    if (!name.trim()) return setError("Feature name is required.");
    setBusy(true);
    try {
      const result = await editFeature(feature.id, { name, description });
      if ("error" in result) return setError(result.error);
      toast.success("Feature saved");
      onSaved({ name: name.trim(), description: description.trim() });
      onClose();
    } catch {
      setError("Could not save the feature. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      open={Boolean(feature)}
      onClose={onClose}
      busy={busy}
      onSubmit={save}
      title="Edit feature"
      subtitle="A new name applies to every saved version of this feature."
      footer={
        <>
          <button type="button" className={btnGhost} onClick={onClose} disabled={busy}>
            Cancel
          </button>
          <button type="button" className={btnPrimary} onClick={save} disabled={busy}>
            {busy ? "Saving..." : "Save feature"}
          </button>
        </>
      }
    >
      <div className="space-y-4">
        <div>
          <label htmlFor="feature-edit-name" className={labelClass}>
            Name
          </label>
          <input
            id="feature-edit-name"
            value={name}
            maxLength={200}
            onChange={(e) => {
              setName(e.target.value);
              setError(null);
            }}
            aria-invalid={Boolean(error)}
            aria-describedby={error ? "feature-edit-error" : undefined}
            className={fieldClass}
          />
        </div>
        <div>
          <label htmlFor="feature-edit-description" className={labelClass}>
            What it should do
          </label>
          <textarea
            id="feature-edit-description"
            rows={5}
            maxLength={5000}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className={fieldClass}
          />
        </div>
        {error && (
          <p id="feature-edit-error" role="alert" className="text-xs text-red-600 dark:text-red-400">
            {error}
          </p>
        )}
      </div>
    </Modal>
  );
}
