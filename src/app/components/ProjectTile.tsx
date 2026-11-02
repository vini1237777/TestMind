import { initials, pick } from "../lib/format";

// Solid, saturated colours so projects are easy to tell apart. Each project keeps its colour.
const TILES = [
  "bg-amber-400 text-black",
  "bg-orange-500 text-white",
  "bg-rose-500 text-white",
  "bg-fuchsia-600 text-white",
  "bg-violet-600 text-white",
  "bg-blue-600 text-white",
  "bg-sky-500 text-white",
  "bg-teal-500 text-white",
  "bg-emerald-600 text-white",
  "bg-lime-400 text-black",
] as const;

/** Project initials on a tilted tile, the same shape as the TM logo. Tips the other way when its card is hovered. */
export default function ProjectTile({ name, id, size = "h-10 w-10 text-sm" }: { name: string; id?: string; size?: string }) {
  const colour = name ? pick(id || name, TILES) : "bg-gray-200 text-gray-500 dark:bg-gray-700 dark:text-gray-300";
  return (
    <span
      aria-hidden
      className={`grid shrink-0 -rotate-3 place-items-center rounded-lg font-black tracking-tight shadow-sm transition-transform duration-300 group-hover:rotate-3 ${colour} ${size}`}
    >
      {name ? initials(name) : "?"}
    </span>
  );
}
