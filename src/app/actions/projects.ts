"use server";

import type { Project } from "@/src/app/types/testmind";
import { connectDB } from "@/src/lib/mongodb";
import { Types } from "mongoose";
import ProjectModel from "@/src/app/models/Project";
import { clearListCache } from "@/src/lib/cache";
import FeatureModel from "@/src/app/models/Feature";
import TestCaseChunk from "@/src/app/models/TestCaseChunk";
import TestSuiteModel from "@/src/app/models/TestSuite";
import { EXAMPLE } from "@/src/app/lib/example";
import { refreshPaths } from "@/src/lib/revalidate";
import { getCurrentUser, ownedProject, SIGN_IN_ERROR } from "@/src/lib/auth/access";
import { DEMO_LOCKED_ERROR } from "@/src/lib/auth/demo";

const NOT_FOUND = "This project no longer exists.";
const EXAMPLE_LOCKED = "The example project cannot be changed.";

type ProjectDb = {
  _id: Types.ObjectId;
  name: string;
  description?: string;
  createdAt?: Date;
};

function mapProjectFromDb(doc: ProjectDb): Project {
  return {
    id: doc._id.toString(),
    name: doc.name,
    description: doc.description ?? "",
    createdAt: doc.createdAt?.toISOString() ?? new Date().toISOString(),
  };
}

export async function getProjects(): Promise<Project[]> {
  const user = await getCurrentUser();
  if (!user) return [];
  await connectDB();

  const docs = await ProjectModel.find({ ownerId: user.id })
    .sort({ createdAt: -1 })
    .lean<ProjectDb[]>();

  return docs.map(mapProjectFromDb);
}

export async function getProjectById(id: string): Promise<Project | null> {
  if (!id || id === "undefined") return null;
  const user = await getCurrentUser();
  if (!user) return null;

  const doc = await ownedProject(user, id);
  if (!doc) return null;

  return mapProjectFromDb(doc);
}

export async function createProject(data: {
  name: string;
  description?: string;
}): Promise<Project> {
  const user = await getCurrentUser();
  if (!user) throw new Error(SIGN_IN_ERROR);
  await connectDB();

  const { name, description } = data;

  if (!name?.trim()) {
    throw new Error("Project name is required.");
  }

  const doc = (await ProjectModel.create({
    name,
    description,
    ownerId: user.id,
  })) as ProjectDb;

  await clearListCache();
  return mapProjectFromDb(doc);
}

// Messages are returned, not thrown, because production hides the message of a thrown error.
export async function updateProject(
  id: string,
  data: { name: string; description?: string },
): Promise<{ project: Project } | { error: string }> {
  const name = data.name?.trim() ?? "";
  const description = data.description?.trim() ?? "";
  if (!name) return { error: "Project name is required." };
  if (name.length > 120 || description.length > 2000) return { error: "Project name or description is too long." };
  const user = await getCurrentUser();
  if (!user) return { error: SIGN_IN_ERROR };
  if (user.demo) return { error: DEMO_LOCKED_ERROR };
  const current = await ownedProject(user, id);
  if (!current) return { error: NOT_FOUND };
  if (current.name === EXAMPLE.project) return { error: EXAMPLE_LOCKED };
  if (name === EXAMPLE.project) return { error: "This name is kept for the example project." };

  const doc = await ProjectModel.findByIdAndUpdate(id, { name, description }, { new: true }).lean<ProjectDb>();
  await clearListCache();
  refreshPaths("/projects", `/projects/${id}`);
  return { project: mapProjectFromDb(doc!) };
}

// Removes the project with its features, suites and retrieval chunks. The project goes
// last, so a failed delete can simply be run again.
export async function deleteProject(
  id: string,
): Promise<{ deleted: { suites: number; cases: number } } | { error: string }> {
  const user = await getCurrentUser();
  if (!user) return { error: SIGN_IN_ERROR };
  if (user.demo) return { error: DEMO_LOCKED_ERROR };
  const current = await ownedProject(user, id);
  if (!current) return { error: NOT_FOUND };
  if (current.name === EXAMPLE.project) return { error: EXAMPLE_LOCKED };

  const suites = await TestSuiteModel.find({ projectId: id }, { testCases: 1 }).lean<
    { testCases?: unknown[] }[]
  >();
  await TestCaseChunk.deleteMany({ projectId: id });
  await TestSuiteModel.deleteMany({ projectId: id });
  await FeatureModel.deleteMany({ projectId: id });
  await ProjectModel.deleteOne({ _id: id });

  await clearListCache();
  refreshPaths("/projects");
  return {
    deleted: {
      suites: suites.length,
      cases: suites.reduce((sum, suite) => sum + (suite.testCases?.length ?? 0), 0),
    },
  };
}
