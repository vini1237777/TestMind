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
    <p className="mt-2 text-xs text-gray-500" data-testid="visitor-count">
      {visitors.toLocaleString("en-IN")} {visitors === 1 ? "visitor" : "visitors"}
    </p>
  );
}
