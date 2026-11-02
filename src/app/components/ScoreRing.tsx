/** Small circular gauge for a 0 to 100 review score. */
export default function ScoreRing({ score, size = 44 }: { score: number | null; size?: number }) {
  const r = (size - 6) / 2;
  const c = 2 * Math.PI * r;
  const has = typeof score === "number";
  const pct = has ? Math.max(0, Math.min(100, score)) / 100 : 0;
  const color = !has ? "#d1d5db" : score >= 80 ? "#16a34a" : score >= 60 ? "#f59e0b" : "#dc2626";
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }} title={has ? `Average review score ${score}/100` : "Not reviewed yet"}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="currentColor" strokeWidth="4" className="text-gray-100 dark:text-gray-800" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - pct)}
          className="transition-[stroke-dashoffset] duration-700 ease-out"
        />
      </svg>
      <span className="absolute inset-0 grid place-items-center text-[11px] font-semibold">{has ? score : "–"}</span>
    </div>
  );
}
