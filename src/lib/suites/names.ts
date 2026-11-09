import TestSuite from "@/src/app/models/TestSuite";

export const DUPLICATE_FEATURE_ERROR =
  "A feature with this name already exists in this project.";

// "Login" and " login " are one feature. Other projects can use the same name.
export async function isFeatureNameTaken(
  projectId: string,
  name: string,
  ownSuiteId?: string,
) {
  const found = await TestSuite.findOne({
    projectId,
    featureName: name.trim(),
    ...(ownSuiteId ? { _id: { $ne: ownSuiteId } } : {}),
  })
    .collation({ locale: "en", strength: 2 })
    .select("_id")
    .lean();
  return Boolean(found);
}
