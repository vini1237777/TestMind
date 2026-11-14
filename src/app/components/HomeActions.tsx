"use client";

import Link from "next/link";
import { useState } from "react";
import { safeNext, signOut } from "./AuthCard";

const amber =
  "tm-press inline-flex h-12 items-center justify-center gap-2 rounded-full bg-amber-400 px-6 text-[15px] font-semibold text-black transition-colors hover:bg-amber-300 disabled:cursor-wait disabled:opacity-70";
const quietLink =
  "font-medium text-white underline underline-offset-4 decoration-white/40 hover:decoration-white";

const ask = (mode: "signin" | "signup") =>
  window.dispatchEvent(new CustomEvent("tm:signin", { detail: mode }));

/** Signs in to the shared demo account and opens the workspace. */
export function useOpenDemo(next: string | null) {
  const [opening, setOpening] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const openDemo = async () => {
    setOpening(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/demo", { method: "POST" });
      if (!res.ok)
        throw new Error(
          res.status === 429
            ? "Too many tries. Wait a minute, then try again."
            : "",
        );
      // A full load, so the navbar and workspace read the new session.
      window.location.assign(safeNext(next));
    } catch (err) {
      setError(
        (err as Error).message || "Could not open the demo. Please try again.",
      );
      setOpening(false);
    }
  };

  return { opening, error, openDemo };
}

function PlayIcon() {
  return (
    <span
      aria-hidden
      className="grid h-10 w-10 place-items-center rounded-full border-[1.5px] border-white/50"
    >
      <span className="ml-0.5 border-y-[6px] border-l-[10px] border-y-transparent border-l-white" />
    </span>
  );
}

/**
 * The way in, on the dark hero: the shared demo for a quick
 * look, or an account of your own. Signed in, it opens the workspace instead.
 */
export default function HomeActions({
  email,
  next,
}: {
  email: string | null;
  next: string | null;
}) {
  const { opening, error, openDemo } = useOpenDemo(next);

  if (email) {
    return (
      <div>
        <Link href={safeNext(next)} className={amber}>
          Open workspace
        </Link>
        <p className="mt-4 text-sm text-white/70">
          Signed in as <span className="font-medium text-white">{email}</span>.{" "}
          <button type="button" onClick={signOut} className={quietLink}>
            Sign out
          </button>
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-center sm:gap-6">
        <button
          type="button"
          onClick={openDemo}
          disabled={opening}
          className={amber}
        >
          {opening && (
            <span
              aria-hidden
              className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent"
            />
          )}
          {opening ? "Opening the demo" : "Try the demo"}
        </button>
        <a
          href="#overview"
          className="group inline-flex items-center justify-center gap-3 font-medium text-white"
        >
          <PlayIcon />
          <span className="group-hover:underline group-hover:underline-offset-4">
            Watch the 19 second overview
          </span>
        </a>
      </div>
      {error ? (
        <p role="alert" className="mt-4 text-sm text-red-300">
          {error}
        </p>
      ) : (
        <p className="mt-5 text-sm text-white/70">
          A proof of concept on free plans. The demo opens a shared account, no
          sign up needed.{" "}
          <span className="whitespace-nowrap">
            Have an account?{" "}
            <button
              type="button"
              onClick={() => ask("signin")}
              className={quietLink}
            >
              Sign in
            </button>
          </span>
        </p>
      )}
    </div>
  );
}
