import Image from "next/image";
import OpenFeatures from "./OpenFeatures";
import HomeActions from "./HomeActions";
import HomeFeatures from "./HomeFeatures";
import AuthDialog from "./AuthDialog";
import PurposeVideo from "./PurposeVideo";
import { CountUp, Reveal, RevealWords } from "./HomeMotion";

const gutter = "px-[clamp(20px,5vw,72px)]";
const wrap = `mx-auto max-w-[1320px] ${gutter}`;
const ink = "bg-[#0b0b0c] text-white";

// Each number is measured, and the README has the method and raw results.
const NUMBERS = [
  { was: "6%", now: "56%", text: "Project rules covered when saved cases are used as context, on a held out dataset of 20 features." },
  { was: "5.05 s", now: "10 ms", text: "To start a generation, once the slow part moved to a background worker." },
  { was: null, now: "100", text: "Lighthouse performance score for the home page, on mobile and desktop." },
];

// One run, in the order it happens.
const FLOW = [
  { title: "Feature", text: "written in plain words" },
  { title: "Background worker", text: "BullMQ on Redis, 3 jobs at once" },
  { title: "Vector search", text: "brings in the project's saved cases" },
  { title: "LangGraph", text: "gpt-4o-mini writes, Zod checks, Gemini as backup" },
  { title: "Review", text: "a score out of 100 and the missing cases" },
];

