"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";
import FailedTest from "./components/FailedTest";

export default function RouteError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <FailedTest
      code="TC_500"
      title="This page should render"
      expected="A working screen"
      received={error.message ? `${error.name}: ${error.message}` : "An unexpected error"}
      hint="Something broke on our side and it has been reported automatically. Rerunning usually fixes a flaky dependency like the database waking up."
      digest={error.digest}
      onRetry={reset}
    />
  );
}
