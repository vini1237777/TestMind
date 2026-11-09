"use client";

import { useState, type ReactNode } from "react";
import Modal, { btnDanger, btnGhost, fieldClass, labelClass } from "./Modal";

type Props = {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  actionLabel: string;
  // When set, the button stays disabled until this text is typed.
  confirmText?: string;
  onConfirm: () => Promise<void>;
};

export default function ConfirmDelete({ open, onClose, title, children, actionLabel, confirmText, onConfirm }: Props) {
  const [typed, setTyped] = useState("");
  const [busy, setBusy] = useState(false);
  const ready = !confirmText || typed.trim() === confirmText.trim();

  const close = () => {
    setTyped("");
    onClose();
  };

  const confirm = async () => {
    if (!ready || busy) return;
    setBusy(true);
    try {
      await onConfirm();
      setTyped("");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={close}
      busy={busy}
      onSubmit={ready ? confirm : undefined}
      title={title}
      footer={
        <>
          <button type="button" className={btnGhost} onClick={close} disabled={busy}>
            Cancel
          </button>
          <button type="button" className={btnDanger} onClick={confirm} disabled={busy || !ready}>
            {busy && <span className="h-3 w-3 animate-spin rounded-full border-2 border-white/40 border-t-white" />}
            {busy ? "Deleting..." : actionLabel}
          </button>
        </>
      }
    >
      <div className="space-y-4 text-sm text-gray-700 dark:text-gray-300">
        {children}
        {confirmText && (
          <div>
            <label htmlFor="confirm-delete" className={labelClass}>
              Type <span className="font-semibold">{confirmText}</span> to confirm
            </label>
            <input
              id="confirm-delete"
              type="text"
              autoComplete="off"
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              className={fieldClass}
            />
          </div>
        )}
      </div>
    </Modal>
  );
}
