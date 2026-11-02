import type React from "react";

// Loading placeholders shaped like the real pages, so nothing jumps when data arrives.

export function Bone({ className = "", style }: { className?: string; style?: React.CSSProperties }) {
  return <span aria-hidden className={`tm-bone block ${className}`} style={style} />;
}

/** Same layout as ProjectCard: tile, name and date, two lines of description, numbers, case mix strip. */
export function ProjectCardsSkeleton({ count = 9 }: { count?: number }) {
  return (
    <section aria-busy="true" aria-label="Loading projects" className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex flex-col overflow-hidden rounded-lg border border-gray-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900" style={{ opacity: 1 - i * 0.07 }}>
          <div className="flex items-center gap-3">
            <Bone className="h-10 w-10 -rotate-3 rounded-lg" />
            <div className="flex-1 space-y-1.5">
              <Bone className="h-3.5 w-1/2" />
              <Bone className="h-2.5 w-1/4" />
            </div>
          </div>
          <Bone className="mt-4 h-3 w-full" />
          <Bone className="mt-2 h-3 w-4/5" />
          <div className="mt-5 flex justify-between">
            <Bone className="h-2.5 w-1/3" />
            <Bone className="h-2.5 w-10" />
          </div>
          <Bone className="-mx-4 -mb-4 mt-3 h-1 rounded-none" />
        </div>
      ))}
    </section>
  );
}

export function ProjectsPageSkeleton() {
  return (
    <main className="mx-4 max-w-full px-4 py-8">
      <div className="mb-6 flex items-end justify-between gap-4">
        <div className="space-y-2">
          <Bone className="h-7 w-36" />
          <Bone className="h-3.5 w-64" />
        </div>
        <Bone className="h-9 w-28 rounded" />
      </div>
      <div className="mb-5 flex gap-2">
        <Bone className="h-9 w-full max-w-sm rounded" />
        <Bone className="h-9 w-32 rounded" />
      </div>
      <ProjectCardsSkeleton />
    </main>
  );
}

/** Panel with the real amber header so the page frame is there straight away. */
function Panel({ title, children, right }: { title: string; children: React.ReactNode; right?: React.ReactNode }) {
  return (
    <div className="border border-amber-300 dark:border-amber-500/40">
      <div className="flex min-h-10 items-center justify-between bg-amber-300 px-3 py-1.5 text-sm font-semibold text-black">
        {title}
        {right}
      </div>
      {children}
    </div>
  );
}

export function CaseRowsSkeleton({ rows = 7 }: { rows?: number }) {
  return (
    <div aria-busy="true" aria-label="Loading test cases" className="px-3 pb-2 pt-3">
      <Bone className="h-1.5 w-full rounded-full" />
      <div className="mt-3 flex gap-2 border-b pb-3 dark:border-gray-700">
        {[14, 20, 18, 18].map((w, i) => (
          <Bone key={i} className="h-6 rounded-md" style={{ width: `${w * 4}px` } as React.CSSProperties} />
        ))}
      </div>
      <ul className="divide-y dark:divide-gray-700">
        {Array.from({ length: rows }).map((_, i) => (
          <li key={i} className="flex items-center gap-3 px-1 py-3">
            <Bone className="h-3 w-5" />
            <Bone className="h-3.5" style={{ width: `${70 - ((i * 13) % 30)}%` } as React.CSSProperties} />
            <Bone className="ml-auto h-3 w-16" />
          </li>
        ))}
      </ul>
    </div>
  );
}

export function ReviewSkeleton() {
  return (
    <div aria-hidden className="space-y-2.5">
      <Bone className="h-4 w-4/5" />
      <Bone className="h-3 w-full" />
      <Bone className="h-3 w-11/12" />
      <Bone className="mt-4 h-8 w-full rounded" />
    </div>
  );
}

export function SuitePageSkeleton() {
  return (
    <main className="mx-4 max-w-full px-4 py-8">
      <div className="mx-auto max-w-6xl">
        <Bone className="h-3 w-56" />
        <div className="mt-4 max-w-3xl space-y-3">
          <Bone className="h-8 w-64" />
          <Bone className="h-3 w-40" />
          <Bone className="h-24 w-full rounded" />
        </div>
        <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
          <Panel title="Test cases">
            <CaseRowsSkeleton />
          </Panel>
          <div className="lg:self-start">
            <Panel title="Review">
              <div className="p-4">
                <ReviewSkeleton />
              </div>
            </Panel>
          </div>
        </div>
      </div>
    </main>
  );
}

export function ProjectPageSkeleton() {
  return (
    <main className="mx-4 max-w-full px-4 py-8">
      <Bone className="h-3 w-40" />
      <div className="mb-6 mt-4 flex items-end justify-between gap-4">
        <div className="space-y-2">
          <Bone className="h-7 w-56" />
          <Bone className="h-3.5 w-80" />
        </div>
        <Bone className="h-9 w-28 rounded" />
      </div>
      <div className="border border-amber-300 dark:border-amber-500/40">
        <div className="hidden grid-cols-[minmax(0,1fr)_160px_80px_90px_120px] gap-4 bg-amber-300 px-4 py-2 text-xs font-semibold text-black md:grid">
          <span>Feature</span>
          <span>Case mix</span>
          <span className="text-right">Cases</span>
          <span className="text-right">Score</span>
          <span className="text-right">Updated</span>
        </div>
        <ul className="divide-y dark:divide-slate-800">
          {Array.from({ length: 4 }).map((_, i) => (
            <li key={i} className="grid grid-cols-1 gap-2 px-4 py-3.5 md:grid-cols-[minmax(0,1fr)_160px_80px_90px_120px] md:items-center md:gap-4">
              <span className="space-y-1.5">
                <Bone className="h-3.5 w-1/3" />
                <Bone className="h-2.5 w-2/3" />
              </span>
              <Bone className="hidden h-1.5 rounded-full md:block" />
              <Bone className="ml-auto hidden h-3 w-6 md:block" />
              <Bone className="ml-auto hidden h-3 w-12 md:block" />
              <Bone className="ml-auto hidden h-3 w-16 md:block" />
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}
