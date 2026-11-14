"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

/** True once the element has scrolled into view. It stays true, so motion plays once. */
function useInView<T extends Element>() {
  const ref = useRef<T>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          io.disconnect();
        }
      },
      { rootMargin: "0px 0px -12% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return [ref, inView] as const;
}

/** Rises into place the first time it scrolls into view. */
export function Reveal({
  children,
  delay = 0,
  className = "",
  as: Tag = "div",
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
  as?: "div" | "li";
}) {
  const [ref, inView] = useInView<HTMLElement>();
  return (
    <Tag
      ref={ref as React.Ref<HTMLDivElement & HTMLLIElement>}
      data-reveal=""
      data-in={inView || undefined}
      className={className}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </Tag>
  );
}

/** A sentence whose words appear one after another, then a highlighted ending fades in whole. */
export function RevealWords({ text, highlight, className }: { text: string; highlight?: string; className: string }) {
  const [ref, inView] = useInView<HTMLParagraphElement>();
  const words = text.split(" ");

  return (
    <p ref={ref} data-words="" data-in={inView || undefined} className={className}>
      {words.map((w, i) => (
        <span key={i}>
          <span className="tm-rw" style={{ transitionDelay: `${i * 70}ms` }}>
            {w}
          </span>{" "}
        </span>
      ))}
      {highlight && (
        // One element, so the gradient runs across the whole phrase.
        <span className="tm-rw-hl tm-grad" style={{ transitionDelay: `${words.length * 70}ms` }}>
          {highlight}
        </span>
      )}
    </p>
  );
}

/** Counts up to a measured number once it is on screen, then shows the exact value. */
export function CountUp({ value }: { value: string }) {
  const [ref, inView] = useInView<HTMLSpanElement>();
  const match = value.match(/^([\d.]+)(.*)$/);
  const target = match ? Number(match[1]) : NaN;
  const suffix = match ? match[2] : "";
  const decimals = match && match[1].includes(".") ? match[1].split(".")[1].length : 0;
  const [shown, setShown] = useState(value);

  useEffect(() => {
    if (!inView || Number.isNaN(target)) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const start = performance.now();
    const duration = 1100;
    let frame = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setShown(t === 1 ? value : (target * eased).toFixed(decimals) + suffix);
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [inView, target, suffix, decimals, value]);

  return (
    <span ref={ref} aria-label={value}>
      <span aria-hidden>{shown}</span>
    </span>
  );
}
