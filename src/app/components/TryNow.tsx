"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

/**
 * Pulsing call to action. On click the intro zooms out and the workspace
 * (the projects page) opens, zooming in.
 */
export default function TryNow() {
  const router = useRouter();

  useEffect(() => {
    router.prefetch("/projects");
  }, [router]);

  const go = () => {
    const landing = document.getElementById("landing");
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce || !landing) {
      router.push("/projects");
      return;
    }
    landing.classList.add("tm-zoom-out");
    setTimeout(() => router.push("/projects"), 380);
  };

  return (
    <button
      type="button"
      onClick={go}
      className="tm-press tm-attention rounded-full bg-amber-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-amber-600 dark:bg-gray-200 dark:text-black"
    >
      Try it now →
    </button>
  );
}
