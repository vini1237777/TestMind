import Link from "next/link";
import { FiArrowRight } from "react-icons/fi";
import DemoRun from "./components/landing/DemoRun";
import { Reveal, Words } from "./components/landing/motion";

/* Hand drawn arrow, slightly wobbly on purpose. */
function Squiggle({ className = "", flip = false }: { className?: string; flip?: boolean }) {
  return (
    <svg viewBox="0 0 120 60" className={className} style={flip ? { transform: "scaleX(-1)" } : undefined} aria-hidden fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 8 C 30 4, 52 14, 62 30 S 92 54, 112 46" />
      <path d="M100 38 L 113 46 L 99 53" />
    </svg>
  );
}

// Real milestones from the git history of this repo.
const LOG = [
  { date: "15 Nov 2025", title: "Started with one textarea and a button", note: "Create Next App, a sidebar and a suite history. By the next day OpenAI was returning real test cases as JSON." },
  { date: "20 Nov 2025", title: "Taught it to review itself", note: "Added the feedback review: a second call that scores coverage and suggests missing cases. This is still my favourite part." },
  { date: "26 Nov 2025", title: "Docker and Railway, round one", note: "A run of \"Fix Railway\" commits before the app finally listened on 0.0.0.0 instead of localhost. Lesson learned." },
  { date: "4 Dec 2025", title: "Redis cache and a rate limiter", note: "The limit started at 5 requests a minute, which annoyed even me, so it is 10 now. Cached reads went from about 40 to 420+ req/s." },
  { date: "6 Dec 2025", title: "The PM2 day", note: "A long list of commits named some version of \"Changes for Dockerfile.prod for cluster\" until PM2 cluster mode ran inside the container. Also added the database indexes that day." },
  { date: "13 Mar 2026", title: "Rewrote the AI layer with LangGraph", note: "My first attempt got reverted the same day. The second one split everything into typed nodes, Zod schemas and shared state." },
  { date: "Nov 2026", title: "Made every run visible", note: "Each graph node now reports its time and tokens, and the UI draws the pipeline as it runs. Also this page." },
];

const TODO = [
  "Stream each node's progress live instead of showing it when the run ends",
  "A small eval set in CI so a prompt change can't quietly make the tests worse",
  "Accounts, so projects are not shared by everyone",
];

