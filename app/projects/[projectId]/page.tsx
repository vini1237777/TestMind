import { notFound } from "next/navigation";
import { ProjectPageProps, TestSuite } from "@/app/types/testmind";

const suites: TestSuite[] = [
  {
    id: "s1",
    projectId: "checkout",
    name: "Apply discount coupon",
    featureName: "Apply discount coupon at checkout",
    description: "User applies a valid coupon on the checkout page.",
    createdAt: new Date().toISOString(),
    testCases: [],
  },
  {
    id: "s2",
    projectId: "checkout",
    name: "Guest checkout",
    featureName: "Guest user can checkout without account",
    description: "Guest user completes purchase without logging in.",
    createdAt: new Date().toISOString(),
    testCases: [],
  },
  {
    id: "s3",
    projectId: "onboarding",
    name: "Signup with OTP",
    featureName: "User can sign up using mobile OTP",
    description: "Signup flow with OTP verification.",
    createdAt: new Date().toISOString(),
    testCases: [],
  },
];

const projects = [
  {
    id: "checkout",
    name: "Checkout Service",
    description: "All test suites for cart, payments, and discounts.",
  },
  {
    id: "onboarding",
    name: "User Onboarding",
    description: "Signup, login, OTP, and KYC flows.",
  },
];

export default async function ProjectPage({ params }: ProjectPageProps) {
  const { projectId } = await params;
  const project = projects.find((p) => p.id === projectId);

  if (!project) {
    return notFound();
  }

  const projectSuites = suites.filter(
    (suite) => suite.projectId === project.id
  );

  return (
    <main className="max-w-5xl mx-auto px-4 py-8">
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{project.name}</h1>
          <p className="text-sm text-gray-500 max-w-xl">
            {project.description}
          </p>
        </div>
        <button className="text-xs px-3 py-2 rounded bg-amber-500 text-white">
          + New Feature / Test Suite
        </button>
      </header>

      <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {projectSuites.length === 0 ? (
          <p className="text-sm text-gray-500">
            No test suites yet for this project.
          </p>
        ) : (
          projectSuites.map((suite) => (
            <article
              key={suite.id}
              className="border rounded p-4 shadow-sm text-sm"
            >
              <h2 className="font-semibold mb-1">{suite.featureName}</h2>
              <p className="text-xs text-gray-500 mb-2 line-clamp-2">
                {suite.description}
              </p>
              <p className="text-[11px] text-gray-400 mb-2">
                Created: {new Date(suite.createdAt).toLocaleString()}
              </p>
              <button className="text-xs underline text-amber-700">
                View test cases
              </button>
            </article>
          ))
        )}
      </section>
    </main>
  );
}
