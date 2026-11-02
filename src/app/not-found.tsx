import FailedTest from "./components/FailedTest";

export default function NotFound() {
  return (
    <FailedTest
      code="TC_404"
      title="Assertion failed: route should resolve"
      expected="A valid application view at this URL"
      received="404 Not Found. Undefined route."
      hint="The requested page was moved or removed. Head back to the landing page or jump straight into the workspace."
    />
  );
}
