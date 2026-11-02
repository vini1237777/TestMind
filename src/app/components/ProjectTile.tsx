import { initials, pick } from "../lib/format";

// One warm family that sits with the amber navbar, plus deep teal as the single contrast.
// Letters stay in amber tones so every tile reads as part of the same set. Each project keeps its colour.
const TILES = [
  "bg-black text-amber-300",
  "bg-amber-400 text-black",
  "bg-orange-600 text-amber-50",
  "bg-red-800 text-amber-200",
  "bg-amber-800 text-amber-100",
  "bg-teal-800 text-amber-200",
  "bg-yellow-300 text-black",
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
