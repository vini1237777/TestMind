"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import Modal, { btnGhost, btnPrimary } from "./Modal";

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

export default function FeaturesModal({ open, onClose }: { open: boolean; onClose: () => void }) {
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
      if (e.key === "ArrowRight") go(i + 1);
      if (e.key === "ArrowLeft") go(i - 1);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  });

  // Start from the first slide each time it opens
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (open) setI(0);
  }, [open]);

  const s = SLIDES[i];

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="A quick look at TestMind"
      width="max-w-3xl"
      footer={
        <div className="flex w-full items-center gap-2">
          <span className="mr-auto text-xs tabular-nums text-gray-500">
            {i + 1} of {SLIDES.length}
          </span>
          <button type="button" className={btnGhost} onClick={() => go(i - 1)} disabled={i === 0}>
            Previous
          </button>
          {last ? (
            <Link href="/projects" onClick={onClose} className={btnPrimary}>
              Try it
            </Link>
          ) : (
            <button type="button" className={btnPrimary} onClick={() => go(i + 1)}>
              Next
            </button>
          )}
        </div>
      }
    >
      <div key={i} className={dir === 1 ? "tm-tour-next" : "tm-tour-prev"}>
        <div className="flex h-[260px] items-center justify-center overflow-hidden rounded-md border bg-gray-50 p-3 sm:h-[340px] dark:bg-gray-950">
          <Image src={s.src} alt={s.title} width={s.w} height={s.h} className="h-full w-auto max-w-full rounded object-contain shadow-sm" priority={i === 0} />
        </div>
        <h3 className="mt-5 text-lg font-semibold">{s.title}</h3>
        <p className="mt-1 max-w-prose text-sm leading-relaxed text-gray-600 dark:text-gray-300">{s.text}</p>
      </div>
    </Modal>
  );
}
