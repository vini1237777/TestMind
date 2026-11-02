import { initials } from "../lib/format";

/** Project initials on a tilted black tile, the same shape as the TM logo. Tips the other way when its card is hovered. */
export default function ProjectTile({ name, size = "h-10 w-10 text-sm" }: { name: string; size?: string }) {
  return (
    <span
      aria-hidden
      className={`grid shrink-0 -rotate-3 place-items-center rounded-lg bg-black font-black tracking-tight text-amber-300 transition-transform duration-300 group-hover:rotate-3 dark:bg-amber-400 dark:text-black ${size}`}
    >
      {name ? initials(name) : "?"}
    </span>
  );
}
