"use client";

import { useRef, useState } from "react";

// Start time of each part of the overview video, in seconds.
const PARTS = [
  { label: "Problem", at: 0 },
  { label: "What it does", at: 4.6 },
  { label: "How it works", at: 9.4 },
  { label: "Result", at: 14.6 },
];

/** A 19 second overview of what TestMind is for. Loads nothing until someone presses play. */
export default function PurposeVideo() {
  const video = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const [part, setPart] = useState(0);
  const [failed, setFailed] = useState(false);

  const play = (at?: number) => {
    const v = video.current;
    if (!v) return;
    if (at !== undefined) {
      if (v.readyState >= 1) v.currentTime = at;
      else v.addEventListener("loadedmetadata", () => (v.currentTime = at), { once: true });
    }
    v.play().catch(() => setPlaying(false));
  };

  const toggle = () => {
    const v = video.current;
    if (!v) return;
    if (v.paused) play();
    else v.pause();
  };

  const onTime = () => {
    const t = video.current?.currentTime ?? 0;
    let current = 0;
    PARTS.forEach((p, i) => {
      if (t >= p.at - 0.05) current = i;
    });
    setPart(current);
  };

  return (
    <div className="relative">
      <div aria-hidden className="absolute inset-0 translate-x-2.5 translate-y-2.5 rounded-lg bg-amber-300 dark:bg-amber-400/80" />
      <div className="relative overflow-hidden rounded-lg border bg-white shadow-xl dark:border-gray-700 dark:bg-gray-900">
        <div className="flex items-center justify-between bg-amber-300 px-3 py-1.5 text-xs text-black">
          <span className="font-semibold">TestMind</span>
          <span className="opacity-70">Overview</span>
        </div>
        <div className="relative aspect-[16/10] bg-white">
          <video
            ref={video}
            className="block h-full w-full"
            src="/videos/testmind-purpose.mp4"
            poster="/videos/testmind-purpose.jpg"
            preload="none"
            muted
            playsInline
            onPlay={() => setPlaying(true)}
            onPause={() => setPlaying(false)}
            onEnded={() => setPlaying(false)}
            onError={() => setFailed(true)}
            onTimeUpdate={onTime}
            onSeeked={onTime}
            aria-label="Overview of TestMind: the problem, what it does, how it works and the result"
          />
          {failed ? (
            <p
              role="status"
              className="absolute inset-x-0 bottom-0 bg-white/90 px-3 py-2 text-center text-sm text-slate-600 dark:bg-gray-900/90 dark:text-slate-300"
            >
              The overview could not load right now. Try the demo instead.
            </p>
          ) : (
            <button
              type="button"
              onClick={toggle}
              aria-label={playing ? "Pause the overview" : "Play the overview"}
              className="group absolute inset-0 grid place-items-center focus-visible:outline-none"
            >
              <span
                className={`grid h-14 w-14 place-items-center rounded-full bg-black text-amber-300 transition group-focus-visible:ring-4 group-focus-visible:ring-amber-400 dark:bg-amber-400 dark:text-black ${
                  playing ? "opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100" : ""
                }`}
              >
                <svg aria-hidden viewBox="0 0 24 24" className="h-6 w-6 fill-current">
                  {playing ? <path d="M7 5h3.5v14H7zM13.5 5H17v14h-3.5z" /> : <path d="M8 5v14l11-7z" />}
                </svg>
              </span>
            </button>
          )}
        </div>
        <div className="flex flex-wrap gap-1.5 border-t px-3 py-2.5 text-xs dark:border-gray-700">
          {PARTS.map((p, i) => (
            <button
              key={p.label}
              type="button"
              onClick={() => play(p.at)}
              aria-current={i === part ? "step" : undefined}
              className={`rounded px-2.5 py-1 transition-colors ${
                i === part
                  ? "bg-amber-200 font-semibold text-black dark:bg-amber-400"
                  : "bg-slate-100 text-slate-600 hover:text-black dark:bg-gray-800 dark:text-slate-300 dark:hover:text-white"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
