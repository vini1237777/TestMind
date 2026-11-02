import FailedTest from "./components/FailedTest";

export default function NotFound() {
  return (
    <FailedTest
      code="TC_404"
      title="This route should exist"
      expected="A page at this address"
      received="Nothing. The route is not defined."
      hint="The link may be old, or the project was removed. Head back home or open the workspace."
    />
  );
}
