"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import toast from "react-hot-toast";
import { openExample } from "../actions/example";

/** Opens the replayed example in the workspace and starts a live run of it. */
export default function RunExample() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  const go = async () => {
    setBusy(true);
    try {
      const opened = await openExample();
      if ("error" in opened) {
        // Signed out: send the visitor to the sign in card next to this button.
        window.dispatchEvent(new CustomEvent("tm:signin"));
        toast("Sign in to run the example.");
        setBusy(false);
        return;
      }
      const { projectId, suiteId, isNew } = opened;
      router.push(`/projects/${projectId}/suites/${suiteId}${isNew ? "?run=1" : ""}`);
    } catch (err) {
      console.error(err);
      toast.error("Could not open the example");
      setBusy(false);
    }
  };

  return (
    <button
      type="button"
      onClick={go}
      disabled={busy}
      className="tm-press rounded-md border border-amber-400 bg-white px-3 py-1.5 text-xs font-medium hover:bg-amber-50 disabled:opacity-60 dark:border-gray-600 dark:bg-gray-900 dark:hover:bg-gray-800"
    >
      {busy ? "Opening…" : "Run this example for real →"}
    </button>
  );
}
