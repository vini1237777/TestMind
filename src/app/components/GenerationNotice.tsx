"use client";

import { useEffect, useState } from "react";

// Shown only while new generations cannot start, so a visitor knows why before trying.
export default function GenerationNotice() {
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/generation-status", { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!cancelled && data && data.available === false) setMessage(data.message);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  if (!message) return null;

  return (
    <p
      role="status"
      className="mt-3 rounded border border-amber-300 bg-amber-50 px-3 py-2 text-xs leading-relaxed text-amber-900 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-200"
    >
      {message}
    </p>
  );
}
