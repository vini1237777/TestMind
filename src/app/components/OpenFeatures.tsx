"use client";

import type { ReactNode } from "react";
import type { FeaturesTab } from "./FeaturesModal";

/** Opens the Features modal (owned by the navbar) on a given tab. */
export default function OpenFeatures({ tab = "tour", className, children }: { tab?: FeaturesTab; className?: string; children: ReactNode }) {
  return (
    <button type="button" className={className} onClick={() => window.dispatchEvent(new CustomEvent("tm:features", { detail: tab }))}>
      {children}
    </button>
  );
}
