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
      title="Assertion failed: page should render cleanly"
      expected="An interactive workspace view"
      received={error.message ? `${error.name}: ${error.message}` : "An unexpected error"}
      hint="An unhandled exception occurred and was sent to Sentry. Retrying usually resolves a slow first connection to the database."
      digest={error.digest}
      onRetry={reset}
    />
  );
}
