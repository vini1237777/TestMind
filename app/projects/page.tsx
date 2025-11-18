import Link from "next/link";
import { Project } from "../types/testmind";

const projects: Project[] = [
  {
    id: "checkout",
    name: "Checkout Service",
    description: "All test suites for cart, payments, and discounts.",
    createdAt: new Date().toISOString(),
  },
  {
    id: "onboarding",
    name: "User Onboarding",
    description: "Signup, login, OTP, and KYC flows.",
    createdAt: new Date().toISOString(),
  },
];

export default function ProjectsPage() {
  return (
    <main className="max-w-5xl mx-auto px-4 py-8">
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Projects</h1>
          <p className="text-sm text-gray-500">
            Select a project to view its AI-generated test suites.
          </p>
        </div>

        <button className="text-xs px-3 py-2 rounded bg-amber-500 text-white">
          + New Project
        </button>
      </header>

      <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {projects.map((project) => (
          <Link
            key={project.id}
            href={`/projects/${project.id}`}
            className="border rounded p-4 shadow-sm hover:shadow-md transition text-sm"
          >
            <h2 className="font-semibold mb-1">{project.name}</h2>
            <p className="text-xs text-gray-500 mb-2 line-clamp-2">
              {project.description}
            </p>
            <p className="text-[11px] text-gray-400">
              Created: {new Date(project.createdAt).toLocaleString()}
            </p>
          </Link>
        ))}
      </section>
    </main>
  );
}
