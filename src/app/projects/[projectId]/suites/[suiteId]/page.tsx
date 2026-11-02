import { SuitePageProps } from "@/src/app/types/testmind";
import SuiteClient from "./SuiteClient";
import { Page } from "@/src/app/components/shell/AppShell";
import FailedTest from "@/src/app/components/FailedTest";
import { getSuiteById } from "@/src/app/actions/suites";

export const revalidate = 60;

export default async function SuitePage({ params }: SuitePageProps) {
  const suiteId = (await params).suiteId;

  const doc = await getSuiteById(suiteId);

  if (!doc) {
    return (
      <FailedTest code="TC_404" title="This suite should exist" expected="A saved test suite" received="No suite with this id" hint="It may have been deleted. Go back to the project to see its suites." />
    );
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
    <Page>
      <SuiteClient feature={suite} />
    </Page>
  );
}
