"use client";

import { useEffect, useState } from "react";

// Explains the product in three plain steps, then shows the name.
const STEPS = [
  { word: "Describe a feature", n: "1" },
  { word: "AI writes the tests", n: "2" },
  { word: "AI reviews them", n: "3" },
  { word: "TestMind", n: "" },
];
const KEY = "tm-intro-seen";

/**
 * Intro screen shown once per browser session. An inline script in the layout
 * hides it before paint for returning visitors, so there is no flash.
 */
export default function IntroLoader() {
  const [i, setI] = useState(-1);
  const [done, setDone] = useState(false);
  const [gone, setGone] = useState(false);

  useEffect(() => {
    const html = document.documentElement;
    if (html.classList.contains("tm-no-intro")) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setGone(true);
      return;
    }
    try {
      sessionStorage.setItem(KEY, "1");
    } catch {}
    html.style.overflow = "hidden";

    const timers: ReturnType<typeof setTimeout>[] = [];
    let t = 350;
    STEPS.forEach((_, n) => timers.push(setTimeout(() => setI(n), (t += n === 0 ? 0 : 420))));
    timers.push(
      setTimeout(() => {
        setDone(true);
        html.style.overflow = "";
      }, (t += 750)),
    );
    timers.push(setTimeout(() => setGone(true), t + 900));
    return () => {
      timers.forEach(clearTimeout);
      html.style.overflow = "";
    };
  }, []);

  if (gone) return null;
  const passed = i + 1; // steps shown so far

  return (
    <div
      aria-hidden
      className={`tm-intro fixed inset-0 z-[100] flex flex-col items-center justify-center bg-amber-300 transition-transform duration-[900ms] ease-[cubic-bezier(.76,0,.24,1)] ${
        done ? "-translate-y-full" : ""
      }`}
    >
      <div className="h-16 overflow-hidden text-center md:h-20">
        {i >= 0 && (
          <p key={i} className="tm-intro-word flex items-center gap-4 text-3xl font-bold text-black md:text-6xl">
            {STEPS[i].n ? (
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-black text-lg text-amber-300 md:h-14 md:w-14 md:text-2xl">{STEPS[i].n}</span>
            ) : (
              <span className="grid h-9 w-9 shrink-0 -rotate-6 place-items-center rounded-lg bg-black text-sm font-black text-amber-300 md:h-14 md:w-14 md:text-xl">TM</span>
            )}
            {STEPS[i].word}
          </p>
        )}
      </div>

      <div className="absolute bottom-10 left-6 right-6 flex items-end justify-between font-mono text-xs text-black md:left-10 md:right-10">
        <span>
          TestMind
          <span className="ml-3 opacity-60">AI test case generator</span>
        </span>
        <span className="text-2xl font-bold md:text-4xl">{Math.round((passed / STEPS.length) * 100)}%</span>
      </div>
      <div className="absolute bottom-0 left-0 h-1.5 w-full bg-black/10">
        <div className="h-full origin-left bg-black transition-transform duration-300" style={{ transform: `scaleX(${passed / STEPS.length})` }} />
      </div>
    </div>
  );
}
