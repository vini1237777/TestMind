"use server";

import { connectDB } from "@/src/lib/mongodb";
import ProjectModel from "@/src/app/models/Project";
import TestSuiteModel from "@/src/app/models/TestSuite";
import { EXAMPLE } from "@/src/app/lib/example";
import { clearListCache } from "@/src/lib/cache";
import { getCurrentUser, SIGN_IN_ERROR } from "@/src/lib/auth/access";

/**
 * Finds this user's example feature, creating it the first time.
 * Reusing one project keeps repeat visits from filling the workspace with copies.
 */
export async function openExample(): Promise<
  { projectId: string; suiteId: string; isNew: boolean } | { error: string }
> {
  const user = await getCurrentUser();
  if (!user) return { error: SIGN_IN_ERROR };
  await connectDB();

  const project =
    (await ProjectModel.findOne({ name: EXAMPLE.project, ownerId: user.id })) ??
    (await ProjectModel.create({ name: EXAMPLE.project, description: EXAMPLE.projectDescription, ownerId: user.id }));

  const latest = await TestSuiteModel.findOne({ projectId: project._id, featureName: EXAMPLE.feature }).sort({ createdAt: -1 });
  if (latest) {
    return { projectId: project._id.toString(), suiteId: latest._id.toString(), isNew: (latest.testCases?.length ?? 0) === 0 };
  }

  const suite = await TestSuiteModel.create({
    projectId: project._id,
    name: EXAMPLE.feature,
    featureName: EXAMPLE.feature,
    description: EXAMPLE.description,
    testCases: [],
  });
  await clearListCache();
  return { projectId: project._id.toString(), suiteId: suite._id.toString(), isNew: true };
}
