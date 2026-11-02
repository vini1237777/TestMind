"use client";

import { useEffect, useRef } from "react";

/**
 * Page wide pointer effects, wired once with event delegation so cards that
 * render later pick them up too.
 *   data-tilt      card leans toward the pointer
 *   data-magnetic  button drifts toward the pointer
 * Also draws a thin reading progress bar under the navbar.
 */
export default function Motion() {
  const bar = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const fine = window.matchMedia("(pointer: fine)").matches;

    let lastTilt: HTMLElement | null = null;
    let lastMag: HTMLElement | null = null;

    const reset = (el: HTMLElement | null, ms: number) => {
      if (!el) return;
      el.style.transition = `transform ${ms}ms cubic-bezier(.2,.8,.2,1)`;
      el.style.transform = "";
    };

    const onMove = (e: PointerEvent) => {
      const target = e.target as Element | null;
      const tilt = target?.closest<HTMLElement>("[data-tilt]") ?? null;
      const mag = target?.closest<HTMLElement>("[data-magnetic]") ?? null;

      if (tilt !== lastTilt) reset(lastTilt, 500);
      if (mag !== lastMag) reset(lastMag, 300);
      lastTilt = tilt;
      lastMag = mag;

      if (tilt) {
        const r = tilt.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width - 0.5;
        const py = (e.clientY - r.top) / r.height - 0.5;
        const strength = Number(tilt.dataset.tilt) || 6;
        tilt.style.transition = "transform 100ms linear";
        tilt.style.transform = `perspective(900px) rotateY(${(px * strength).toFixed(2)}deg) rotateX(${(-py * strength).toFixed(2)}deg) translateY(-4px)`;
        tilt.style.setProperty("--mx", `${((px + 0.5) * 100).toFixed(1)}%`);
        tilt.style.setProperty("--my", `${((py + 0.5) * 100).toFixed(1)}%`);
      }
      if (mag) {
        const r = mag.getBoundingClientRect();
        mag.style.transition = "transform 150ms ease-out";
        mag.style.transform = `translate(${((e.clientX - r.left - r.width / 2) * 0.25).toFixed(1)}px, ${((e.clientY - r.top - r.height / 2) * 0.35).toFixed(1)}px)`;
      }
    };
    const onLeave = () => {
      reset(lastTilt, 500);
      reset(lastMag, 300);
      lastTilt = lastMag = null;
    };

    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const max = document.documentElement.scrollHeight - window.innerHeight;
        if (bar.current) bar.current.style.transform = `scaleX(${max > 0 ? window.scrollY / max : 0})`;
      });
    };

    if (!reduce && fine) {
      document.addEventListener("pointermove", onMove, { passive: true });
      document.documentElement.addEventListener("pointerleave", onLeave);
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => {
      document.removeEventListener("pointermove", onMove);
      document.documentElement.removeEventListener("pointerleave", onLeave);
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);

  return <div ref={bar} aria-hidden className="pointer-events-none fixed left-0 top-0 z-[60] h-[3px] w-full origin-left scale-x-0 bg-gradient-to-r from-amber-500 via-orange-500 to-rose-400" />;
}
