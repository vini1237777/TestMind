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
      <FailedTest code="TC_404" title="Assertion failed: suite record should exist" expected="A persisted test suite document" received="Null lookup for this suite identifier" hint="This suite may have been deleted. Return to the parent project overview to inspect active suites." />
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
