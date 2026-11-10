"use client";

import { useEffect, useId, useRef, useState } from "react";
import { fieldClass, labelClass } from "./Modal";

type Mode = "signin" | "signup";
type Field = "email" | "password";

const MIN_PASSWORD = 8;

// Only a path inside this site, so a crafted link cannot send someone elsewhere after sign in.
export function safeNext(next?: string | null) {
  return next && next.startsWith("/") && !next.startsWith("//") && !next.startsWith("/\\") ? next : "/projects";
}

export async function signOut() {
  await fetch("/api/auth/logout", { method: "POST" }).catch(() => null);
  window.location.assign("/");
}

export type AuthMode = "signin" | "signup";

/** Sign in and create account in one form, with errors shown under each field. */
export default function AuthCard({ next, initialMode = "signin" }: { next?: string | null; initialMode?: AuthMode }) {
  const id = useId();
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const [mode, setMode] = useState<Mode>(initialMode);
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<{ text: string; field?: Field } | null>(null);

  useEffect(() => {
    emailRef.current?.focus();
  }, []);

  const switchTo = (next: Mode) => {
    setMode(next);
    setError(null);
  };

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const body = { email: String(form.get("email") ?? "").trim(), password: String(form.get("password") ?? "") };

    // The same checks the server runs, so most mistakes show without a round trip.
    if (!body.email) return fail({ text: "Enter your email.", field: "email" });
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email)) return fail({ text: "Enter an email like name@example.com.", field: "email" });
    if (!body.password) return fail({ text: "Enter your password.", field: "password" });
    if (mode === "signup" && body.password.length < MIN_PASSWORD) {
      return fail({ text: `Use at least ${MIN_PASSWORD} characters.`, field: "password" });
    }

    setBusy(true);
    setError(null);
    try {
      const res = await fetch(mode === "signup" ? "/api/auth/signup" : "/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const text =
          res.status === 429 ? "Too many tries. Wait a minute, then try again." : data.error || "Something went wrong. Please try again.";
        return fail({ text, field: data.field });
      }
      // A full load, not router.push: the router may hold the signed out redirect it
      // prefetched for /projects, and the navbar needs the new session too.
      window.location.assign(safeNext(next));
    } catch {
      fail({ text: "Could not reach TestMind. Check your connection and try again." });
    }
  };

  function fail(next: { text: string; field?: Field }) {
    setBusy(false);
    setError(next);
    (next.field === "password" ? passwordRef : emailRef).current?.focus();
  }

  const fieldError = (field: Field) => (error?.field === field ? error.text : null);
  const errorId = (field: Field) => `${id}-${field}-error`;
  const tab = (value: Mode, label: string) => (
    <button
      type="button"
      role="tab"
      aria-selected={mode === value}
      onClick={() => switchTo(value)}
      className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
        mode === value ? "bg-black text-amber-300 dark:bg-amber-400 dark:text-black" : "text-gray-600 hover:text-black dark:text-gray-300 dark:hover:text-white"
      }`}
    >
      {label}
    </button>
  );

  return (
    <div>
      <div role="tablist" aria-label="Sign in or create an account" className="flex gap-1 rounded-lg bg-gray-100 p-1 dark:bg-slate-800">
        {tab("signin", "Sign in")}
        {tab("signup", "Create account")}
      </div>

      <p className="mt-4 text-sm text-gray-600 dark:text-gray-300">
        {mode === "signin" ? "Welcome back. Your projects are where you left them." : "Free to use. Only you can see the projects you make."}
      </p>

      <form onSubmit={submit} noValidate className="mt-4 space-y-4">
        <div>
          <label htmlFor={`${id}-email`} className={labelClass}>
            Email
          </label>
          <input
            ref={emailRef}
            id={`${id}-email`}
            name="email"
            type="email"
            autoComplete="email"
            inputMode="email"
            placeholder="you@company.com"
            aria-invalid={Boolean(fieldError("email"))}
            aria-describedby={fieldError("email") ? errorId("email") : undefined}
            onChange={() => error?.field === "email" && setError(null)}
            className={`${fieldClass} ${fieldError("email") ? "border-red-500 focus:border-red-500 focus:ring-red-500/15" : ""}`}
          />
          {fieldError("email") && (
            <p id={errorId("email")} className="mt-1.5 text-xs text-red-600 dark:text-red-400">
              {fieldError("email")}
            </p>
          )}
        </div>

        <div>
          <div className="flex items-baseline justify-between">
            <label htmlFor={`${id}-password`} className={labelClass}>
              Password
            </label>
            {mode === "signup" && <span className="text-[11px] text-gray-500">At least {MIN_PASSWORD} characters</span>}
          </div>
          <div className="relative">
            <input
              ref={passwordRef}
              id={`${id}-password`}
              name="password"
              type={show ? "text" : "password"}
              autoComplete={mode === "signup" ? "new-password" : "current-password"}
              aria-invalid={Boolean(fieldError("password"))}
              aria-describedby={fieldError("password") ? errorId("password") : undefined}
              onChange={() => error?.field === "password" && setError(null)}
              className={`${fieldClass} pr-16 ${fieldError("password") ? "border-red-500 focus:border-red-500 focus:ring-red-500/15" : ""}`}
            />
            <button
              type="button"
              onClick={() => setShow((s) => !s)}
              aria-pressed={show}
              aria-controls={`${id}-password`}
              className="absolute inset-y-1 right-1 rounded px-2.5 text-xs font-medium text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
            >
              {show ? "Hide" : "Show"}
            </button>
          </div>
          {fieldError("password") && (
            <p id={errorId("password")} className="mt-1.5 text-xs text-red-600 dark:text-red-400">
              {fieldError("password")}
            </p>
          )}
        </div>

        {error && !error.field && (
          <p role="alert" className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
            {error.text}
          </p>
        )}
        {/* Field errors are announced too, without moving focus a second time */}
        <p aria-live="polite" className="sr-only">
          {error?.field ? error.text : ""}
        </p>

        <button
          type="submit"
          disabled={busy}
          className="tm-press w-full rounded-md bg-amber-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-amber-600 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-amber-400 dark:text-black dark:hover:bg-amber-300"
        >
          {busy ? (mode === "signup" ? "Creating your account…" : "Signing in…") : mode === "signup" ? "Create account" : "Sign in"}
        </button>
      </form>

      <p className="mt-4 text-center text-xs text-gray-500">
        {mode === "signin" ? "New here? " : "Already have an account? "}
        <button
          type="button"
          onClick={() => switchTo(mode === "signin" ? "signup" : "signin")}
          className="font-medium text-black underline underline-offset-2 hover:text-amber-700 dark:text-white dark:hover:text-amber-300"
        >
          {mode === "signin" ? "Create an account" : "Sign in"}
        </button>
      </p>
    </div>
  );
}
