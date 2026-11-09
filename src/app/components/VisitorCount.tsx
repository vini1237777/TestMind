"use client";

import { useEffect, useState } from "react";

export default function VisitorCount() {
  const [visitors, setVisitors] = useState<number | null>(null);

  useEffect(() => {
    fetch("/api/visits", { method: "POST" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => setVisitors(data?.visitors ?? null))
      .catch(() => setVisitors(null));
  }, []);

  if (visitors === null) return null;

  return (
    <p
      className="tm-rise flex items-center gap-2 whitespace-nowrap text-sm max-[359px]:hidden sm:border-l sm:border-black/25 sm:pl-3 font-medium text-black"
      data-testid="visitor-count"
    >
      <span className="sr-only sm:not-sr-only">Profile visits</span>
      <span className="-rotate-2 rounded-lg bg-black px-2 py-0.5 text-[13px] font-black tabular-nums text-amber-300">
        {visitors.toLocaleString("en-IN")}
      </span>
    </p>
  );
}
