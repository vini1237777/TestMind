"use client";

import Link from "next/link";
import { createContext, useContext } from "react";

// What the workspace needs to know about who is looking. The server still checks every action.
const ViewerContext = createContext<{ demo: boolean }>({ demo: false });

export function ViewerProvider({ demo, children }: { demo: boolean; children: React.ReactNode }) {
  return (
    <ViewerContext.Provider value={{ demo }}>
      {demo && (
        <div className="border-b border-amber-300 bg-amber-50 px-4 py-2 text-center text-xs text-amber-950 dark:border-amber-500/30 dark:bg-amber-400/10 dark:text-amber-100">
          This is the shared demo account. You can add projects and generate tests, but editing and deleting are turned off.{" "}
          <Link href="/?create=1" className="font-semibold underline underline-offset-2">
            Create your own account
          </Link>
        </div>
      )}
      {children}
    </ViewerContext.Provider>
  );
}

export const useViewer = () => useContext(ViewerContext);
