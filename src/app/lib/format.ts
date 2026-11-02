/** "3 days ago" style time, falling back to a date for anything older than a month. */
export function timeAgo(input: string | Date | null | undefined): string {
  if (!input) return "";
  const d = new Date(input);
  const s = Math.round((Date.now() - d.getTime()) / 1000);
  if (Number.isNaN(s)) return "";
  if (s < 60) return "just now";
  const m = Math.round(s / 60);
  if (m < 60) return `${m} min ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h} h ago`;
  const days = Math.round(h / 24);
  if (days < 30) return days === 1 ? "yesterday" : `${days} days ago`;
  return d.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
}

/** Up to two initials for a monogram tile. */
export function initials(name: string): string {
  const words = name.replace(/[^\p{L}\p{N} ]/gu, " ").split(/\s+/).filter(Boolean);
  if (!words.length) return "?";
  return (words.length === 1 ? words[0].slice(0, 2) : words[0][0] + words[1][0]).toUpperCase();
}

/** Stable pick from a list based on a string, so a project keeps its colour. */
export function pick<T>(key: string, list: readonly T[]): T {
  let h = 0;
  for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) | 0;
  return list[Math.abs(h) % list.length];
}
