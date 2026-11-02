"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

// Last resort when the root layout itself fails. It cannot rely on the app's
// CSS or fonts, so it is styled inline in the same amber and ink language.
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="en">
      <body style={{ margin: 0, minHeight: "100vh", display: "grid", placeItems: "center", background: "#fffdf7", color: "#111827", fontFamily: "system-ui, sans-serif", padding: 16 }}>
        <div role="alert" style={{ maxWidth: 520, width: "100%", border: "1.5px solid #111827", borderRadius: 14, boxShadow: "3px 3px 0 #111827", background: "#fff", overflow: "hidden" }}>
          <div style={{ background: "#111827", color: "#fef3c7", padding: "10px 16px", fontFamily: "ui-monospace, monospace", fontSize: 12 }}>1 failed, 0 passed</div>
          <div style={{ padding: 20 }}>
            <p style={{ fontFamily: "ui-monospace, monospace", fontSize: 12, color: "#57534e", margin: 0 }}>TC_000</p>
            <h1 style={{ fontSize: 22, margin: "4px 0 12px" }}>Assertion failed: application root should mount</h1>
            <p style={{ fontSize: 14, color: "#57534e", lineHeight: 1.6 }}>A critical error interrupted the initial load and was logged to Sentry. Trigger a fresh run in a moment.</p>
            {error.digest && <p style={{ fontFamily: "ui-monospace, monospace", fontSize: 11, color: "#a8a29e" }}>trace id {error.digest}</p>}
            <button onClick={reset} style={{ marginTop: 8, height: 38, padding: "0 16px", borderRadius: 10, border: "1.5px solid #111827", background: "#f59e0b", fontWeight: 600, boxShadow: "2px 2px 0 #111827", cursor: "pointer" }}>
              Rerun test
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
