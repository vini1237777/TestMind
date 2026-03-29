"use client";

import { useEffect, useRef } from "react";

const TECH_STACK = [
  "Next.js",
  "TypeScript",
  "LangGraph",
  "OpenAI",
  "Redis",
  "Docker",
];

const STATS = [
  { val: "420+", label: "req/s" },
  { val: "250ms", label: "latency" },
  { val: "−60%", label: "deploy time" },
];

const PROBLEMS = [
  {
    icon: "⏱",
    title: "Writing test cases is slow",
    fix: "Generate a full suite in seconds from a plain description",
  },
  {
    icon: "🕳",
    title: "Edge cases get missed",
    fix: "AI surfaces negative & edge scenarios you'd forget to write",
  },
  {
    icon: "📋",
    title: "No consistent format",
    fix: "Every suite follows the same structured format — id, steps, expected",
  },
];

export default function TestMindInfoCard({
  open = true,
  setIsOpen,
}: {
  open?: boolean;
  setIsOpen: (open: boolean) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className="relative top-10 left-2">
      {open && (
        <div
          className="
            absolute left-0 top-full mt-2.5 z-50 w-80
            rounded-[20px] overflow-hidden
            border-[1.5px] border-gray-200 dark:border-gray-700/80
            bg-white dark:bg-gray-900
            shadow-xl shadow-black/8 dark:shadow-black/40
          "
        >
          <div
            className="
              relative px-5 pt-5 pb-4
              bg-amber-50 dark:bg-amber-950/40
              border-b border-amber-100 dark:border-amber-900/50
            "
          >
            <div className="absolute top-4 right-4 flex items-center gap-1.5">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500" />
              </span>
              <span className="text-[11px] font-medium text-green-600 dark:text-green-400">
                Live
              </span>
            </div>

            <p className="text-[11px] font-semibold text-amber-500 dark:text-amber-400 uppercase tracking-widest mb-1.5">
              AI · QA Automation
            </p>
            <h2 className="text-[19px] font-semibold text-gray-900 dark:text-amber-50 leading-tight mb-1.5">
              TestMind
            </h2>
            <p className="text-[13px] text-gray-500 dark:text-amber-200/60 leading-relaxed">
              Turns feature descriptions into structured test suites happy,
              negative & edge cases instantly.
            </p>
          </div>

          <div className="px-5 py-4 space-y-4">
            <div>
              <p className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2.5">
                What it solves
              </p>
              <div className="space-y-2.5">
                {PROBLEMS.map((p) => (
                  <div key={p.title} className="flex gap-3 items-start">
                    <span className="text-base leading-none mt-0.5">
                      {p.icon}
                    </span>
                    <div>
                      <p className="text-[12px] font-medium text-gray-700 dark:text-gray-200 leading-tight">
                        {p.title}
                      </p>
                      <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5 leading-relaxed">
                        {p.fix}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t border-gray-100 dark:border-gray-800" />

            <div className="grid grid-cols-3 gap-2">
              {STATS.map((s) => (
                <div
                  key={s.label}
                  className="rounded-xl bg-gray-50 dark:bg-gray-800/60 px-2 py-2.5 text-center"
                >
                  <p className="text-sm font-semibold text-amber-500 dark:text-amber-400 leading-tight">
                    {s.val}
                  </p>
                  <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5">
                    {s.label}
                  </p>
                </div>
              ))}
            </div>

            <div>
              <p className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">
                Built with
              </p>
              <div className="flex flex-wrap gap-1.5">
                {TECH_STACK.map((tech) => (
                  <span
                    key={tech}
                    className="
                      text-[11px] font-medium px-2.5 py-1 rounded-full
                      bg-gray-100 dark:bg-gray-800
                      border border-gray-200 dark:border-gray-700
                      text-gray-600 dark:text-gray-300
                    "
                  >
                    {tech}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
