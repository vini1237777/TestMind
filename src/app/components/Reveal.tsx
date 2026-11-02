"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

/** Fades its children up the first time they scroll into view. */
export default function Reveal({ children, delay = 0, className = "" }: { children: ReactNode; delay?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [seen, setSeen] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setSeen(true);
          io.disconnect();
        }
      },
      { threshold: 0.15 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div ref={ref} className={`${seen ? "tm-rise" : "opacity-0"} ${className}`} style={{ animationDelay: `${delay}ms` }}>
      {children}
    </div>
  );
}
