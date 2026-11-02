import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "TestMind Tech Stack",
  description: "The stack, the AI model and the optimisations behind the TestMind proof of concept.",
};

const REPO = "https://github.com/vini1237777/TestMind";

const RESULTS = [
  { value: "420+ req/s", was: "from about 40", label: "Cached API throughput" },
  { value: "~250 ms", was: "from about 2.5 s", label: "API response time" },
  { value: "281 MB", was: "from 1.18 GB", label: "Docker image size" },
];

const STACK = [
  { group: "Frontend", items: ["Next.js 16 (App Router)", "React 19", "TypeScript", "Tailwind CSS 4"] },
  { group: "AI", items: ["OpenAI gpt-4o-mini", "LangGraph", "Zod schemas"] },
  { group: "Data", items: ["MongoDB with Mongoose", "Upstash Redis"] },
  { group: "Delivery", items: ["Docker (multi stage)", "PM2 cluster mode", "Railway", "Sentry"] },
  { group: "Testing", items: ["Playwright end to end"] },
];

const MODEL = [
  { k: "Model", v: "OpenAI gpt-4o-mini. Fast and cheap enough to call twice per run, and reliable at structured JSON." },
  { k: "Calls per run", v: "Two. One writes the test cases, a second one reviews them and scores coverage out of 100." },
  { k: "Output format", v: "JSON mode, then a Zod schema check. Anything that does not match is rejected before it reaches the database or the UI." },
  { k: "Feedback loop", v: "The previous review score and summary go into the next generation prompt, so each run targets what the last one missed." },
  { k: "Orchestration", v: "Two small LangGraph graphs: Generate then Validate, and Review then Improve. The AI steps and the plain code steps are kept separate." },
];

const OPTIMISATIONS = [
  { title: "Redis read cache", text: "Project and suite lists are cached in Upstash Redis with short TTLs and stale while revalidate headers. This is where the 10x throughput gain came from." },
  { title: "Rate limiting at the edge", text: "The Next.js proxy allows 10 requests per minute per IP on the API, so one visitor cannot run up the OpenAI bill." },
  { title: "Database index", text: "A compound MongoDB index on projectId and createdAt serves the most common query, a project's newest suites, without a scan." },
  { title: "Small production image", text: "A multi stage Docker build ships only the Next.js standalone output, cutting the image from 1.18 GB to 281 MB." },
  { title: "Two processes, not one", text: "PM2 runs the server in cluster mode with two instances and a memory ceiling, so a crash or a slow request does not take the app down." },
  { title: "Validation before saving", text: "A suite is written to MongoDB only after every graph step succeeds, so a bad model response never leaves half saved data." },
  { title: "Per step tracing", text: "Each graph step records its duration and token count. The suite page shows them after every run." },
  { title: "Error tracking that survives ad blockers", text: "Sentry events go through a first party /monitoring route, so browser extensions do not drop them." },
];

export default function TechPage() {
  return (
    <main className="mx-4 max-w-5xl px-4 py-8 md:mx-auto">
      <header className="tm-rise">
        <h1 className="text-2xl font-semibold">How TestMind is built</h1>
        <p className="mt-1 max-w-2xl text-sm text-gray-500 dark:text-gray-400">
          The stack, the AI model and the optimisations behind this proof of concept. Source code and load test notes are on{" "}
          <a href={REPO} target="_blank" rel="noreferrer" className="text-amber-700 underline dark:text-amber-400">
            GitHub
          </a>
          .
        </p>
      </header>

      {/* Measured results */}
      <section className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
        {RESULTS.map((r, i) => (
          <div key={r.label} className="tm-rise rounded border p-4 dark:border-gray-700" style={{ animationDelay: `${100 + i * 80}ms` }}>
            <p className="text-2xl font-semibold text-amber-600 dark:text-amber-400">{r.value}</p>
            <p className="text-xs text-gray-400">{r.was}</p>
            <p className="mt-1 text-sm">{r.label}</p>
          </div>
        ))}
      </section>
      <p className="mt-2 text-[11px] text-gray-400">Measured with autocannon load tests before and after each change.</p>

      {/* Stack */}
      <section className="mt-10">
        <h2 className="text-lg font-semibold">Tech stack</h2>
        <div className="mt-3 divide-y rounded border dark:divide-gray-700 dark:border-gray-700">
          {STACK.map((g) => (
            <div key={g.group} className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center">
              <span className="w-28 shrink-0 text-xs font-semibold uppercase text-gray-500">{g.group}</span>
              <div className="flex flex-wrap gap-1.5">
                {g.items.map((t) => (
                  <span key={t} className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-xs dark:border-gray-700 dark:bg-gray-900">
                    {t}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Model */}
      <section className="mt-10">
        <h2 className="text-lg font-semibold">The AI model and how it is used</h2>
        <dl className="mt-3 divide-y rounded border text-sm dark:divide-gray-700 dark:border-gray-700">
          {MODEL.map((m) => (
            <div key={m.k} className="flex flex-col gap-1 px-4 py-3 sm:flex-row">
              <dt className="w-36 shrink-0 font-semibold">{m.k}</dt>
              <dd className="text-gray-600 dark:text-gray-300">{m.v}</dd>
            </div>
          ))}
        </dl>
      </section>

      {/* Optimisations */}
      <section className="mt-10">
        <h2 className="text-lg font-semibold">Optimisations</h2>
        <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
          {OPTIMISATIONS.map((o) => (
            <div key={o.title} className="rounded border p-4 dark:border-gray-700">
              <p className="text-sm font-semibold">{o.title}</p>
              <p className="mt-1 text-xs leading-relaxed text-gray-500 dark:text-gray-400">{o.text}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
