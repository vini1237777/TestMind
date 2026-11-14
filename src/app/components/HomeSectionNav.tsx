"use client";

import { useEffect, useState } from "react";

const SECTIONS = [
  { id: "home", label: "Home" },
  { id: "overview", label: "Overview" },
  { id: "product", label: "Product" },
  { id: "results", label: "Results" },
  { id: "built", label: "How it's built" },
];
const IDS = SECTIONS.map((s) => s.id);

const fromHash = () => {
  const id = window.location.hash.slice(1);
  return IDS.includes(id) ? id : "home";
};

function show(id: string) {
  const landing = document.getElementById("landing");
  if (landing) landing.dataset.tab = id;
}

/** Brings the start of the open part into view, just under the bar, or the page top for Home. */
function toTop(id: string) {
  // A sticky bar reports where it is stuck, so measure from a marker that stays put.
  const marker = document.getElementById("tabs-start");
  const top =
    id === "home" || !marker
      ? 0
      : marker.getBoundingClientRect().top + window.scrollY;
  if (window.scrollY > top) window.scrollTo({ top });
}

/**
 * The home page as tabs: each link shows one part of the page in place of the others.
 * The open part lives in the address hash, so links, reloads and the back button work.
 */
export default function HomeSectionNav() {
  const [active, setActive] = useState("home");

  useEffect(() => {
    const sync = () => {
      const id = fromHash();
      setActive(id);
      show(id);
    };
    sync();
    // Links to #overview and the like elsewhere on the page, plus back and forward.
    const onChange = () => {
      sync();
      toTop(fromHash());
    };
    window.addEventListener("hashchange", onChange);
    window.addEventListener("popstate", onChange);
    return () => {
      window.removeEventListener("hashchange", onChange);
      window.removeEventListener("popstate", onChange);
    };
  }, []);

  const go = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    if (id === active) return;
    history.pushState(
      null,
      "",
      id === "home"
        ? window.location.pathname + window.location.search
        : `#${id}`,
    );
    setActive(id);
    show(id);
    toTop(id);
  };

  return (
    <>
      <div id="tabs-start" aria-hidden />
      <nav
        id="tabs"
        aria-label="Home page sections"
        className="sticky top-0 z-30 border-b border-stone-200 bg-white shadow-[0_6px_16px_-12px_rgba(11,11,12,.35)] dark:border-slate-800 dark:bg-slate-950"
      >
        <ul className="mx-auto flex max-w-[1320px] justify-between overflow-x-auto px-1 sm:justify-start sm:gap-1 sm:px-[clamp(12px,5vw,64px)] [scrollbar-width:none]">
          {SECTIONS.map((s) => (
            <li key={s.id} className="shrink-0">
              <a
                href={s.id === "home" ? "#home" : `#${s.id}`}
                onClick={(e) => go(e, s.id)}
                aria-current={active === s.id ? "page" : undefined}
                className={`relative block whitespace-nowrap px-2 py-3.5 text-[13px] font-medium transition-colors after:absolute after:inset-x-2 sm:px-3 sm:text-sm sm:after:inset-x-3 after:bottom-0 after:h-0.5 after:origin-left after:bg-amber-400 after:transition-transform ${
                  active === s.id
                    ? "text-black after:scale-x-100 dark:text-white"
                    : "text-slate-500 after:scale-x-0 hover:text-black dark:hover:text-white"
                }`}
              >
                {s.label}
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </>
  );
}