function Ribbons() {
  return (
    <svg aria-hidden className="absolute inset-0 h-full w-full" viewBox="0 0 700 720" preserveAspectRatio="xMidYMid slice">
      <defs>
        <linearGradient id="tm-r1" x1="0" x2="1">
          <stop offset="0" stopColor="#f5b72f" stopOpacity=".55" />
          <stop offset=".5" stopColor="#f0845a" stopOpacity=".35" />
          <stop offset="1" stopColor="#4779da" stopOpacity=".45" />
        </linearGradient>
        <linearGradient id="tm-r2" x1="1" x2="0">
          <stop offset="0" stopColor="#4779da" stopOpacity=".4" />
          <stop offset="1" stopColor="#f5b72f" stopOpacity=".45" />
        </linearGradient>
      </defs>
      <path d="M140 -40 C 300 160, 520 210, 760 170 L 760 300 C 520 330, 260 250, 60 -40 Z" fill="url(#tm-r1)" className="tm-drift-a" />
      <path d="M-40 650 C 160 560, 380 560, 560 760 L 420 760 C 300 640, 140 620, -40 700 Z" fill="url(#tm-r2)" className="tm-drift-b" />
    </svg>
  );
}

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

      <p className={`${ink} px-4 py-2.5 text-center text-[13px] sm:text-sm`}>
        New: what TestMind is for, in 19 seconds.{" "}
        <a href="#overview" className="font-semibold text-amber-400 hover:underline hover:underline-offset-4">
          Watch the overview →
        </a>
      </p>

      {/* First screen: the promise and the way in on black, the product on the right */}
      <header className="grid lg:min-h-[max(640px,calc(100svh-5.5rem))] lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)]">
        <div
          className={`${ink} flex flex-col justify-between py-12 lg:py-[72px] ${gutter} lg:pl-[max(clamp(20px,5vw,72px),calc((100vw-1320px)/2+clamp(20px,5vw,72px)))]`}
        >
          <div>
            <p className="tm-in-up flex items-center gap-3 font-mono text-xs font-medium uppercase tracking-[.06em]">
              <span aria-hidden className="relative block h-[34px] w-[34px] rounded-full bg-[conic-gradient(#f5b72f,#f0845a,#4779da,#f5b72f)]">
                <span className="absolute inset-[9px] rounded-full bg-[#0b0b0c]" />
              </span>
              For QA engineers and developers
            </p>
            <h1 className="mt-7 text-[clamp(48px,13vw,64px)] font-medium leading-none tracking-[-0.035em] lg:mt-9 lg:text-[clamp(52px,6.4vw,96px)]">
              <span className="tm-in-up block" style={{ animationDelay: "120ms" }}>
                Test cases,
              </span>
              <span className="tm-in-up block" style={{ animationDelay: "240ms" }}>
                <span className="tm-grad">and what</span>
              </span>
              <span className="tm-in-up block" style={{ animationDelay: "360ms" }}>
                <span className="tm-grad">they miss.</span>
              </span>
            </h1>
          </div>
          <div className="tm-in-up mt-14 lg:mt-0" style={{ animationDelay: "560ms" }}>
            <p className="mb-6 max-w-[40ch] text-[17px] leading-relaxed text-white/85 lg:mb-7 lg:text-[19px]">
              Describe a feature in a few lines. TestMind writes the cases, scores its own list and names what is still missing.
            </p>
            <HomeActions email={email} next={next} place="hero" />
          </div>
        </div>

        <div aria-hidden className="relative h-[300px] overflow-hidden bg-stone-100 lg:h-auto dark:bg-slate-900">
          <Ribbons />
          <div className="tm-float absolute inset-0">
          <div className="tm-in-right absolute left-5 right-[-40%] top-8 overflow-hidden rounded-[14px] bg-white shadow-[0_40px_80px_-30px_rgba(11,11,12,.35),0_0_0_1px_rgba(11,11,12,.08)] lg:left-[9%] lg:right-[-14%] lg:top-1/2 lg:-translate-y-1/2">
            <div className="flex h-[30px] items-center gap-[7px] border-b border-stone-200 px-3">
              <i className="h-2.5 w-2.5 rounded-full bg-stone-300" />
              <i className="h-2.5 w-2.5 rounded-full bg-stone-300" />
              <i className="h-2.5 w-2.5 rounded-full bg-stone-300" />
            </div>
            <Image src="/tour/plan.png" width={1856} height={1248} alt="" priority sizes="(max-width: 1024px) 140vw, 760px" className="block h-auto w-full" />
          </div>
          </div>
        </div>
      </header>

      {/* The problem, as one line */}
      <section className={ink}>
        <div className={`${wrap} py-[clamp(72px,10vw,128px)]`}>
          <RevealWords
            text="AI can draft test cases, but nothing tells you"
            highlight="what they miss."
            className="max-w-[16ch] text-[clamp(36px,5.6vw,84px)] font-medium leading-[1.08] tracking-[-0.03em]"
          />
        </div>
      </section>

      {/* What TestMind is for, as a short video */}
      <section id="overview" aria-labelledby="overview-title" className="scroll-mt-4 border-b border-stone-200 dark:border-slate-800">
        <div className={`${wrap} grid items-center gap-x-[clamp(32px,5vw,72px)] gap-y-8 py-[clamp(64px,8vw,104px)] lg:grid-cols-[minmax(0,1fr)_minmax(0,40rem)]`}>
          <Reveal>
            <h2 id="overview-title" className="text-[clamp(30px,3vw,44px)] font-medium tracking-[-0.03em]">
              What TestMind is for
            </h2>
            <p className="mt-4 max-w-[40ch] text-[17px] leading-relaxed text-slate-600 dark:text-slate-300">
              The problem it solves, what it does, how it is built and what it measured, in 19 seconds.
            </p>
            <p className="mt-4 text-sm text-slate-500">No sound. Press a part to jump to it.</p>
          </Reveal>
          <Reveal delay={150}>
            <PurposeVideo />
          </Reveal>
        </div>
      </section>

      {/* The product, one part at a time */}
      <section aria-labelledby="features-title">
        <div className={`${wrap} py-[clamp(72px,9vw,112px)]`}>
          <Reveal>
            <h2 id="features-title" className="mb-8 max-w-[20ch] text-[clamp(36px,4vw,56px)] font-medium leading-[1.08] tracking-[-0.03em] lg:mb-16">
              From a few lines to a reviewed test suite
            </h2>
          </Reveal>
          <Reveal delay={120}>
            <HomeFeatures />
          </Reveal>
        </div>
      </section>

      {/* Measured results */}
      <section aria-labelledby="numbers-title" className="border-t border-stone-200 dark:border-slate-800">
        <div className={`${wrap} py-[clamp(64px,8vw,96px)]`}>
          <h2 id="numbers-title" className="font-mono text-xs font-medium uppercase tracking-[.06em] text-slate-500">
            Measured, not guessed
          </h2>
          <div className="mt-10 grid gap-8 sm:grid-cols-3 sm:gap-10">
            {NUMBERS.map((n, i) => (
              <Reveal key={n.now} delay={i * 120} className="border-t-2 border-black pt-5 dark:border-white">
                <p className="text-[clamp(44px,4.6vw,68px)] font-medium leading-none tracking-[-0.035em]">
                  {n.was && (
                    <>
                      <s className="font-normal text-slate-400 decoration-[3px]">{n.was}</s>{" "}
                    </>
                  )}
                  <CountUp value={n.now} />
                </p>
                <p className="mt-3.5 max-w-[30ch] leading-relaxed text-slate-600 dark:text-slate-300">{n.text}</p>
              </Reveal>
            ))}
          </div>
          <p className="mt-10 text-sm text-slate-500">
            Measured locally. Methods and raw results are in the{" "}
            <a href="https://github.com/vini1237777/TestMind#results" target="_blank" rel="noreferrer" className="underline underline-offset-2 hover:text-black dark:hover:text-white">
              README
            </a>
            .
          </p>
        </div>
      </section>

      {/* How one run is built */}
      <section aria-labelledby="built-title" className="bg-stone-100 dark:bg-slate-900">
        <div className={`${wrap} py-[clamp(64px,8vw,96px)]`}>
          <h2 id="built-title" className="mb-10 text-[clamp(30px,3vw,44px)] font-medium tracking-[-0.03em]">
            How it is built
          </h2>
          <ol className="grid gap-3 lg:grid-cols-5">
            {FLOW.map((step, i) => (
              <Reveal
                as="li"
                key={step.title}
                delay={i * 90}
                className="tm-lift grid grid-cols-[40px_1fr] rounded-[14px] bg-white p-4 ring-1 ring-stone-200 lg:block lg:p-5 dark:bg-slate-950 dark:ring-slate-800"
              >
                <span className="row-span-2 mt-0.5 font-mono text-xs font-medium text-blue-600 lg:mb-5 lg:block dark:text-blue-400">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <b className="block text-[17px] font-semibold">{step.title}</b>
                <span className="mt-1.5 block text-[14.5px] leading-normal text-slate-600 dark:text-slate-300">{step.text}</span>
              </Reveal>
            ))}
          </ol>
          <OpenFeatures tab="tech" className="mt-8 font-semibold text-blue-600 hover:underline hover:underline-offset-4 dark:text-blue-400">
            Read how it&apos;s built &gt;
          </OpenFeatures>
        </div>
      </section>

      {/* The way in again */}
      <section className={ink}>
        <div className={`${wrap} pb-14 pt-[clamp(72px,9vw,104px)]`}>
          <Reveal>
            <h2 className="text-[clamp(44px,5.6vw,84px)] font-medium leading-[1.02] tracking-[-0.035em]">
              See what your
              <br />
              <span className="tm-grad">tests miss.</span>
            </h2>
          </Reveal>
          <Reveal delay={150} className="mt-10">
            <HomeActions email={email} next={next} place="closing" />
          </Reveal>
          <footer className="mt-16 flex flex-col justify-between gap-4 border-t border-white/15 pt-6 text-sm text-white/70 sm:flex-row lg:mt-24">
            <span>Designed and built by Vinisha Yadav.</span>
            <span className="flex gap-5">
              <a href="https://github.com/vini1237777/TestMind" target="_blank" rel="noreferrer" className="text-white underline underline-offset-4">
                GitHub
              </a>
              <OpenFeatures tab="tech" className="text-white underline underline-offset-4">
                How it&apos;s built
              </OpenFeatures>
            </span>
          </footer>
        </div>
      </section>
    </div>
  );
}
