import { Types } from "mongoose";
import { NextResponse } from "next/server";
import ProjectModel from "@/src/app/models/Project";
import TestSuiteModel from "@/src/app/models/TestSuite";
import { connectDB } from "@/src/lib/mongodb";
import { getCurrentUser, type CurrentUser } from "./session";

export const SIGN_IN_ERROR = "Please sign in again.";
export const NOT_FOUND_ERROR = "This item no longer exists.";

// Another user's project looks the same as one that does not exist.
export async function ownedProject(user: CurrentUser, projectId: string) {
  if (!Types.ObjectId.isValid(projectId)) return null;
  await connectDB();
  return ProjectModel.findOne({ _id: projectId, ownerId: user.id }).lean<{
    _id: Types.ObjectId;
    name: string;
    description?: string;
    createdAt?: Date;
  } | null>();
}

export async function ownedSuite(user: CurrentUser, suiteId: string) {
  if (!Types.ObjectId.isValid(suiteId)) return null;
  await connectDB();
  const suite = await TestSuiteModel.findById(suiteId);
  if (!suite) return null;
  return (await ownedProject(user, String(suite.projectId))) ? suite : null;
}

export async function ownedProjectIds(user: CurrentUser) {
  await connectDB();
  const projects = await ProjectModel.find({ ownerId: user.id }, { _id: 1 }).lean<{ _id: Types.ObjectId }[]>();
  return projects.map((project) => project._id.toString());
}

// Projects made before sign in existed go to the account named in OWNER_EMAIL.
export async function claimOwnerlessProjects(user: CurrentUser) {
  const owner = process.env.OWNER_EMAIL?.trim().toLowerCase();
  if (!owner || owner !== user.email) return 0;
  await connectDB();
  const result = await ProjectModel.updateMany(
    { $or: [{ ownerId: { $exists: false } }, { ownerId: null }] },
    { ownerId: user.id },
  );
  return result.modifiedCount;
}

// For API routes: the signed in user, or the response to send back.
export async function apiUser(): Promise<{ user: CurrentUser } | { response: NextResponse }> {
  const user = await getCurrentUser();
  return user ? { user } : { response: NextResponse.json({ error: SIGN_IN_ERROR }, { status: 401 }) };
}

export const notFound = () => NextResponse.json({ error: NOT_FOUND_ERROR }, { status: 404 });

// Suites store projectId as text, but match both forms in case an older row holds an ObjectId.
export const projectIdIn = (ids: string[]) => ({
  $in: [...ids, ...ids.filter((id) => Types.ObjectId.isValid(id)).map((id) => new Types.ObjectId(id))],
});

export { getCurrentUser };