export default function LandingPage() {
  return (
    <div className="overflow-x-clip">
      {/* Hero */}
      <section className="mx-auto grid max-w-[1240px] items-start gap-12 px-4 pt-12 pb-20 sm:px-6 lg:grid-cols-[1.05fr_1fr] lg:px-10 lg:pt-20">
        <div className="lg:pt-6">
          <p className="font-hand text-[26px] font-bold leading-none text-accent animate-rise">a QA tool I built for myself</p>
          <h1 className="font-display mt-3 text-[44px] font-extrabold leading-[1.02] sm:text-[60px] lg:text-[66px]">
            <Words text="Drop in a raw spec." />
            <br />
            <Words text="Ship a reviewed test suite." start={300} highlight="reviewed" />
          </h1>
          <p className="mt-6 max-w-[520px] text-[17px] leading-relaxed text-muted animate-rise" style={{ animationDelay: "700ms" }}>
            I kept writing the same happy path tests and forgetting the weird ones. So TestMind drafts the happy, negative and edge cases from a plain
            description, then a second pass reviews them and points out what I missed.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3 animate-rise" style={{ animationDelay: "850ms" }}>
            <Link href="/projects" className="btn btn-primary h-12 px-6 text-[15px]">
              Try it <FiArrowRight />
            </Link>
            <Link href="/architecture" className="btn h-12 px-6 text-[15px]">
              How I built it
            </Link>
          </div>
        </div>

        <div className="relative animate-rise" style={{ animationDelay: "400ms" }}>
          {/* margin notes */}
          <div className="pointer-events-none absolute -top-10 right-2 hidden items-end gap-1 text-muted sm:flex" aria-hidden>
            <span className="font-hand text-[22px] leading-tight -rotate-3">four real graph nodes</span>
            <Squiggle className="h-8 w-14 rotate-[70deg] translate-y-3" />
          </div>
          <div className="rotate-[0.6deg]">
            <DemoRun />
          </div>
          <div className="pointer-events-none mt-3 hidden items-start gap-1 pl-6 text-muted sm:flex" aria-hidden>
            <Squiggle className="h-8 w-16 -scale-y-100 -rotate-12" flip />
            <span className="font-hand text-[22px] leading-tight rotate-1">it grades its own work. it is not always generous</span>
          </div>
        </div>
      </section>

      {/* How it works, written as a short paragraph list instead of cards */}
      <section className="border-y-[1.5px] border-fg bg-panel-2 dark:border-line">
        <div className="mx-auto grid max-w-[1240px] gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[320px_1fr] lg:px-10">
          <Reveal>
            <h2 className="font-display text-[34px] font-extrabold leading-tight">What happens when you press generate</h2>
            <p className="font-hand mt-3 text-[22px] text-accent">the AI only gets trusted twice</p>
          </Reveal>
          <ol className="space-y-6">
            {[
              ["You describe a feature", "Like a ticket. Rules, limits, what should never happen."],
              ["The model drafts cases", "gpt-4o-mini in JSON mode. Anything that does not match the Zod schema fails the run instead of showing up half broken."],
              ["Plain code cleans up", "IDs get normalised and duplicates removed. No prompt involved, so it is predictable and free."],
              ["A second pass reviews", "It scores coverage out of 100 and suggests what is missing. You accept or reject each one."],
              ["You take it with you", "Download JSON, or a Playwright spec skeleton with one test per case, ready to fill in."],
            ].map(([t, d], i) => (
              <Reveal key={t} delay={i * 80}>
                <li className="grid grid-cols-[44px_1fr] gap-3">
                  <span className="grid h-9 w-9 place-items-center rounded-full border-[1.5px] border-fg bg-accent font-display font-extrabold text-[#1c1301] dark:border-accent">{i + 1}</span>
                  <div>
                    <p className="text-[17px] font-bold">{t}</p>
                    <p className="mt-0.5 text-[15px] leading-relaxed text-muted">{d}</p>
                  </div>
                </li>
              </Reveal>
            ))}
          </ol>
        </div>
      </section>

      {/* Build log */}
      <section className="mx-auto max-w-[1240px] px-4 py-20 sm:px-6 lg:px-10">
        <Reveal>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <h2 className="font-display text-[34px] font-extrabold leading-tight sm:text-[42px]">Build log</h2>
            <a href="https://github.com/vini1237777/TestMind/commits/main" target="_blank" rel="noreferrer" className="font-hand text-[22px] text-muted hover:text-accent">
              all 138 commits are on GitHub →
            </a>
          </div>
        </Reveal>

        <ol className="relative mt-10 border-l-[1.5px] border-dashed border-line-strong pl-6 sm:pl-10">
          {LOG.map((e, i) => (
            <Reveal key={e.date} delay={60}>
              <li className="relative pb-10">
                <span className="absolute -left-[31px] top-1.5 h-3.5 w-3.5 rounded-full border-[1.5px] border-fg bg-accent sm:-left-[47px] dark:border-accent" aria-hidden />
                <p className="font-mono text-[12px] text-muted">{e.date}</p>
                <p className="mt-1 text-[19px] font-bold">{e.title}</p>
                <p className="mt-1 max-w-[640px] text-[15px] leading-relaxed text-muted">{e.note}</p>
                {i === 4 && <p className="font-hand mt-1 text-[21px] text-accent -rotate-1">do not ask about this day</p>}
              </li>
            </Reveal>
          ))}
        </ol>
      </section>

      {/* Note + todo */}
      <section className="mx-auto grid max-w-[1240px] gap-8 px-4 pb-20 sm:px-6 lg:grid-cols-[1.2fr_1fr] lg:px-10">
        <Reveal>
          <div className="panel h-full -rotate-[0.4deg] p-7 sm:p-9">
            <p className="text-[16px] leading-relaxed">
              TestMind is a side project, not a startup. I use it to try ideas I can&apos;t always try at work: graph based LLM workflows, strict
              output validation, tracing, and keeping a small app fast and cheap to run. If something looks over engineered, it probably is, on purpose.
            </p>
            <p className="font-hand mt-5 text-[30px] font-bold leading-none">Vinisha</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/projects" className="btn btn-primary">Open the workspace <FiArrowRight /></Link>
              <a href="https://github.com/vini1237777/TestMind" target="_blank" rel="noreferrer" className="btn">Read the code</a>
            </div>
          </div>
        </Reveal>
        <Reveal delay={120}>
          <div className="h-full rounded-[14px] border-[1.5px] border-dashed border-line-strong p-7 sm:p-9">
            <h3 className="font-display text-[22px] font-extrabold">Still on my list</h3>
            <ul className="mt-4 space-y-3">
              {TODO.map((t) => (
                <li key={t} className="flex gap-3 text-[15px] leading-relaxed text-muted">
                  <span className="mt-1 h-4 w-4 shrink-0 rounded border-[1.5px] border-line-strong" aria-hidden />
                  {t}
                </li>
              ))}
            </ul>
          </div>
        </Reveal>
      </section>
    </div>
  );
}
