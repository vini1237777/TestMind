"use client";

import { useEffect, useRef, useState } from "react";
import AuthCard, { type AuthMode } from "./AuthCard";

/**
 * The sign in form in a native dialog, which gives focus trapping and Escape for free.
 * Anything on the page can open it with: dispatchEvent(new CustomEvent("tm:signin", { detail: "signup" }))
 */
export default function AuthDialog({ next, openOnLoad }: { next: string | null; openOnLoad: AuthMode | null }) {
  const ref = useRef<HTMLDialogElement>(null);
  const [mode, setMode] = useState<AuthMode | null>(null);

  useEffect(() => {
    const onAsk = (e: Event) => setMode(((e as CustomEvent).detail as AuthMode) || "signin");
    window.addEventListener("tm:signin", onAsk);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (openOnLoad) setMode(openOnLoad);
    return () => window.removeEventListener("tm:signin", onAsk);
  }, [openOnLoad]);

  useEffect(() => {
    const dialog = ref.current;
    if (mode && dialog && !dialog.open) dialog.showModal();
  }, [mode]);

  return (
    <dialog
      ref={ref}
      onClose={() => setMode(null)}
      onClick={(e) => e.target === ref.current && ref.current?.close()}
      aria-labelledby="auth-title"
      className="tm-pop m-auto w-[min(26rem,calc(100vw-2rem))] rounded-xl border border-black bg-white p-0 text-slate-900 shadow-[6px_6px_0_0_#fcd34d] backdrop:bg-slate-950/50 backdrop:backdrop-blur-sm dark:border-amber-400 dark:bg-slate-900 dark:text-slate-50 dark:shadow-[6px_6px_0_0_rgba(251,191,36,0.35)]"
    >
      {mode && (
        <div className="p-6">
          <div className="mb-5 flex items-start justify-between gap-4">
            <div>
              <h2 id="auth-title" className="text-lg font-semibold tracking-tight">
                Your TestMind account
              </h2>
              <p className="mt-0.5 text-xs text-gray-500">Projects you make are visible only to you.</p>
            </div>
            <button
              type="button"
              onClick={() => ref.current?.close()}
              aria-label="Close"
              className="-mr-2 -mt-1 grid h-8 w-8 place-items-center rounded-md text-gray-500 hover:bg-gray-100 hover:text-black dark:hover:bg-slate-800 dark:hover:text-white"
            >
              <svg aria-hidden viewBox="0 0 16 16" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                <path d="M4 4l8 8M12 4l-8 8" />
              </svg>
            </button>
          </div>
          {/* Keyed by mode so the tab the visitor asked for is the one that opens */}
          <AuthCard key={mode} next={next} initialMode={mode} />
        </div>
      )}
    </dialog>
  );
}
