"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";

type Props = {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  children: ReactNode;
  footer: ReactNode;
  busy?: boolean;
  onSubmit?: () => void;
  width?: string;
};

/**
 * Shared dialog shell: blurred backdrop, Escape and outside click to close,
 * focus on the first field, and Cmd or Ctrl + Enter to submit.
 */
export default function Modal({ open, onClose, title, subtitle, icon, children, footer, busy, onSubmit, width = "max-w-xl" }: Props) {
  const panel = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const prev = document.activeElement as HTMLElement | null;
    const first = panel.current?.querySelector<HTMLElement>("input, textarea, select");
    first?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !busy) onClose();
      if (e.key === "Enter" && (e.metaKey || e.ctrlKey) && onSubmit && !busy) {
        e.preventDefault();
        onSubmit();
      }
    };
    document.addEventListener("keydown", onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
      prev?.focus?.();
    };
  }, [open, busy, onClose, onSubmit]);

  if (!open || typeof document === "undefined") return null;

  // Portal to <body> so animated or transformed parents cannot trap the fixed overlay
  return createPortal(
    <div
      className="tm-fade fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-md"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !busy) onClose();
      }}
    >
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby="tm-modal-title"
        className={`tm-pop w-full ${width} overflow-hidden rounded-lg border bg-white shadow-2xl dark:bg-gray-900`}
      >
        <header className="flex items-start gap-3 border-b px-5 py-4">
          {icon}
          <div className="min-w-0 flex-1">
            <h2 id="tm-modal-title" className="font-semibold">
              {title}
            </h2>
            {subtitle && <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">{subtitle}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            aria-label="Close"
            className="grid h-8 w-8 place-items-center rounded-md text-gray-400 hover:bg-gray-100 hover:text-gray-700 disabled:opacity-40 dark:hover:bg-gray-800"
          >
            ✕
          </button>
        </header>

        <div className="max-h-[70vh] overflow-y-auto px-5 py-5">{children}</div>

        <footer className="flex items-center justify-between gap-3 border-t px-5 py-3">
          {onSubmit && (
            <span className="hidden text-[11px] text-gray-400 sm:inline">
              <kbd className="rounded border px-1">⌘</kbd> <kbd className="rounded border px-1">Enter</kbd> to save
            </span>
          )}
          <div className="ml-auto flex flex-1 justify-end gap-2">{footer}</div>
        </footer>
      </div>
    </div>,
    document.body,
  );
}

export const fieldClass =
  "w-full rounded-md border px-3 py-2 text-sm outline-none transition-shadow placeholder:text-gray-400 focus:border-amber-400 focus:ring-4 focus:ring-amber-500/15 dark:bg-gray-950";
export const labelClass = "mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300";
export const btnGhost = "rounded-md px-3 py-2 text-sm text-gray-600 hover:bg-gray-200/70 disabled:opacity-50 dark:text-gray-300 dark:hover:bg-gray-800";
export const btnPrimary =
  "tm-press inline-flex items-center gap-2 rounded-md bg-amber-500 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-amber-600 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-gray-200 dark:text-black";
