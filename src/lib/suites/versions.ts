import type { TestSuite } from "@/src/app/types/testmind";

// The suite a page was opened for is always in the list, even when the list
// comes from a cache older than that suite. Newest first.
export function versionsOf(current: TestSuite, all: TestSuite[]) {
  const sameFeature = all.filter(
    (suite) =>
      suite.projectId === current.projectId &&
      suite.featureName === current.featureName,
  );
  const versions = sameFeature.some((suite) => suite.id === current.id)
    ? sameFeature
    : [current, ...sameFeature];
  return [...versions].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}
