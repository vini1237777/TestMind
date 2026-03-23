"use client";

import * as Sentry from "@sentry/nextjs";

export default function SentryTestButton() {
  return (
    <button
      onClick={() => {
        Sentry.captureException(new Error("TestMind Sentry test error"));
      }}
    >
      Trigger Sentry Test Error
    </button>
  );
}