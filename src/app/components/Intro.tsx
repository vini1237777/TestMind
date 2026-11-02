import Link from "next/link";
import DemoRun from "./DemoRun";
import Reveal from "./Reveal";
import TryNow from "./TryNow";

const STEPS = [
  { title: "Describe", text: "Write what the feature should do, in plain words." },
  { title: "Generate", text: "AI drafts happy, negative and edge cases, checked against a strict schema." },
  { title: "Review", text: "A second AI pass scores coverage out of 100 and lists what is missing." },
  { title: "Export", text: "Merge the suggestions, then download JSON or a Playwright spec." },
];

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
            <Link href="/architecture" className="tm-press rounded border px-3 py-2 text-xs hover:bg-amber-50 dark:border-gray-700 dark:hover:bg-gray-800">
              Architecture notes
            </Link>
          </div>
          <p className="tm-fade mt-3 text-[11px] text-gray-500" style={{ animationDelay: "800ms" }}>
            The panel on the right replays a recorded run. The workspace calls the model for real.
          </p>
        </div>

        <div className="tm-pop" style={{ animationDelay: "300ms" }}>
          <DemoRun />
        </div>
      </section>

      {/* How a run works */}
      <section className="border-t py-8 dark:border-gray-800">
        <Reveal>
          <h3 className="text-lg font-semibold">How a run works</h3>
        </Reveal>
        <ol className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-4">
          {STEPS.map((s, i) => (
            <Reveal key={s.title} delay={i * 120}>
              <li className="tm-lift h-full list-none rounded border p-3 hover:shadow-md dark:border-gray-700">
                <p className="text-sm font-semibold">
                  <span className="mr-2 text-amber-600">{i + 1}</span>
                  {s.title}
                </p>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{s.text}</p>
              </li>
            </Reveal>
          ))}
        </ol>
      </section>
    </div>
  );
}
