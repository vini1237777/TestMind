"use client";

import Link from "next/link";
import { useState } from "react";
import { safeNext, signOut } from "./AuthCard";

const primary =
  "tm-press inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-black px-5 text-sm font-semibold text-amber-300 transition-colors hover:bg-slate-800 disabled:cursor-wait disabled:opacity-70 dark:bg-amber-400 dark:text-black dark:hover:bg-amber-300";
const secondary =
  "tm-press inline-flex h-11 items-center justify-center rounded-lg border border-slate-300 bg-white px-5 text-sm font-semibold text-slate-900 transition-colors hover:border-black dark:border-slate-700 dark:bg-transparent dark:text-white dark:hover:border-amber-400";

const ask = (mode: "signin" | "signup") => window.dispatchEvent(new CustomEvent("tm:signin", { detail: mode }));

/** The hero's way in: the shared demo for a quick look, or an account of your own. */
export default function HomeActions({ email, next }: { email: string | null; next: string | null }) {
  const [opening, setOpening] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const openDemo = async () => {
    setOpening(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/demo", { method: "POST" });
      if (!res.ok) throw new Error(res.status === 429 ? "Too many tries. Wait a minute, then try again." : "");
      // A full load, so the navbar and workspace read the new session.
      window.location.assign(safeNext(next));
    } catch (err) {
      setError((err as Error).message || "Could not open the demo. Please try again.");
      setOpening(false);
    }
  };

  if (email) {
    return (
      <div>
        <div className="flex flex-wrap items-center gap-3">
          <Link href={safeNext(next)} className={primary}>
            Open workspace
          </Link>
        </div>
        <p className="mt-4 text-sm text-slate-500">
          Signed in as <span className="font-medium text-slate-800 dark:text-slate-200">{email}</span>.{" "}
          <button type="button" onClick={signOut} className="underline underline-offset-2 hover:text-black dark:hover:text-white">
            Sign out
          </button>
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3">
        <button type="button" onClick={openDemo} disabled={opening} className={primary}>
          {opening && <span aria-hidden className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />}
          {opening ? "Opening the demo" : "Try the demo"}
        </button>
        <button type="button" onClick={() => ask("signup")} className={secondary}>
          Create account
        </button>
      </div>
      {error ? (
        <p role="alert" className="mt-4 text-sm text-red-600 dark:text-red-400">
          {error}
        </p>
      ) : (
        <p className="mt-4 text-sm text-slate-500">
          The demo needs no sign up.{" "}
          <span className="whitespace-nowrap">
            Have an account?{" "}
            <button type="button" onClick={() => ask("signin")} className="font-medium text-slate-900 underline underline-offset-2 hover:text-amber-700 dark:text-white dark:hover:text-amber-300">
              Sign in
            </button>
          </span>
        </p>
      )}
    </div>
  );
}
