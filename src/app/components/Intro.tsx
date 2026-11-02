import DemoRun from "./DemoRun";
import OpenFeatures from "./OpenFeatures";
import TryNow from "./TryNow";
import RunExample from "./RunExample";


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

export default function Intro() {
  return (
    <div id="landing" className="mx-auto max-w-6xl overflow-x-clip px-6">
      {/* What it is, next to a replay of one run */}
      <section className="grid min-h-[calc(100vh-3rem)] grid-cols-1 items-center gap-12 py-12 lg:grid-cols-[1fr_minmax(0,480px)] lg:gap-16">
        <div>
          <h2 className="text-3xl font-bold leading-tight md:text-[2.6rem]">
            <Words text="Describe a feature." />
            <br />
            <Words text="Get its test cases," start={250} />{" "}
            <span className="tm-word relative inline-block" style={{ animationDelay: "500ms" }}>
              <span aria-hidden className="tm-mark absolute inset-x-0 bottom-1 -z-10 h-3 bg-amber-300 dark:bg-amber-400/70" />
              and what they miss.
            </span>
          </h2>
          <p className="tm-rise mt-5 max-w-lg text-[15px] leading-relaxed text-gray-600 dark:text-gray-300" style={{ animationDelay: "650ms" }}>
            Write a few lines about what a feature should do. TestMind turns them into a list of tests for when things work, when they
            fail, and the odd corner cases. Then it checks its own list, gives it a score out of 100 and tells you what is still
            missing.
          </p>
          <div className="tm-rise mt-7 flex flex-wrap items-center gap-3" style={{ animationDelay: "800ms" }}>
            <TryNow />
            <OpenFeatures tab="tour" className="tm-press rounded-full border px-4 py-2.5 text-sm hover:bg-amber-50 dark:border-gray-700 dark:hover:bg-gray-800">
              See how it works
            </OpenFeatures>
          </div>
          <p className="tm-fade mt-8 max-w-lg border-t pt-4 text-xs leading-relaxed text-gray-500" style={{ animationDelay: "950ms" }}>
            A proof of concept built with Next.js, LangGraph and OpenAI. Results export to Playwright, CSV or Markdown.{" "}
            <OpenFeatures tab="tech" className="underline underline-offset-2 hover:text-amber-700">
              How it&apos;s built
            </OpenFeatures>
          </p>
        </div>

        <div className="tm-pop relative" style={{ animationDelay: "300ms" }}>
          <div className="relative">
            {/* Offset card behind the panel, echoing the tilted logo tile */}
            <div aria-hidden className="absolute inset-0 translate-x-2.5 translate-y-2.5 rotate-1 rounded-lg bg-amber-300 dark:bg-amber-400/80" />
            <div className="relative">
              <DemoRun />
            </div>
          </div>
          <div className="relative mt-7 flex flex-wrap items-center justify-between gap-3">
            <p className="text-[11px] text-gray-500">This is a recording of one run.</p>
            <RunExample />
          </div>
        </div>
      </section>
    </div>
  );
}
