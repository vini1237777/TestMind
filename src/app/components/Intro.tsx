import DemoRun from "./DemoRun";
import OpenFeatures from "./OpenFeatures";
import RunExample from "./RunExample";
import HomeActions from "./HomeActions";
import AuthDialog from "./AuthDialog";
import PurposeVideo from "./PurposeVideo";

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

// A real sequence, so it is numbered.
const STEPS = [
  { title: "Describe", text: "Name the feature and write a few lines about what it should do." },
  {
    title: "Generate",
    text: "TestMind writes cases for when it works, when it fails and the odd corners, using the cases already saved in the project.",
  },
  { title: "Review", text: "It scores its own list out of 100, names what is still missing and adds the cases you accept." },
];

export default function Intro({
  email,
  next,
  openAuth,
}: {
  email: string | null;
  next: string | null;
  openAuth: "signin" | "signup" | null;
}) {
  return (
    <div id="landing" className="overflow-x-clip">
      <AuthDialog next={next} openOnLoad={email ? null : openAuth} />

      {/* First screen: what it does and the way in on the left, the product working on the right */}
      <section className="mx-auto grid min-h-[calc(100svh-3rem)] max-w-6xl grid-cols-1 content-center items-center gap-x-[clamp(2.5rem,6vw,5rem)] gap-y-12 px-[clamp(1.25rem,4vw,2rem)] py-[clamp(2rem,6vh,4rem)] lg:grid-cols-[minmax(0,1fr)_minmax(0,29rem)]">
        <div>
          <h1 className="text-[clamp(2.25rem,1.3rem+3vw,3.75rem)] font-semibold leading-[1.04] tracking-[-0.03em]">
            <Words text="Describe a feature." />
            <br />
            <Words text="Get its test cases," start={250} />{" "}
            <span className="tm-word relative inline-block" style={{ animationDelay: "500ms" }}>
              <span aria-hidden className="tm-mark absolute inset-x-0 bottom-[0.1em] -z-10 h-[0.28em] bg-amber-300 dark:bg-amber-400/70" />
              and what they miss.
            </span>
          </h1>
          <p
            className="tm-rise mt-6 max-w-[44ch] text-[clamp(1rem,0.95rem+0.3vw,1.125rem)] leading-relaxed text-slate-600 dark:text-slate-300"
            style={{ animationDelay: "650ms" }}
          >
            Write a few lines about what a feature should do. TestMind writes the test cases, checks its own list and tells you what is
            still missing.
          </p>
          <div className="tm-rise mt-8" style={{ animationDelay: "800ms" }}>
            <HomeActions email={email} next={next} />
          </div>
        </div>

        <figure className="tm-pop relative mx-auto w-full max-w-[29rem] lg:mx-0" style={{ animationDelay: "300ms" }}>
          <div className="relative">
            {/* Offset card behind the panel, echoing the tilted logo tile */}
            <div aria-hidden className="absolute inset-0 translate-x-2.5 translate-y-2.5 rotate-1 rounded-lg bg-amber-300 dark:bg-amber-400/80" />
            <div className="relative">
              <DemoRun />
            </div>
          </div>
          <figcaption className="relative mt-6 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
            <span>A recording of one run, played back.</span>
            <RunExample />
          </figcaption>
        </figure>
      </section>

      {/* What TestMind is for, as a short video */}
      <section id="overview" aria-labelledby="overview-title" className="scroll-mt-16">
        <div className="mx-auto grid max-w-6xl items-center gap-x-[clamp(2.5rem,6vw,4rem)] gap-y-8 px-[clamp(1.25rem,4vw,2rem)] py-[clamp(3rem,8vh,5rem)] lg:grid-cols-[minmax(0,1fr)_minmax(0,40rem)]">
          <div>
            <h2 id="overview-title" className="text-xl font-semibold tracking-tight">
              What TestMind is for
            </h2>
            <p className="mt-3 max-w-[40ch] leading-relaxed text-slate-600 dark:text-slate-300">
              The problem it solves, what it does, how it is built and what it measured, in 19 seconds.
            </p>
            <p className="mt-4 text-xs text-slate-500">No sound. Press a part to jump to it.</p>
          </div>
          <PurposeVideo />
        </div>
      </section>

      {/* How a run goes, in the order it happens */}
      <section aria-labelledby="how-title" className="border-t border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900/40">
        <div className="mx-auto max-w-6xl px-[clamp(1.25rem,4vw,2rem)] py-[clamp(3rem,8vh,5rem)]">
          <h2 id="how-title" className="text-xl font-semibold tracking-tight">
            How a run goes
          </h2>
          <ol className="mt-8 grid gap-8 sm:grid-cols-3 sm:gap-10">
            {STEPS.map((step, i) => (
              <li key={step.title} className="border-t-2 border-black pt-4 dark:border-amber-400">
                <p className="text-sm font-semibold">
                  <span className="mr-2 tabular-nums text-amber-600 dark:text-amber-400">{i + 1}</span>
                  {step.title}
                </p>
                <p className="mt-2 max-w-[36ch] text-sm leading-relaxed text-slate-600 dark:text-slate-300">{step.text}</p>
              </li>
            ))}
          </ol>
          <p className="mt-12 text-xs text-slate-500">
            Built with Next.js, LangGraph and OpenAI. Results export to Playwright, CSV and Markdown.{" "}
            <OpenFeatures tab="tech" className="underline underline-offset-2 hover:text-amber-700">
              How it&apos;s built
            </OpenFeatures>
          </p>
        </div>
      </section>
    </div>
  );
}
