"use server";

import { connectDB } from "@/src/lib/mongodb";
import ProjectModel from "@/src/app/models/Project";
import TestSuiteModel from "@/src/app/models/TestSuite";
import { EXAMPLE } from "@/src/app/lib/example";

/**
 * Finds the shared example feature, creating it the first time.
 * Reusing one project keeps repeat visits from filling the workspace with copies.
 */
export async function openExample(): Promise<{ projectId: string; suiteId: string; isNew: boolean }> {
  await connectDB();

  const project =
    (await ProjectModel.findOne({ name: EXAMPLE.project })) ??
    (await ProjectModel.create({ name: EXAMPLE.project, description: EXAMPLE.projectDescription }));

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
  return { projectId: project._id.toString(), suiteId: suite._id.toString(), isNew: true };
}
