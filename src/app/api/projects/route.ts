import Project from "@/src/app/models/Project";
import { getCache, setCache } from "@/src/lib/cache";
import { connectDB } from "@/src/lib/mongodb";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const cached = await getCache(req.url);

    if (cached) return cached;

    await connectDB();

    const projects = await Project.find().sort({ createdAt: -1 }).lean();

    await setCache(req.url, {
      projects: projects.map((p) => ({
        id: typeof p._id === "string" ? p._id : p._id?.toString(),
        name: p.name,
        description: p.description,
        createdAt: p.createdAt,
      })),
    });

    return NextResponse.json({
      projects: projects.map((p) => ({
        id: typeof p._id === "string" ? p._id : p._id?.toString(),
        name: p.name,
        description: p.description,
        createdAt: p.createdAt,
      })),
    });
  } catch (err) {
    console.error("AI Error:", err);
    return NextResponse.json(
      { error: "Failed to generate test cases." },
      { status: 500 }
    );
  }
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
