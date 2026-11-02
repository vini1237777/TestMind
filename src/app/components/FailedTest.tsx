"use client";

import Link from "next/link";

type Props = {
  code: string;
  title: string;
  expected: string;
  received: string;
  hint: string;
  digest?: string;
  onRetry?: () => void;
  compact?: boolean;
};

/**
 * Fallback UI. When something breaks, TestMind reports it the way it reports
 * everything else: as a failing test case with expected and received values.
 */
export default function FailedTest({ code, title, expected, received, hint, digest, onRetry, compact }: Props) {
  return (
    <div className={compact ? "" : "mx-auto max-w-xl px-4 py-16"}>
      {!compact && <p className="tm-pop text-center text-7xl font-bold text-amber-500" aria-hidden>{code.replace("TC_", "")}</p>}
      <div role="alert" className="tm-shake mt-6 overflow-hidden rounded-lg border shadow-sm dark:border-gray-700">
        <div className="flex items-center gap-2 bg-gray-900 px-4 py-2 text-xs text-amber-50">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500" />
          </span>
          1 failed, 0 passed
        </div>
        <div className="space-y-3 bg-white p-5 text-sm dark:bg-gray-900">
          <div>
            <p className="font-mono text-xs text-gray-500">{code}</p>
            <h1 className="text-lg font-semibold">✖ {title}</h1>
          </div>
          <p className="rounded border border-green-200 bg-green-50 px-3 py-2 text-xs dark:border-green-900 dark:bg-green-950/40">
            <span className="font-semibold text-green-700 dark:text-green-400">Expected: </span>{expected}
          </p>
          <p className="rounded border border-red-200 bg-red-50 px-3 py-2 text-xs dark:border-red-900 dark:bg-red-950/40">
            <span className="font-semibold text-red-700 dark:text-red-400">Received: </span>{received}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">{hint}</p>
          {digest && <p className="font-mono text-[11px] text-gray-400">trace id {digest}</p>}
          <div className="flex flex-wrap gap-2 pt-1">
            {onRetry && (
              <button type="button" onClick={onRetry} className="rounded bg-amber-500 px-3 py-2 text-xs text-white hover:bg-amber-600 dark:bg-gray-200 dark:text-black">
                Rerun test
              </button>
            )}
            {!compact && (
              <>
                <Link href="/projects" className="rounded border px-3 py-2 text-xs hover:bg-gray-50 dark:hover:bg-gray-800">Back to workspace</Link>
                <Link href="/tech" className="rounded px-3 py-2 text-xs underline text-amber-700 dark:text-amber-400">How TestMind is built</Link>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
