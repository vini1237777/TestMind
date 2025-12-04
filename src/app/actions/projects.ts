"use server";

import type { Project } from "@/src/app/types/testmind";
import { connectDB } from "@/src/lib/mongodb";
import { Types } from "mongoose";
import ProjectModel from "@/src/app/models/Project";

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
  await connectDB();

  const docs = await ProjectModel.find()
    .sort({ createdAt: -1 })
    .lean<ProjectDb[]>();

  return docs.map(mapProjectFromDb);
}

export async function getProjectById(id: string): Promise<Project | null> {
  if (!id || id === "undefined") return null;

  await connectDB();

  const doc = await ProjectModel.findById(id).lean<ProjectDb | null>();
  if (!doc) return null;

  return mapProjectFromDb(doc);
}

export async function createProject(data: {
  name: string;
  description?: string;
}): Promise<Project> {
  await connectDB();

  const { name, description } = data;

  if (!name?.trim()) {
    throw new Error("Project name is required.");
  }

  const doc = (await ProjectModel.create({
    name,
    description,
  })) as ProjectDb;

  return mapProjectFromDb(doc);
}
