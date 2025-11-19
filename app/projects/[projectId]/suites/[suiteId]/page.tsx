import { SuitePageProps } from "@/app/types/testmind";
import SuiteClient from "./SuiteClient";
import { getSuiteById } from "@/app/actions/suites";

export default async function SuitePage({ params }: SuitePageProps) {
  const suiteId = (await params).suiteId;

  const doc = await getSuiteById(suiteId);

  if (!doc) {
    return <p>Suite not found</p>;
  }

  const suite = {
    id: doc.id.toString(),
    name: doc.name,
    featureName: doc.featureName,
    description: doc.description ?? "",
    projectId: doc.projectId,
    createdAt: doc.createdAt ?? "",
    testCases: (doc.testCases || []).map((tc) => ({
      id: tc.id,
      type: tc.type,
      title: tc.title,
      steps: tc.steps,
      expected: tc.expected,
      samplePayload: tc.samplePayload || {},
    })),
  };

  return (
    <main className="max-w-5xl mx-auto px-4 py-8">
      <SuiteClient feature={suite} />
    </main>
  );
}
