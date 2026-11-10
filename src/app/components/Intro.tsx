import DemoRun from "./DemoRun";
import OpenFeatures from "./OpenFeatures";
import TryNow from "./TryNow";
import RunExample from "./RunExample";
import AuthCard from "./AuthCard";


function Words({ text, start = 0 }: { text: string; start?: number }) {
  return (
    <>
      {text.split(" ").map((w, i) => (
        <span key={i} className="tm-word" style={{ animationDelay: `${start + i * 60}ms` }}>
          {w}&nbsp;
        </span>
      ))}
    </>
  );
}

export default function Intro({ email, next }: { email: string | null; next: string | null }) {
  return (
    <div id="landing" className="mx-auto max-w-6xl overflow-x-clip px-[clamp(1rem,4vw,2rem)]">
      {/*
        The first screen holds the pitch and the sign in card, sized to the viewport.
        Phones show the card straight after the headline, before the longer text.
      */}
      <section className="grid min-h-[calc(100svh-3rem)] grid-cols-1 content-center gap-x-[clamp(2rem,5vw,4.5rem)] gap-y-[clamp(1.25rem,3vh,2rem)] py-[clamp(1.5rem,5vh,3.5rem)] lg:grid-cols-[minmax(0,1fr)_minmax(340px,400px)] lg:grid-rows-[auto_auto]">
        <h2 className="self-end text-[clamp(1.9rem,1.1rem+2.9vw,3.4rem)] font-bold leading-[1.08] tracking-tight lg:col-start-1 lg:row-start-1">
          <Words text="Describe a feature." />
          <br />
          <Words text="Get its test cases," start={250} />{" "}
          <span className="tm-word relative inline-block" style={{ animationDelay: "500ms" }}>
            <span aria-hidden className="tm-mark absolute inset-x-0 bottom-[0.12em] -z-10 h-[0.3em] bg-amber-300 dark:bg-amber-400/70" />
            and what they miss.
          </span>
        </h2>

        <div
          className="tm-pop w-full max-w-[400px] lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:self-center"
          style={{ animationDelay: "300ms" }}
        >
          <AuthCard email={email} next={next} />
          <a
            href="#replay"
            className="mt-4 inline-flex items-center gap-1.5 text-xs text-gray-500 underline-offset-2 hover:text-black hover:underline dark:hover:text-white"
          >
            <span aria-hidden className="h-1.5 w-1.5 animate-pulse rounded-full bg-amber-500" />
            Watch a recorded run first
          </a>
        </div>

        <div className="self-start lg:col-start-1 lg:row-start-2">
          <p className="tm-rise max-w-[52ch] text-[clamp(0.9rem,0.85rem+0.25vw,1rem)] leading-relaxed text-gray-600 dark:text-gray-300" style={{ animationDelay: "650ms" }}>
            Write a few lines about what a feature should do. TestMind turns them into a list of tests for when things work, when they
            fail, and the odd corner cases. Then it checks its own list, gives it a score out of 100 and tells you what is still
            missing.
          </p>
          <div className="tm-rise mt-6 flex flex-wrap items-center gap-3" style={{ animationDelay: "800ms" }}>
            <TryNow signedIn={Boolean(email)} />
            <OpenFeatures tab="tour" className="tm-press rounded-full border px-4 py-2.5 text-sm hover:bg-amber-50 dark:border-gray-700 dark:hover:bg-gray-800">
              See how it works
            </OpenFeatures>
          </div>
          <p className="tm-fade mt-6 max-w-[52ch] border-t pt-4 text-xs leading-relaxed text-gray-500" style={{ animationDelay: "950ms" }}>
            A proof of concept built with Next.js, LangGraph and OpenAI. Results export to Playwright, CSV or Markdown.{" "}
            <OpenFeatures tab="tech" className="underline underline-offset-2 hover:text-amber-700">
              How it&apos;s built
            </OpenFeatures>
          </p>
        </div>
      </section>

      {/* The replay gets its own screen below, at a size that reads, with the offset card it had before */}
      <section id="replay" className="mx-auto max-w-[480px] scroll-mt-16 pb-[clamp(3rem,10vh,6rem)] pt-4">
        <p className="mb-3 text-sm text-gray-600 dark:text-gray-300">A recording of one run, start to finish.</p>
        <div className="relative">
          <div aria-hidden className="absolute inset-0 translate-x-2.5 translate-y-2.5 rotate-1 rounded-lg bg-amber-300 dark:bg-amber-400/80" />
          <div className="relative">
            <DemoRun />
          </div>
        </div>
        <div className="mt-7 flex flex-wrap items-center justify-between gap-3">
          <p className="text-[11px] text-gray-500">Run it yourself on your own account.</p>
          <RunExample />
        </div>
      </section>
    </div>
  );
}
