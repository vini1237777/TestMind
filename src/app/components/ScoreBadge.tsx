"use client";

import { useEffect, useState } from "react";

export default function ScoreBadge({ score }: { score: number }) {
  // Counts up from 0 so a new score is noticeable.
  const [shown, setShown] = useState(0);
  useEffect(() => {
    let raf = 0;
    const t0 = performance.now();
    const tick = (t: number) => {
      const p = Math.min(1, (t - t0) / 800);
      setShown(Math.round(score * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [score]);

  const color = score > 85 ? "bg-green-500" : score > 60 ? "bg-yellow-500" : "bg-red-500";

  return (
    <div className={`tm-pop w-10 h-10 rounded-full flex items-center justify-center text-white text-xs font-bold ${color}`}>
      {shown}
    </div>
  );
}
