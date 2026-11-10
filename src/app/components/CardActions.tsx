"use client";

import { FiEdit2, FiTrash2 } from "react-icons/fi";

/**
 * Edit and delete for a card or row. They sit beside the link, not inside it, so a click
 * never opens the item. Devices with a mouse see them on hover or keyboard focus; touch
 * screens always see them, since there is no hover.
 */
export default function CardActions({ label, onEdit, onDelete, className = "" }: {
  label: string;
  onEdit: () => void;
  onDelete: () => void;
  className?: string;
}) {
  const base =
    "grid h-8 w-8 place-items-center rounded-md border border-transparent text-gray-500 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500";
  return (
    <div
      className={`flex items-center gap-0.5 transition-opacity [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-hover:opacity-100 [@media(hover:hover)]:group-focus-within:opacity-100 ${className}`}
    >
      <button
        type="button"
        onClick={onEdit}
        aria-label={`Edit ${label}`}
        title="Edit"
        className={`${base} hover:border-black hover:bg-amber-300 hover:text-black dark:hover:border-amber-400`}
      >
        <FiEdit2 aria-hidden className="h-3.5 w-3.5" />
      </button>
      <button
        type="button"
        onClick={onDelete}
        aria-label={`Delete ${label}`}
        title="Delete"
        className={`${base} hover:border-red-600 hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-950 dark:hover:text-red-400`}
      >
        <FiTrash2 aria-hidden className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
