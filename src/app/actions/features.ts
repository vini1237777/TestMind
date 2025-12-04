"use server";

import { Types } from "mongoose";
import { Feature } from "../types/testmind";
import { connectDB } from "@/src/lib/mongodb";
import FeatureModel from "../models/Feature";
import { revalidatePath } from "next/cache";

type FeatureDb = {
  _id: Types.ObjectId;
  projectId: Types.ObjectId;
  name: string;
  description?: string;
  createdAt?: Date;
};

function mapFeature(doc: FeatureDb): Feature {
  return {
    id: doc._id.toString(),
    projectId: doc.projectId.toString(),
    name: doc.name,
    description: doc.description ?? "",
    createdAt: doc.createdAt?.toISOString() ?? new Date().toISOString(),
  };
}

export async function createFeature(data: {
  projectId: string;
  name: string;
  description?: string;
}): Promise<Feature> {
  const { projectId, name, description } = data;

  if (!projectId) throw new Error("projectId is required");
  if (!name.trim()) throw new Error("Feature name is required");

  await connectDB();

  const doc = (await FeatureModel.create({
    projectId,
    name,
    description,
  })) as FeatureDb;

  revalidatePath(`/projects/${data.projectId}`);

  return mapFeature(doc);
}

export async function updateFeature(
  id: string,
  data: { name: string; description: string }
) {
  await connectDB();

  const updated = await FeatureModel.findByIdAndUpdate(
    id,
    {
      name: data.name,
      description: data.description,
    },
    { new: true }
  ).lean();

  return updated;
}
