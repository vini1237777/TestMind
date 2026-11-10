"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

/**
 * Pulsing call to action. On click the intro zooms out and the workspace
 * (the projects page) opens, zooming in.
 */
export default function TryNow({ signedIn }: { signedIn: boolean }) {
  const router = useRouter();

  // Signed out, /projects only redirects home, so there is nothing worth fetching early.
  useEffect(() => {
    if (signedIn) router.prefetch("/projects");
  }, [router, signedIn]);

  const go = () => {
    // Signed out, the way in is the sign in card next to this button.
    if (!signedIn) {
      window.dispatchEvent(new CustomEvent("tm:signin"));
      return;
    }
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
      className="tm-press tm-attention rounded-full bg-amber-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-amber-600 dark:bg-amber-400 dark:text-black dark:hover:bg-amber-300"
    >
      Try it now →
    </button>
  );
}
