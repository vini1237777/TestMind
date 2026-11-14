import Image from "next/image";
import OpenFeatures from "./OpenFeatures";
import HomeActions from "./HomeActions";
import HomeFeatures from "./HomeFeatures";
import RunExample from "./RunExample";
import AuthDialog from "./AuthDialog";
import PurposeVideo from "./PurposeVideo";
import HomeSectionNav from "./HomeSectionNav";
import { CountUp, Reveal, RevealWords } from "./HomeMotion";
import { RESULTS, STACK } from "../lib/tech-info";

const gutter = "px-[clamp(20px,5vw,72px)]";
const wrap = `mx-auto max-w-[1320px] ${gutter}`;
const ink = "bg-[#0b0b0c] text-white";
const LINK = "font-semibold text-blue-600 hover:underline hover:underline-offset-4 dark:text-blue-400";

// Each number is measured, and the README has the method and raw results.
const NUMBERS = [
  {
    tag: "RAG",
    was: "6%",
    now: "56%",
    text: "Project rules covered by the new cases once RAG adds past cases as context.",
    how: "A/B test on a held out set of 20 features, 3 runs each",
  },
  {
    tag: "Background worker",
    was: "5.05 s",
    now: "10 ms",
    text: "Wait before a generation starts, after the AI call moved to a background worker.",
    how: "Measured locally with a stubbed 5 second model call",
  },
  {
    tag: "Lighthouse",
    was: null,
    now: "100",
    text: "Lighthouse performance score of this home page on desktop. On mobile, with slow 4G simulated, it scores 97.",
    how: "Lighthouse 13.6 on the local production build",
  },
];

