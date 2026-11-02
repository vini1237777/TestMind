import Link from "next/link";

const AUDIENCE = [
  { icon: "🧪", title: "QA engineers", text: "Get a first draft of test cases for a new feature in seconds, then refine it." },
  { icon: "💻", title: "Developers", text: "See the negative and edge cases before you ship, not after a bug report." },
  { icon: "👥", title: "Small teams", text: "No dedicated QA? Get structured, reviewable test suites from a short spec." },
];

const STEPS = [
  { n: "1", text: "Describe a feature in plain words" },
  { n: "2", text: "AI drafts happy, negative and edge cases" },
  { n: "3", text: "A second AI pass scores coverage and suggests gaps" },
  { n: "4", text: "Export as JSON or a Playwright spec" },
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
    <section className="mx-4 px-4 pt-8">
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 dark:border-gray-700 dark:bg-gray-900">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-amber-600 dark:text-amber-400 tm-fade">AI · QA Automation</p>
        <h2 className="mt-2 text-2xl font-semibold md:text-3xl">
          <Words text="Turn a feature description into a reviewed test suite." />
        </h2>
        <p className="mt-2 max-w-2xl text-sm text-gray-600 dark:text-gray-300 tm-rise" style={{ animationDelay: "450ms" }}>
          TestMind is a QA tool that writes test cases for you. Describe what a feature should do, and it generates happy, negative and edge cases,
          then reviews its own work and tells you what is still missing.
        </p>

        <div className="mt-6 grid grid-cols-1 gap-3 md:grid-cols-3">
          {AUDIENCE.map((a, i) => (
            <div
              key={a.title}
              className="tm-rise tm-lift rounded-lg border border-amber-100 bg-white p-4 hover:shadow-md dark:border-gray-700 dark:bg-gray-800"
              style={{ animationDelay: `${550 + i * 100}ms` }}
            >
              <p className="text-sm font-semibold">
                <span className="mr-1.5">{a.icon}</span>For {a.title}
              </p>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{a.text}</p>
            </div>
          ))}
        </div>

        <ol className="mt-5 flex flex-wrap gap-2">
          {STEPS.map((s, i) => (
            <li
              key={s.n}
              className="tm-rise flex items-center gap-2 rounded-full border border-amber-200 bg-white px-3 py-1 text-xs text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
              style={{ animationDelay: `${900 + i * 90}ms` }}
            >
              <span className="grid h-5 w-5 place-items-center rounded-full bg-amber-500 text-[10px] font-bold text-white dark:bg-gray-200 dark:text-black">{s.n}</span>
              {s.text}
            </li>
          ))}
        </ol>

        <Link href="/architecture" className="mt-4 inline-block text-xs text-amber-700 underline hover:text-amber-500 dark:text-amber-400">
          How it&apos;s built →
        </Link>
      </div>
    </section>
  );
}
