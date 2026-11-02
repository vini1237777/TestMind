/** Plain words for case types, so the UI reads like a test plan, not a tag cloud. */
export function caseLabel(type: unknown): string {
  const t = String(type || "").toLowerCase();
  return t === "happy" ? "Happy path" : t === "negative" ? "Negative" : t === "edge" ? "Edge case" : t;
}