// One run, in the order it happens.
const FLOW = [
  { title: "You describe a feature", text: "Its name and what it should do, in plain words." },
  { title: "It joins a queue", text: "The API answers at once. A background worker (BullMQ on Redis) runs up to 3 jobs at a time." },
  { title: "RAG finds past cases", text: "Atlas Vector Search picks up to 5 similar saved cases from the same project." },
  { title: "AI writes the cases", text: "gpt-4o-mini writes 1 to 8 cases and Zod checks the format. If OpenAI fails, Gemini answers instead." },
  { title: "AI reviews them", text: "A second step scores coverage out of 100 and lists the cases still missing." },
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
    <div id="landing" data-tab="home" className="flex min-h-screen flex-col overflow-x-clip">
      <AuthDialog next={next} openOnLoad={email ? null : openAuth} />

      <p className={`${ink} px-4 py-2.5 text-center text-[13px] sm:text-sm`}>
        A proof of concept by Vinisha Yadav.{" "}
        <a href="#overview" className="font-semibold text-amber-400 hover:underline hover:underline-offset-4">
          See what it does in 19 seconds →
        </a>
      </p>

      <HomeSectionNav />

      {/* First screen: the promise and the way in on black, the product on the right */}
      <header data-panel="home" className="grid lg:min-h-[max(600px,calc(100svh-8.6rem))] lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)]">
        <div
          className={`${ink} flex flex-col justify-between gap-10 py-12 lg:py-[clamp(32px,6svh,72px)] ${gutter} lg:pl-[max(clamp(20px,5vw,72px),calc((100vw-1320px)/2+clamp(20px,5vw,72px)))]`}
        >
          <div>
            <p className="tm-in-up flex items-center gap-3 font-mono text-xs font-medium uppercase tracking-[.06em]">
              <span aria-hidden className="relative block h-[34px] w-[34px] rounded-full bg-[conic-gradient(#f5b72f,#f0845a,#4779da,#f5b72f)]">
                <span className="absolute inset-[9px] rounded-full bg-[#0b0b0c]" />
              </span>
              A proof of concept
            </p>
            <h1 className="mt-7 text-[clamp(48px,13vw,64px)] font-medium leading-none tracking-[-0.035em] lg:mt-[clamp(16px,3svh,36px)] lg:text-[clamp(48px,min(6.4vw,9svh),96px)]">
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
          <div className="tm-in-up" style={{ animationDelay: "560ms" }}>
            <p className="mb-6 max-w-[40ch] text-[17px] leading-relaxed text-white/85 lg:mb-7 lg:text-[clamp(17px,2.4svh,19px)]">
              Describe a feature in plain words. TestMind writes its test cases, using your project&apos;s past cases as context (RAG). Then it scores the list and tells you which cases are still missing.
            </p>
            <HomeActions email={email} next={next} />
          </div>
        </div>

        <div aria-hidden className="relative h-[300px] overflow-hidden bg-stone-100 lg:h-auto dark:bg-slate-900">
          <Ribbons />
          <div className="tm-float absolute inset-0">
          <div className="tm-in-right absolute left-5 right-5 top-8 overflow-hidden rounded-[14px] bg-white shadow-[0_40px_80px_-30px_rgba(11,11,12,.35),0_0_0_1px_rgba(11,11,12,.08)] lg:left-[8%] lg:right-[8%] lg:top-1/2 lg:-translate-y-1/2">
            <div className="flex h-[30px] items-center gap-[7px] border-b border-stone-200 px-3">
              <i className="h-2.5 w-2.5 rounded-full bg-stone-300" />
              <i className="h-2.5 w-2.5 rounded-full bg-stone-300" />
              <i className="h-2.5 w-2.5 rounded-full bg-stone-300" />
            </div>
            <Image src="/tour/plan.png" width={1856} height={1248} alt="" priority sizes="(max-width: 1024px) 100vw, 640px" className="block h-auto w-full" />
          </div>
          </div>
        </div>
      </header>

      {/* The problem, as one line */}
      <section data-panel="home" className={ink}>
        <div className={`${wrap} py-[clamp(72px,10vw,128px)]`}>
          <RevealWords
            text="AI can draft test cases, but nothing tells you"
            highlight="what they miss."
            className="max-w-[16ch] text-[clamp(36px,5.6vw,84px)] font-medium leading-[1.08] tracking-[-0.03em]"
          />
        </div>
      </section>

      {/* What TestMind is for, as a short video */}
      <section id="overview" data-panel="overview" aria-labelledby="overview-title" className="scroll-mt-14">
        <div className={`${wrap} grid items-center gap-x-[clamp(32px,5vw,72px)] gap-y-8 py-[clamp(32px,4vw,56px)] lg:grid-cols-[minmax(0,1fr)_minmax(0,min(40rem,calc((100svh-15rem)*4/3)))]`}>
          <Reveal>
            <h2 id="overview-title" className="text-[clamp(30px,3vw,44px)] font-medium tracking-[-0.03em]">
              What TestMind is for
            </h2>
            <p className="mt-4 max-w-[40ch] text-[17px] leading-relaxed text-slate-600 dark:text-slate-300">
              A 19 second video: the problem, what TestMind does, how it works and the measured results.
            </p>
            <p className="mt-4 text-sm text-slate-500">With soft music. Press a part to jump to it.</p>
          </Reveal>
          <Reveal delay={150}>
            <PurposeVideo />
          </Reveal>
        </div>
      </section>

      {/* The product, one part at a time */}
      <section id="product" data-panel="product" aria-labelledby="features-title" className="scroll-mt-14">
        <div className={`${wrap} py-[clamp(24px,3vw,40px)]`}>
          <div className="mb-6 flex flex-wrap items-end justify-between gap-x-8 gap-y-2">
            <div>
              <h2 id="features-title" className="text-[clamp(26px,2.6vw,36px)] font-medium tracking-[-0.03em]">
                From a short description to a reviewed list of test cases
              </h2>
            </div>
            <RunExample className={LINK} label="Run the example for real >" />
          </div>
          <Reveal delay={120}>
            <HomeFeatures />
          </Reveal>
        </div>
      </section>

      {/* Measured results, sized to fit one screen */}
      <section id="results" data-panel="results" aria-labelledby="numbers-title" className="scroll-mt-14">
        <div className={`${wrap} py-[clamp(24px,3vw,40px)]`}>
          <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-2">
            <div>
              <h2 id="numbers-title" className="text-[clamp(26px,2.6vw,36px)] font-medium tracking-[-0.03em]">
                Measured results
              </h2>
              <p className="mt-1.5 text-slate-600 dark:text-slate-300">Before and after numbers from real runs.</p>
            </div>
            <a href="https://github.com/vini1237777/TestMind#results" target="_blank" rel="noreferrer" className={LINK}>
              Methods and raw results &gt;
            </a>
          </div>
          <div className="mt-6 grid gap-3 md:grid-cols-3">
            {NUMBERS.map((n, i) => (
              <Reveal
                key={n.now}
                delay={i * 120}
                className="tm-lift flex flex-col rounded-[16px] bg-white p-5 ring-1 ring-stone-200 dark:bg-slate-900 dark:ring-slate-800"
              >
                <span className="self-start rounded-full bg-amber-100 px-2.5 py-1 font-mono text-[11px] font-medium uppercase tracking-[.06em] text-amber-900 dark:bg-amber-400/15 dark:text-amber-300">
                  {n.tag}
                </span>
                <p className="mt-3 whitespace-nowrap text-[clamp(32px,3.2vw,46px)] font-medium leading-none tracking-[-0.035em]">
                  {n.was && (
                    <>
                      <s className="text-[0.55em] font-normal text-slate-400 decoration-2">{n.was}</s>{" "}
                    </>
                  )}
                  <CountUp value={n.now} />
                </p>
                <p className="mt-3 text-[15px] leading-snug text-slate-600 dark:text-slate-300">{n.text}</p>
                <p className="mt-auto pt-3 text-[13px] text-slate-500">
                  <span className="font-medium text-slate-700 dark:text-slate-200">How: </span>
                  {n.how}
                </p>
              </Reveal>
            ))}
          </div>
          <Reveal delay={360} className="mt-3 flex flex-wrap items-center gap-x-10 gap-y-3 rounded-[16px] bg-stone-100 px-5 py-4 dark:bg-slate-900">
            <span className="rounded-full bg-white px-2.5 py-1 font-mono text-[11px] font-medium uppercase tracking-[.06em] text-slate-700 dark:bg-slate-800 dark:text-slate-200">
              Redis cache
            </span>
            {RESULTS.slice(0, 2).map((r) => (
              <p key={r.label} className="text-[15px] text-slate-600 dark:text-slate-300">
                <s className="text-slate-400">{r.was}</s> <b className="text-lg font-semibold text-black dark:text-white">{r.value}</b>{" "}
                <span className="text-sm">{r.label}</span>
              </p>
            ))}
          </Reveal>
        </div>
      </section>

      {/* How one run is built, sized to fit one screen */}
      <section id="built" data-panel="built" aria-labelledby="built-title" className="scroll-mt-14">
        <div className={`${wrap} py-[clamp(24px,3vw,40px)]`}>
          <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-2">
            <div>
              <h2 id="built-title" className="text-[clamp(26px,2.6vw,36px)] font-medium tracking-[-0.03em]">
                What happens when you press Generate
              </h2>
              <p className="mt-1.5 text-slate-600 dark:text-slate-300">Five steps, from your description to a reviewed list of test cases.</p>
            </div>
            <OpenFeatures tab="tech" className={LINK}>
              Every engineering decision &gt;
            </OpenFeatures>
          </div>
          <ol className="mt-5 grid gap-2.5 min-[600px]:grid-cols-2 min-[900px]:grid-cols-5 min-[900px]:gap-0">
            {FLOW.map((step, i) => (
              <Reveal as="li" key={step.title} delay={i * 90} className="relative flex">
                <div
                  className={`tm-lift w-full rounded-[14px] bg-stone-100 p-4 dark:bg-slate-900 ${i < FLOW.length - 1 ? "min-[900px]:mr-5" : ""}`}
                >
                  <span className="flex items-center gap-2.5">
                    <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-amber-400 font-mono text-[11px] font-semibold text-black">
                      {i + 1}
                    </span>
                    <b className="text-[15px] font-semibold leading-tight">{step.title}</b>
                  </span>
                  <span className="mt-2 block text-[13.5px] leading-snug text-slate-600 dark:text-slate-300">{step.text}</span>
                </div>
                {i < FLOW.length - 1 && (
                  <span aria-hidden className="absolute right-0 top-1/2 hidden w-5 -translate-y-1/2 text-center text-slate-400 min-[900px]:block">
                    →
                  </span>
                )}
              </Reveal>
            ))}
          </ol>

          <h3 className="mt-5 font-mono text-xs font-medium uppercase tracking-[.06em] text-slate-500">Built with</h3>
          <dl className="mt-3 grid gap-x-8 gap-y-3 border-t border-stone-200 pt-4 sm:grid-cols-2 lg:grid-cols-3 dark:border-slate-800">
            {STACK.map((g) => (
              <div key={g.group} className="flex flex-wrap items-baseline gap-1.5">
                <dt className="mr-1 text-sm font-semibold">{g.group}</dt>
                {g.items.map((item) => (
                  <dd key={item} className="rounded-md bg-stone-100 px-2 py-0.5 text-[12.5px] text-slate-700 dark:bg-slate-900 dark:text-slate-300">
                    {item}
                  </dd>
                ))}
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* A slim footer on every tab */}
      <footer className={`${ink} mt-auto border-t border-white/10 text-sm`}>
        <div className={`${wrap} flex flex-col gap-4 py-6 sm:flex-row sm:items-center sm:justify-between`}>
          <span className="text-white/70">A proof of concept, designed and built by Vinisha Yadav.</span>
          <span className="flex items-center gap-5">
            <a href="https://github.com/vini1237777/TestMind" target="_blank" rel="noreferrer" className="text-white underline underline-offset-4">
              View the code
            </a>
            <OpenFeatures tab="tech" className="text-white underline underline-offset-4">
              How it&apos;s built
            </OpenFeatures>
          </span>
        </div>
      </footer>
    </div>
  );
}
