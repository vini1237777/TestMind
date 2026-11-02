import Link from "next/link";
import { FiArrowRight, FiArrowUpRight } from "react-icons/fi";
import DemoRun from "./components/landing/DemoRun";
import { CountUp, Marquee, Reveal, Words } from "./components/landing/motion";

const RIBBON_A = [
  "TC_02 Expired link is rejected",
  "TC_07 Cart total survives a price change",
  "TC_11 Empty search shows suggestions",
  "TC_04 Rate limit returns 429",
  "TC_09 Unicode names save correctly",
];
const RIBBON_B = ["Happy paths", "Negative paths", "Edge cases", "Schema validated", "Traced runs", "Playwright export"];

const STEPS = [
  { n: "01", t: "Describe", d: "Write the feature the way you would write a ticket." },
  { n: "02", t: "Generate", d: "A LangGraph run drafts happy, negative and edge cases. Every reply is checked against a schema." },
  { n: "03", t: "Review", d: "A second run scores coverage out of 100 and proposes the cases you missed." },
  { n: "04", t: "Ship", d: "Accept suggestions, export JSON or a ready Playwright spec file." },
];

const ENGINEERING = [
  { k: "Cached API throughput", v: <><CountUp to={40} /> → <CountUp to={420} suffix="+" /></>, unit: "req/s", note: "Redis read cache plus an edge rate limiter" },
  { k: "API latency", v: <><CountUp to={2.5} decimals={1} suffix="s" /> → <CountUp to={250} suffix="ms" /></>, unit: "", note: "measured with autocannon" },
  { k: "Docker image", v: <><CountUp to={1.18} decimals={2} suffix="GB" /> → <CountUp to={281} suffix="MB" /></>, unit: "", note: "multi stage build of the standalone output" },
  { k: "LangGraph workflows", v: <CountUp to={2} />, unit: "graphs · 4 nodes", note: "each node traced for time and tokens" },
];

