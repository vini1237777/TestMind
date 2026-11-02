"use client";

import { useEffect, useRef, useState } from "react";

function useInView<T extends Element>(once = true) {
  const ref = useRef<T>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setInView(true);
          if (once) io.disconnect();
        } else if (!once) setInView(false);
      },
      { threshold: 0.2 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [once]);
  return { ref, inView };
}

export function Reveal({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) {
  const { ref, inView } = useInView<HTMLDivElement>();
  return (
    <div ref={ref} className={`reveal ${inView ? "in" : ""} ${className}`} style={{ transitionDelay: `${delay}ms` }}>
      {children}
    </div>
  );
}

export function CountUp({ to, decimals = 0, prefix = "", suffix = "", duration = 1400 }: { to: number; decimals?: number; prefix?: string; suffix?: string; duration?: number }) {
  const { ref, inView } = useInView<HTMLSpanElement>();
  const [v, setV] = useState(0);
  useEffect(() => {
    if (!inView) return;
    let raf = 0;
    const t0 = performance.now();
    const tick = (t: number) => {
      const p = Math.min(1, (t - t0) / duration);
      setV(to * (1 - Math.pow(1 - p, 3)));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, to, duration]);
  return (
    <span ref={ref} className="tabular-nums">
      {prefix}
      {v.toFixed(decimals)}
      {suffix}
    </span>
  );
}

/** Splits a headline into words that rise in one after another. */
export function Words({ text, start = 0, step = 70, highlight }: { text: string; start?: number; step?: number; highlight?: string }) {
  return (
    <>
      {text.split(" ").map((w, i) => (
        <span key={i} className="animate-word" style={{ animationDelay: `${start + i * step}ms` }}>
          <span className={w.replace(/[.,]/g, "") === highlight ? "highlight" : ""}>{w}</span>
          {" "}
        </span>
      ))}
    </>
  );
}

export function Marquee({ items, tone, tilt }: { items: string[]; tone: "amber" | "ink"; tilt: number }) {
  const row = [...items, ...items];
  return (
    <div
      className={`relative -mx-[10vw] overflow-hidden border-y-[1.5px] border-[#111827] py-3 ${
        tone === "amber" ? "bg-accent text-[#1c1301]" : "bg-[#111827] text-[#fef3c7]"
      }`}
      style={{ transform: `rotate(${tilt}deg)` }}
      aria-hidden
    >
      <div className="flex w-max gap-8 whitespace-nowrap font-mono text-[13px] font-semibold uppercase tracking-wider" style={{ animation: `marquee ${tone === "amber" ? 48 : 60}s linear infinite ${tone === "ink" ? "reverse" : ""}` }}>
        {row.map((t, i) => (
          <span key={i} className="flex items-center gap-8">
            {t}
            <span className="opacity-60">✦</span>
          </span>
        ))}
      </div>
    </div>
  );
}
