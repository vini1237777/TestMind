import ProjectPageClient from "./ProjectPageClient";
import { ProjectPageProps, TestCase } from "@/app/types/testmind";
import { getProjectById } from "@/app/actions/projects";
import { getSuitesByProject } from "@/app/actions/suites";

export default async function ProjectPage({ params }: ProjectPageProps) {
  const projectId = (await params).projectId;

  const projectDoc = await getProjectById(projectId);

  const suiteDocs = await getSuitesByProject(projectId);

  const singleProjectDoc = Array.isArray(projectDoc)
    ? projectDoc[0]
    : projectDoc;

  const project = {
    id: singleProjectDoc?.id?.toString() ?? "",
    name: singleProjectDoc?.name ?? "",
    description: singleProjectDoc?.description ?? "",
    createdAt: singleProjectDoc?.createdAt?.toISOString?.() ?? "",
  };

  const suites = suiteDocs.map((s) => ({
    id: s?.id ?? "",
    name: s?.name ?? "",
    featureName: s?.featureName ?? "",
    description: s?.description ?? "",
    projectId: s?.projectId ?? "",
    createdAt: s?.createdAt ?? "",
    testCases: (s?.testCases || []).map((tc: TestCase) => ({
      id: tc?.id ?? "",
      type: tc?.type ?? "",
      title: tc?.title ?? "",
      steps: tc?.steps ?? [],
      expected: tc?.expected ?? "",
      samplePayload: tc?.samplePayload || {},
    })),
  }));

  return (
    <main className="max-w-5xl mx-auto px-4 py-8">
      <ProjectPageClient project={project} suites={suites} />
    </main>
  );
}
