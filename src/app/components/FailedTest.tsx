"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { FiRefreshCw, FiX } from "react-icons/fi";

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
 * TestMind's fallback UI. When something breaks, the app reports it the way
 * it reports everything else: as a test case with an expected and a received value.
 */
export default function FailedTest({ code, title, expected, received, hint, digest, onRetry, compact }: Props) {
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    const t0 = performance.now();
    const id = setInterval(() => setElapsed(Math.round(performance.now() - t0)), 47);
    const stop = setTimeout(() => clearInterval(id), 900);
    return () => {
      clearInterval(id);
      clearTimeout(stop);
    };
  }, []);

  return (
    <div className={`mx-auto w-full ${compact ? "max-w-none" : "max-w-[620px] px-4 py-16 sm:py-24"}`}>
      {!compact && (
        <p aria-hidden className="font-display select-none text-center text-[96px] font-extrabold leading-none text-accent sm:text-[140px]">
          {code.replace("TC_", "")}
        </p>
      )}

      <div role="alert" className="panel animate-shake mt-6 overflow-hidden">
        <div className="flex items-center justify-between gap-3 border-b-[1.5px] border-fg bg-[#111827] px-4 py-2.5 font-mono text-[12px] text-[#fef3c7] dark:border-line-strong">
          <span className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#f87171] opacity-75" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-[#f87171]" />
            </span>
            1 failed · 0 passed
          </span>
          <span className="text-white/60">{elapsed}ms</span>
        </div>

        <div className="p-5">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-md bg-negative text-white"><FiX /></span>
            <div className="min-w-0">
              <p className="font-mono text-[12px] text-muted">{code}</p>
              <h1 className="font-display text-[22px] font-extrabold leading-tight">{title}</h1>
            </div>
          </div>

          <dl className="mt-5 grid gap-2 font-mono text-[12.5px]">
            <div className="rounded-lg border border-happy/40 bg-happy/10 px-3 py-2">
              <dt className="text-happy">expected</dt>
              <dd className="mt-0.5 text-fg">{expected}</dd>
            </div>
            <div className="rounded-lg border border-negative/40 bg-negative/10 px-3 py-2">
              <dt className="text-negative">received</dt>
              <dd className="mt-0.5 break-words text-fg">{received}</dd>
            </div>
          </dl>

          <p className="mt-4 text-[14px] leading-relaxed text-muted">{hint}</p>
          {digest && <p className="mt-2 font-mono text-[11px] text-faint">trace id {digest}</p>}

          <div className="mt-5 flex flex-wrap gap-2">
            {onRetry && (
              <button type="button" className="btn btn-primary" onClick={onRetry}>
                <FiRefreshCw /> Rerun test
              </button>
            )}
            {!compact && (
              <>
                <Link href="/" className="btn">Back to home</Link>
                <Link href="/architecture" className="btn btn-ghost">How TestMind works</Link>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
