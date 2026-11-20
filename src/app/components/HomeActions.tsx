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

/**
 * The way in, kept small enough for a footer or a dialog: the demo and sign in,
 * or the workspace when signed in. Shown wherever a visitor might stop reading.
 */
export function WayIn({
  email,
  next = null,
  tone = "dark",
  onLeave,
}: {
  email: string | null;
  next?: string | null;
  tone?: "dark" | "light";
  /** Called before leaving, for example to close a dialog. */
  onLeave?: () => void;
}) {
  const { opening, error, openDemo } = useOpenDemo(next);
  const pill =
    "tm-press inline-flex h-10 items-center justify-center gap-2 whitespace-nowrap rounded-full bg-amber-400 px-5 text-sm font-semibold text-black transition-colors hover:bg-amber-300 disabled:cursor-wait disabled:opacity-70";
  const quiet =
    tone === "dark"
      ? "whitespace-nowrap font-medium text-white underline underline-offset-4 decoration-white/40 hover:decoration-white"
      : "whitespace-nowrap rounded-md px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200/70 dark:text-gray-200 dark:hover:bg-gray-800";

  if (email) {
    return (
      <Link href={safeNext(next)} onClick={onLeave} className={pill}>
        Open workspace
      </Link>
    );
  }

  const signIn = () => {
    onLeave?.();
    // The sign in dialog lives on the home page; elsewhere, go there with it open.
    if (window.location.pathname === "/") ask("signin");
    else window.location.assign(`/?next=${encodeURIComponent(window.location.pathname)}`);
  };

  return (
    <span className="inline-flex flex-wrap items-center gap-x-4 gap-y-2">
      {error && (
        <span role="alert" className="text-sm text-red-500">
          {error}
        </span>
      )}
      <button type="button" onClick={signIn} className={quiet}>
        Sign in
      </button>
      <button type="button" onClick={openDemo} disabled={opening} className={pill}>
        {opening && (
          <span
            aria-hidden
            className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent"
          />
        )}
        {opening ? "Opening the demo" : "Try the demo"}
      </button>
    </span>
  );
}

/**
 * The end of "What happens when you press Generate": one tile that opens the demo,
 * or the workspace when signed in.
 */
export function YourTurn({
  email,
  next,
}: {
  email: string | null;
  next: string | null;
}) {
  const { opening, error, openDemo } = useOpenDemo(next);
  const tile =
    "tm-press flex w-full flex-col items-center justify-center gap-2 rounded-[14px] bg-[#0b0b0c] p-4 text-[16px] font-semibold text-white transition-colors hover:bg-black hover:text-amber-300 disabled:cursor-wait disabled:opacity-70";

  if (email) {
    return (
      <Link href={safeNext(next)} className={tile}>
        Open workspace →
      </Link>
    );
  }
  return (
    <button type="button" onClick={openDemo} disabled={opening} className={tile}>
      {opening ? "Opening the demo" : "Try the demo →"}
      {error && (
        <span role="alert" className="text-[13px] font-normal text-red-300">
          {error}
        </span>
      )}
    </button>
  );
}
