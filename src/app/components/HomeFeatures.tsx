"use client";

import Image from "next/image";
import { useState, type ReactNode } from "react";
import OpenFeatures from "./OpenFeatures";
import RunExample from "./RunExample";

const link = "text-[15px] font-semibold text-blue-600 hover:underline hover:underline-offset-4 dark:text-blue-400";

type Item = { title: string; text: string; img: { src: string; w: number; h: number; alt: string }; action: ReactNode };

// The same real screenshots as the product tour.
const ITEMS: Item[] = [
  {
    title: "Start with a sentence or two",
    text: "Give the feature a name and say what it should do, the way you would explain it to a teammate. Mention limits and error cases, because that is where the useful tests come from.",
    img: { src: "/tour/describe.png", w: 1344, h: 944, alt: "Describing a new feature in TestMind" },
    action: (
      <OpenFeatures tab="tour" className={link}>
        Take the product tour &gt;
      </OpenFeatures>
    ),
  },
  {
    title: "Get a test plan you can read",
    text: "Each case has steps and an expected result. The coloured bar shows how many are normal, failure and edge cases. The review score out of 100 shows how much of the feature is covered, and the review lists what is missing.",
    img: { src: "/tour/plan.png", w: 1856, h: 1248, alt: "A generated test plan with its review score" },
    action: <RunExample className={link} label="Run the example for real >" />,
  },
  {
    title: "It learns from your saved cases",
    text: "This is the RAG part. Every case you save is stored with an embedding. For a new feature, TestMind finds the 5 most similar saved cases in the same project and gives them to the AI, so the new cases follow your project's rules instead of starting from zero. If search fails, it still writes the cases, just without that context.",
    img: { src: "/tour/projects.png", w: 2496, h: 1120, alt: "Projects, whose saved cases become context for new ones" },
    action: (
      <OpenFeatures tab="tech" className={link}>
        Read how RAG is used &gt;
      </OpenFeatures>
    ),
  },
  {
    title: "Take it with you",
    text: "Export to Playwright to start automating, CSV for a spreadsheet or test tool, or Markdown to paste into a ticket.",
    img: { src: "/tour/export.png", w: 984, h: 442, alt: "The export menu with Playwright, CSV and Markdown" },
    action: (
      <OpenFeatures tab="tour" className={link}>
        Take the product tour &gt;
      </OpenFeatures>
    ),
  },
  {
    title: "Come back to it later",
    text: "Features are grouped into projects. Press / to search, sort by score, or open a recent one from the top of the list.",
    img: { src: "/tour/projects.png", w: 2496, h: 1120, alt: "The projects list" },
    action: (
      <OpenFeatures tab="tech" className={link}>
        Read how it&apos;s built &gt;
      </OpenFeatures>
    ),
  },
];

function Shot({ img, className }: { img: Item["img"]; className: string }) {
  return (
    <Image
      src={img.src}
      width={img.w}
      height={img.h}
      alt={img.alt}
      sizes="(max-width: 860px) 100vw, 600px"
      className={`rounded-[10px] bg-white shadow-[0_30px_60px_-28px_rgba(11,11,12,.4),0_0_0_1px_rgba(11,11,12,.08)] ${className}`}
    />
  );
}

/** Four parts of the product, one open at a time, with its screenshot beside it. */
export default function HomeFeatures() {
  const [open, setOpen] = useState(0);

  return (
    <div className="grid items-start gap-[clamp(24px,4vw,56px)] lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
      <div className="border-t border-stone-200 dark:border-slate-800">
        {ITEMS.map((item, i) => {
          const isOpen = open === i;
          return (
            <div key={item.title} className="border-b border-stone-200 dark:border-slate-800">
              <h3>
                <button
                  type="button"
                  aria-expanded={isOpen}
                  aria-controls={`feature-${i}`}
                  onClick={() => setOpen(i)}
                  className="flex w-full items-center justify-between gap-4 px-1 py-6 text-left text-lg font-medium sm:py-7 sm:text-[21px]"
                >
                  {item.title}
                  <span
                    aria-hidden
                    className={`h-2.5 w-2.5 shrink-0 border-b-2 border-r-2 border-current transition-transform ${isOpen ? "-rotate-[135deg]" : "rotate-45 -translate-y-1"}`}
                  />
                </button>
              </h3>
              <div id={`feature-${i}`} hidden={!isOpen} className="tm-fade px-1 pb-8">
                <p className="mb-4 max-w-[52ch] text-base leading-relaxed text-slate-600 dark:text-slate-300">{item.text}</p>
                {item.action}
                <Shot img={item.img} className="tm-shot-in mt-5 h-auto w-full lg:hidden" />
              </div>
            </div>
          );
        })}
      </div>
      <div className="sticky top-8 hidden aspect-[1.18] place-items-center overflow-hidden rounded-[20px] bg-stone-100 p-[clamp(20px,4vw,48px)] lg:grid dark:bg-slate-900">
        <Shot key={open} img={ITEMS[open].img} className="tm-shot-in h-auto max-h-full w-auto max-w-full" />
      </div>
    </div>
  );
}
