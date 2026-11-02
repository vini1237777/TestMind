import DemoRun from "./DemoRun";
import OpenFeatures from "./OpenFeatures";
import TryNow from "./TryNow";


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
    <div id="landing" className="mx-4 px-4">
      {/* What it is, next to a replay of one run */}
      <section className="grid grid-cols-1 items-center gap-10 py-10 lg:grid-cols-[1fr_minmax(0,500px)]">
        <div>
          <p className="tm-fade text-xs text-gray-500">Proof of concept built with Next.js, LangGraph and OpenAI</p>
          <h2 className="mt-2 text-2xl font-semibold md:text-3xl">
            <Words text="TestMind writes test cases from a feature description, then reviews them." />
          </h2>
          <p className="tm-rise mt-3 max-w-xl text-sm text-gray-600 dark:text-gray-300" style={{ animationDelay: "450ms" }}>
            You describe what a feature should do. One model call drafts happy, negative and edge cases. A second call scores how well
            they cover the feature and lists what is missing. Plain code validates and merges everything in between.
          </p>
          <p className="tm-rise mt-3 max-w-xl text-sm text-gray-600 dark:text-gray-300" style={{ animationDelay: "550ms" }}>
            Useful for QA engineers drafting a first suite, developers checking edge cases before shipping, and small teams without a
            dedicated tester.
          </p>
          <div className="tm-rise mt-5 flex flex-wrap items-center gap-3" style={{ animationDelay: "650ms" }}>
            <TryNow />
            <OpenFeatures tab="tech" className="tm-press rounded border px-3 py-2 text-xs hover:bg-amber-50 dark:border-gray-700 dark:hover:bg-gray-800">
              How it&apos;s built
            </OpenFeatures>
          </div>
          <p className="tm-fade mt-3 text-[11px] text-gray-500" style={{ animationDelay: "800ms" }}>
            The panel on the right replays a recorded run. The workspace calls the model for real.
          </p>
        </div>

        <div className="tm-pop" style={{ animationDelay: "300ms" }}>
          <DemoRun />
        </div>
      </section>

    </div>
  );
}
