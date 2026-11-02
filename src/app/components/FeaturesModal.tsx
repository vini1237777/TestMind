"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import Modal, { btnGhost, btnPrimary } from "./Modal";
import { FLOW, OPTIMISATIONS, REPO, RESULTS, STACK } from "../lib/tech-info";

// Real screenshots of the app, each with one short caption.
const SLIDES = [
  {
    src: "/tour/describe.png",
    w: 1344,
    h: 944,
    title: "Start with a sentence or two",
    text: "Name the feature and write what it should do, the way you would explain it to a teammate. Limits and error cases are where the useful tests come from, so mention them.",
  },
  {
    src: "/tour/plan.png",
    w: 1856,
    h: 1248,
    title: "Get a test plan you can read",
    text: "Every case has steps and an expected result. The bar shows the mix of normal, failure and edge cases, and the review score tells you how much of the feature is covered.",
  },
  {
    src: "/tour/export.png",
    w: 984,
    h: 442,
    title: "Take it with you",
    text: "Export to Playwright to start automating, CSV for a spreadsheet or test tool, or Markdown to paste into a ticket.",
  },
  {
    src: "/tour/projects.png",
    w: 2496,
    h: 1120,
    title: "Come back to it later",
    text: "Features live inside projects. Search with the / key, sort by score, or open one of your recent suites from the top of the list.",
  },
];

function UnderTheHood() {
  return (
    <div className="tm-tour-next space-y-7 text-sm">
      <section>
        <h3 className="font-semibold">How a run works</h3>
        <p className="mt-0.5 text-xs text-gray-500">Orchestrated with LangGraph.</p>
        <ol className="mt-2 list-decimal space-y-1.5 pl-5 marker:text-gray-400">
          {FLOW.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ol>
      </section>

      <section>
        <h3 className="font-semibold">Tech stack</h3>
        <dl className="mt-2 divide-y rounded-md border">
          {STACK.map((g) => (
            <div key={g.group} className="flex gap-4 px-3 py-2">
              <dt className="w-20 shrink-0 text-gray-500">{g.group}</dt>
              <dd>{g.items.join(", ")}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section>
        <h3 className="font-semibold">What changed after tuning</h3>
        <table className="mt-2 w-full text-left">
          <thead className="text-xs text-gray-500">
            <tr>
              <th className="py-1 font-normal"></th>
              <th className="py-1 font-normal">Before</th>
              <th className="py-1 font-normal">After</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {RESULTS.map((r) => (
              <tr key={r.label}>
                <td className="py-1.5 pr-3">{r.label}</td>
                <td className="py-1.5 pr-3 text-gray-500">{r.was}</td>
                <td className="py-1.5 font-medium">{r.value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section>
        <h3 className="font-semibold">Optimisations</h3>
        <div className="mt-2 grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
          {OPTIMISATIONS.map((g) => (
            <div key={g.group}>
              <p className="mb-1 text-xs text-gray-500">{g.group}</p>
              <ul className="space-y-1">
                {g.items.map(([title, what]) => (
                  <li key={title}>
                    <span>
                      <span className="font-medium">{title}</span> <span className="text-gray-500">{what}</span>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <p className="mt-5 text-xs text-gray-500">
          Details and load test notes are in the{" "}
          <a href={REPO} target="_blank" rel="noreferrer" className="underline hover:text-amber-700">
            GitHub README
          </a>
          .
        </p>
      </section>
    </div>
  );
}

export type FeaturesTab = "tour" | "tech";

/** Mount with a key per open so it always starts fresh on the requested tab. */
export default function FeaturesModal({ open, onClose, initialTab = "tour" }: { open: boolean; onClose: () => void; initialTab?: FeaturesTab }) {
  const [tab, setTab] = useState<FeaturesTab>(initialTab);
  const [i, setI] = useState(0);
  const [dir, setDir] = useState<1 | -1>(1);
  const last = i === SLIDES.length - 1;

  const go = (next: number) => {
    if (next < 0 || next >= SLIDES.length) return;
    setDir(next > i ? 1 : -1);
    setI(next);
  };

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (tab !== "tour") return;
      if (e.key === "ArrowRight") go(i + 1);
      if (e.key === "ArrowLeft") go(i - 1);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  });


  const s = SLIDES[i];

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="TestMind"
      width="max-w-3xl"
      footer={
        tab === "tour" ? (
          <div className="flex w-full items-center gap-2">
            <span className="mr-auto text-xs tabular-nums text-gray-500">
              {i + 1} of {SLIDES.length}
            </span>
            <button type="button" className={btnGhost} onClick={() => go(i - 1)} disabled={i === 0}>
              Previous
            </button>
            {last ? (
              <button type="button" className={btnPrimary} onClick={() => setTab("tech")}>
                How it&apos;s built
              </button>
            ) : (
              <button type="button" className={btnPrimary} onClick={() => go(i + 1)}>
                Next
              </button>
            )}
          </div>
        ) : (
          <div className="flex w-full items-center gap-2">
            <button type="button" className={`${btnGhost} mr-auto`} onClick={() => setTab("tour")}>
              Back to the tour
            </button>
            <Link href="/projects" onClick={onClose} className={btnPrimary}>
              Try it
            </Link>
          </div>
        )
      }
    >
      <div role="tablist" className="-mt-2 mb-4 flex gap-5 border-b text-sm">
        {(
          [
            ["tour", "Product tour"],
            ["tech", "How it's built"],
          ] as const
        ).map(([k, label]) => (
          <button
            key={k}
            role="tab"
            aria-selected={tab === k}
            onClick={() => setTab(k)}
            className={`-mb-px border-b-2 pb-2 transition-colors ${tab === k ? "border-amber-500 font-medium" : "border-transparent text-gray-500 hover:text-gray-800 dark:hover:text-gray-200"}`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "tech" ? (
        <UnderTheHood />
      ) : (
      <div key={i} className={dir === 1 ? "tm-tour-next" : "tm-tour-prev"}>
        <div className="flex h-[260px] items-center justify-center overflow-hidden rounded-md border bg-gray-50 p-3 sm:h-[340px] dark:bg-gray-950">
          <Image src={s.src} alt={s.title} width={s.w} height={s.h} className="h-full w-auto max-w-full rounded object-contain shadow-sm" priority={i === 0} />
        </div>
        <h3 className="mt-5 text-lg font-semibold">{s.title}</h3>
        <p className="mt-1 max-w-prose text-sm leading-relaxed text-gray-600 dark:text-gray-300">{s.text}</p>
      </div>
      )}
    </Modal>
  );
}