export default function LandingPage() {
  return (
    <div className="overflow-x-clip">
      {/* Hero */}
      <section className="mx-auto grid max-w-[1240px] items-center gap-10 px-4 pt-12 pb-16 sm:px-6 lg:grid-cols-[1.1fr_1fr] lg:px-10 lg:pt-20 lg:pb-24">
        <div>
          <p className="eyebrow animate-rise">AI QA engineering workspace</p>
          <h1 className="font-display mt-4 text-[44px] font-extrabold leading-[1.02] sm:text-[60px] lg:text-[68px]">
            <Words text="Your spec goes in." />
            <br />
            <Words text="A reviewed test suite comes out." start={300} highlight="reviewed" />
          </h1>
          <p className="mt-6 max-w-[520px] text-[16.5px] leading-relaxed text-muted animate-rise" style={{ animationDelay: "700ms" }}>
            TestMind writes happy, negative and edge cases from a plain description, reviews its own coverage, and shows you every step of the AI pipeline as it runs.
          </p>
          <div className="mt-8 flex flex-wrap gap-3 animate-rise" style={{ animationDelay: "850ms" }}>
            <Link href="/projects" className="btn btn-primary h-12 px-6 text-[15px]">
              Open the workspace <FiArrowRight />
            </Link>
            <Link href="/architecture" className="btn h-12 px-6 text-[15px]">
              See how it&apos;s built
            </Link>
          </div>
        </div>

        <div className="relative animate-rise" style={{ animationDelay: "400ms" }}>
          <span className="animate-float absolute -top-5 -left-3 z-10 rounded-full border-[1.5px] border-[#111827] bg-white px-3 py-1 font-mono text-[11px] font-semibold text-[#111827] shadow-[2px_2px_0_#111827]" style={{ ["--r" as string]: "-6deg" }}>
            LangGraph
          </span>
          <span className="animate-float absolute -right-3 bottom-24 z-10 rounded-full border-[1.5px] border-[#111827] bg-accent-2 px-3 py-1 font-mono text-[11px] font-semibold text-[#111827] shadow-[2px_2px_0_#111827]" style={{ ["--r" as string]: "5deg", animationDelay: "1.2s" }}>
            Zod checked
          </span>
          <span className="animate-float absolute -bottom-4 left-8 z-10 rounded-full border-[1.5px] border-[#111827] bg-[#111827] px-3 py-1 font-mono text-[11px] font-semibold text-[#fef3c7] shadow-[2px_2px_0_#f59e0b]" style={{ ["--r" as string]: "-3deg", animationDelay: ".6s" }}>
            traced
          </span>
          <DemoRun />
        </div>
      </section>

      {/* Ribbons */}
      <section className="relative py-10" aria-hidden>
        <Marquee items={RIBBON_A} tone="amber" tilt={-2.5} />
        <div className="-mt-2">
          <Marquee items={RIBBON_B} tone="ink" tilt={2} />
        </div>
      </section>

      {/* Steps */}
      <section className="mx-auto max-w-[1240px] px-4 py-16 sm:px-6 lg:px-10">
        <Reveal>
          <p className="eyebrow">How it works</p>
          <h2 className="font-display mt-2 max-w-2xl text-[34px] font-extrabold leading-tight sm:text-[42px]">Four steps, and the AI is only trusted for two of them.</h2>
        </Reveal>
        <ol className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((s, i) => (
            <Reveal key={s.n} delay={i * 110}>
              <li className="panel h-full p-5 transition-transform hover:-translate-y-1" style={{ rotate: `${[-1, 0.8, -0.6, 1][i]}deg` }}>
                <span className="font-display text-[44px] font-extrabold leading-none text-accent">{s.n}</span>
                <p className="mt-3 text-[17px] font-bold">{s.t}</p>
                <p className="mt-1.5 text-[14px] leading-relaxed text-muted">{s.d}</p>
              </li>
            </Reveal>
          ))}
        </ol>
      </section>

      {/* Engineering */}
      <section className="border-y-[1.5px] border-[#111827] bg-[#111827] text-[#f8fafc] dark:border-line">
        <div className="mx-auto max-w-[1240px] px-4 py-16 sm:px-6 lg:px-10">
          <Reveal>
            <p className="font-mono text-[11px] uppercase tracking-[0.08em] text-accent-2">Under the hood</p>
            <h2 className="font-display mt-2 max-w-2xl text-[34px] font-extrabold leading-tight sm:text-[42px]">Built like a production service, not a demo.</h2>
          </Reveal>
          <div className="mt-10 grid gap-px overflow-hidden rounded-2xl border border-white/15 bg-white/15 sm:grid-cols-2 lg:grid-cols-4">
            {ENGINEERING.map((e, i) => (
              <Reveal key={e.k} delay={i * 100} className="bg-[#111827] p-6">
                <p className="font-mono text-[11px] uppercase tracking-wider text-white/55">{e.k}</p>
                <p className="font-display mt-3 text-[28px] font-extrabold text-accent-2">{e.v}</p>
                {e.unit && <p className="font-mono text-[12px] text-white/70">{e.unit}</p>}
                <p className="mt-2 text-[13px] text-white/60">{e.note}</p>
              </Reveal>
            ))}
          </div>
          <Reveal className="mt-8">
            <Link href="/architecture" className="inline-flex items-center gap-1.5 font-semibold text-accent-2 hover:underline">
              Read the full architecture <FiArrowUpRight />
            </Link>
          </Reveal>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-[1240px] px-4 py-20 sm:px-6 lg:px-10">
        <Reveal>
          <div className="panel relative overflow-hidden bg-accent p-8 text-[#1c1301] sm:p-12 dark:border-accent">
            <h2 className="font-display max-w-xl text-[34px] font-extrabold leading-tight sm:text-[44px]">Give it a feature. Watch it find the edge cases.</h2>
            <Link href="/projects" className="btn mt-7 h-12 bg-white px-6 text-[15px] text-[#111827] border-[#111827]">
              Start in the workspace <FiArrowRight />
            </Link>
            <span aria-hidden className="pointer-events-none absolute -right-6 -bottom-10 font-display text-[180px] font-extrabold leading-none text-[#1c1301]/10 select-none">TC</span>
          </div>
        </Reveal>
      </section>
    </div>
  );
}
