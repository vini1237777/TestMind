import { typeCounts } from "../lib/export-playwright";

// Amber shades that sit with the theme, rather than a traffic light
const COLORS = { happy: "bg-amber-300", negative: "bg-amber-500", edge: "bg-amber-700" } as const;

/**
 * Stacked bar of happy, negative and edge cases. A suite heavy on happy paths
 * shows it at a glance.
 */
type Counts = { happy: number; negative: number; edge: number };

export default function TypeBar({ cases, counts, showLegend = false }: { cases?: { type: unknown }[]; counts?: Counts; showLegend?: boolean }) {
  const c = counts ?? typeCounts(cases ?? []);
  const total = c.happy + c.negative + c.edge;
  return (
    <div>
      <div className="flex h-1.5 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800" role="img" aria-label={`${c.happy} happy, ${c.negative} negative, ${c.edge} edge`}>
        {total > 0 &&
          (Object.keys(COLORS) as (keyof typeof COLORS)[]).map((k) =>
            c[k] ? <div key={k} className={`${COLORS[k]} transition-[width] duration-500`} style={{ width: `${(c[k] / total) * 100}%` }} /> : null,
          )}
      </div>
      {showLegend && (
        <div className="mt-1.5 flex flex-wrap gap-3 text-[11px] text-gray-500">
          {(Object.keys(COLORS) as (keyof typeof COLORS)[]).map((k) => (
            <span key={k} className="flex items-center gap-1">
              <span className={`h-2 w-2 rounded-full ${COLORS[k]}`} />
              {c[k]} {k === "happy" ? "happy path" : k === "edge" ? "edge case" : "negative"}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
