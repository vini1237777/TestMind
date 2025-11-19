import Project from "@/app/models/Project";
import { connectDB } from "@/lib/mongodb";
import { NextResponse } from "next/server";

export async function GET() {
  await connectDB();

  const projects = await Project.find().sort({ createdAt: -1 }).lean();
  return NextResponse.json({
    projects: projects.map((p) => ({
      id: typeof p._id === "string" ? p._id : p._id?.toString(),
      name: p.name,
      description: p.description,
      createdAt: p.createdAt,
    })),
  });
}

export async function POST(req: Request) {
  await connectDB();

  const body = await req.json();
  const { name, description } = body;

  if (!name?.trim()) {
    return NextResponse.json(
      { error: "Project name is required" },
      { status: 400 }
    );
  }

  const project = await Project.create({
    name: name.trim(),
    description: description?.trim() || "",
  });

  return NextResponse.json(
    {
      project: {
        id: project._id.toString(),
        name: project.name,
        description: project.description,
        createdAt: project.createdAt,
      },
    },
    { status: 201 }
  );
}
