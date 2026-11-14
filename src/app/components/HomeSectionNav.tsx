"use client";

import { useEffect, useState } from "react";

const SECTIONS = [
  { id: "overview", label: "Overview" },
  { id: "product", label: "Product" },
  { id: "results", label: "Results" },
  { id: "built", label: "How it's built" },
];

/** Links to each part of the home page, so visitors can jump instead of scrolling. */
export default function HomeSectionNav() {
  const [active, setActive] = useState<string | null>(null);

  useEffect(() => {
    const els = SECTIONS.map((s) => document.getElementById(s.id)).filter((el): el is HTMLElement => Boolean(el));
    // A section counts as current while it crosses the upper third of the screen.
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) setActive(e.target.id);
        });
      },
      { rootMargin: "-30% 0px -65% 0px" },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  const go = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    const el = document.getElementById(id);
    if (!el) return;
    e.preventDefault();
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
    history.replaceState(null, "", `#${id}`);
    setActive(id);
  };

  return (
    <nav aria-label="On this page" className="sticky top-0 z-30 border-b border-stone-200 bg-white shadow-[0_6px_16px_-12px_rgba(11,11,12,.35)] dark:border-slate-800 dark:bg-slate-950">
      <ul className="mx-auto flex max-w-[1320px] gap-1 overflow-x-auto px-[clamp(12px,5vw,64px)] [scrollbar-width:none]">
        {SECTIONS.map((s) => (
          <li key={s.id} className="shrink-0">
            <a
              href={`#${s.id}`}
              onClick={(e) => go(e, s.id)}
              aria-current={active === s.id ? "location" : undefined}
              className={`relative block px-3 py-3.5 text-sm font-medium transition-colors after:absolute after:inset-x-3 after:bottom-0 after:h-0.5 after:origin-left after:bg-amber-400 after:transition-transform ${
                active === s.id ? "text-black after:scale-x-100 dark:text-white" : "text-slate-500 after:scale-x-0 hover:text-black dark:hover:text-white"
              }`}
            >
              {s.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
