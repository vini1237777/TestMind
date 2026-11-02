import type { Metadata } from "next";
import { NODE_INFO, WORKFLOWS } from "@/src/lib/ai/graph/topology";
import { Page } from "@/src/app/components/shell/AppShell";

export const metadata: Metadata = {
  title: "Architecture · TestMind",
  description: "How TestMind turns a feature spec into a reviewed test suite: LangGraph workflows, schema validated LLM output, rate limiting, caching and tracing.",
};

const SRC = "https://github.com/vini1237777/TestMind/blob/main/";

function Src({ path, children }: { path: string; children?: React.ReactNode }) {
  return (
    <a href={SRC + path} target="_blank" rel="noreferrer" className="font-mono text-[11.5px] text-accent hover:underline">
      {children ?? path}
    </a>
  );
}

function Box({ title, sub, tone = "default" }: { title: string; sub: string; tone?: "default" | "accent" }) {
  return (
    <div className={`rounded-lg border px-3 py-2.5 bg-panel ${tone === "accent" ? "border-accent/50" : "border-line-strong"}`}>
      <p className="text-[13px] font-medium">{title}</p>
      <p className="font-mono text-[10.5px] text-faint">{sub}</p>
    </div>
  );
}

function Down({ label }: { label?: string }) {
  return (
    <div className="flex items-center gap-2 py-1 pl-6" aria-hidden>
      <span className="h-5 w-px bg-line-strong" />
      {label && <span className="font-mono text-[10.5px] text-faint">{label}</span>}
    </div>
  );
}

function Section({ id, eyebrow, title, children }: { id: string; eyebrow: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="scroll-mt-20 border-t border-line pt-10 mt-10">
      <p className="eyebrow">{eyebrow}</p>
      <h2 className="font-display mt-1 mb-5 text-[26px] font-extrabold">{title}</h2>
      {children}
    </section>
  );
}

const GUARDRAILS = [
  { t: "JSON mode + Zod", d: "Every model reply is parsed and validated against a schema: 1 to 8 cases, type ∈ happy | negative | edge, non empty steps. Bad output fails the run instead of reaching the UI.", src: "src/lib/ai/schemas/test-case.ts" },
  { t: "Deterministic nodes", d: "Normalization and dedupe are plain code, not prompts. Dedupe keys on type + normalized title, then renumbers ids.", src: "src/lib/ai/utils/test-case.ts" },
  { t: "Error accumulation", d: "Graph state has an append only errors channel. Orchestrators throw if any node reported one, so partial results are never saved.", src: "src/lib/ai/graph/annotations.ts" },
  { t: "Feedback loop", d: "The last review summary and score are fed into the next generation prompt, so regenerating targets the gaps the reviewer found.", src: "src/lib/ai/prompts/generate-tests.ts" },
];

const OPS = [
  { t: "Rate limiting", d: "Next.js proxy runs an Upstash fixed window limiter on /api/*: 10 requests per 60s per IP, 429 on breach.", src: "src/proxy.ts" },
  { t: "Read cache", d: "Suite and project reads are cached in Redis (60 to 300s TTL) with s-maxage / stale-while-revalidate headers and an X-Cache marker.", src: "src/lib/cache.ts" },
  { t: "Indexes", d: "Compound index on { projectId, createdAt } backs the most common query: a project's suites, newest first.", src: "src/app/models/TestSuite.ts" },
  { t: "Tracing", d: "Each graph node records duration, model and token usage into state. The API returns the trace and the UI renders it per run.", src: "src/lib/ai/graph/trace.ts" },
  { t: "Error monitoring", d: "Sentry on client, server and edge, tunneled through /monitoring so ad blockers don't drop events.", src: "next.config.ts" },
  { t: "Delivery", d: "Multi stage Docker build of Next's standalone output, run by PM2 in cluster mode (2 instances, restart at 350 MB). Deployed on Railway.", src: "Dockerfile.prod" },
];

export default function ArchitecturePage() {
  return (
    <Page>
    <article className="max-w-[980px]">
      <p className="eyebrow">architecture</p>
      <h1 className="font-display mt-2 text-[38px] font-extrabold leading-[1.05] sm:text-[52px]">How TestMind is built</h1>
      <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-muted">
        TestMind treats the LLM as one unreliable step inside a deterministic pipeline. Generation and review are two small
        LangGraph workflows. Model output is schema checked, post processed in plain code, and traced, so every result in
        the UI can be explained.
      </p>

      <nav className="mt-6 flex flex-wrap gap-2 text-[12.5px]" aria-label="On this page">
        {[["system", "System"], ["workflows", "Workflows"], ["guardrails", "LLM guardrails"], ["ops", "Performance & ops"], ["testing", "Testing"], ["next", "Tradeoffs"]].map(([id, l]) => (
          <a key={id} href={`#${id}`} className="rounded-full border border-line px-3 py-1 text-muted hover:border-line-strong hover:text-fg">{l}</a>
        ))}
      </nav>

      <Section id="system" eyebrow="01 · system" title="Request path">
        <div className="panel grid gap-6 p-5 md:grid-cols-[1fr_1fr]">
          <div>
            <Box title="Browser" sub="React 19 · App Router client components" />
            <Down label="fetch /api/*" />
            <Box title="Next.js proxy" sub="Upstash rate limit · 10/60s/IP" tone="accent" />
            <Down />
            <Box title="Route handlers & server actions" sub="input validation · 400 on bad specs" />
            <Down label="generate / review" />
            <Box title="LangGraph orchestrator" sub="2 compiled StateGraphs · traced nodes" tone="accent" />
            <Down />
            <Box title="OpenAI gpt-4o-mini" sub="JSON response format → Zod" />
          </div>
          <div className="flex flex-col gap-3 md:pt-[112px]">
            <Box title="MongoDB (Mongoose)" sub="projects · features · suites" />
            <Box title="Upstash Redis" sub="read cache · limiter state" />
            <Box title="Sentry" sub="client · server · edge" />
            <p className="mt-2 text-[12.5px] leading-relaxed text-muted">
              The route handler persists results only after the graph finishes cleanly, so a failed model call never leaves a half written suite.
            </p>
          </div>
        </div>
      </Section>

      <Section id="workflows" eyebrow="02 · workflows" title="Two graphs, four nodes">
        <p className="mb-5 max-w-2xl text-[14px] text-muted">
          Node names live in one module that both the compiled graphs and this UI import (<Src path="src/lib/ai/graph/topology.ts" />), so the diagram can&apos;t drift from the code.
          Each node is wrapped by a tracer that records timing and token usage.
        </p>
        <div className="grid gap-4 md:grid-cols-2">
          {(Object.keys(WORKFLOWS) as (keyof typeof WORKFLOWS)[]).map((k) => (
            <div key={k} className="panel p-4">
              <p className="font-display text-[18px] font-extrabold">{WORKFLOWS[k].label}</p>
              <ol className="mt-3 space-y-2">
                {WORKFLOWS[k].nodes.map((n, i) => (
                  <li key={n} className="rounded-lg border border-line bg-panel-2/50 p-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[13px] font-medium"><span className="font-mono text-faint mr-2">{i + 1}</span>{NODE_INFO[n].label}</span>
                      <span className={`font-mono text-[10.5px] ${NODE_INFO[n].kind === "llm" ? "text-accent" : "text-faint"}`}>{NODE_INFO[n].kind === "llm" ? "LLM" : "code"}</span>
                    </div>
                    <p className="mt-1.5 text-[12.5px] leading-relaxed text-muted">{NODE_INFO[n].does}</p>
                  </li>
                ))}
              </ol>
            </div>
          ))}
        </div>
        <p className="mt-4 text-[13px] text-muted">
          <span className="text-fg font-medium">Why LangGraph over a single chain:</span> the first version was one LangChain call. Splitting it into
          typed state + nodes made it possible to validate between steps, add the review loop without touching generation, and trace each step separately.
        </p>
      </Section>

      <Section id="guardrails" eyebrow="03 · reliability" title="LLM guardrails">
        <div className="grid gap-3 sm:grid-cols-2">
          {GUARDRAILS.map((g) => (
            <div key={g.t} className="panel p-4">
              <p className="text-[14px] font-medium">{g.t}</p>
              <p className="mt-1 text-[13px] leading-relaxed text-muted">{g.d}</p>
              <p className="mt-2"><Src path={g.src} /></p>
            </div>
          ))}
        </div>
      </Section>

      <Section id="ops" eyebrow="04 · performance & ops" title="Running it in production">
        <div className="panel divide-y divide-line">
          {OPS.map((o) => (
            <div key={o.t} className="grid gap-1 p-4 sm:grid-cols-[180px_1fr_auto] sm:gap-4 sm:items-baseline">
              <p className="text-[13.5px] font-medium">{o.t}</p>
              <p className="text-[13px] leading-relaxed text-muted">{o.d}</p>
              <Src path={o.src}>{o.src.split("/").pop()}</Src>
            </div>
          ))}
        </div>
        <div className="mt-4 grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-line bg-line sm:grid-cols-3">
          {[
            { v: "~40 → 420+", k: "cached API throughput (req/s)" },
            { v: "~2.5s → ~250ms", k: "API latency" },
            { v: "1.18 GB → 281 MB", k: "Docker image, multi stage build" },
          ].map((m) => (
            <div key={m.k} className="bg-panel p-4">
              <p className="font-mono text-[18px] font-semibold text-accent">{m.v}</p>
              <p className="mt-1 text-[12px] text-muted">{m.k}</p>
            </div>
          ))}
        </div>
        <p className="mt-2 font-mono text-[11px] text-faint">Figures from load tests with autocannon, as documented in the README.</p>
      </Section>

      <Section id="testing" eyebrow="05 · testing" title="Deterministic end to end tests">
        <p className="max-w-2xl text-[14px] leading-relaxed text-muted">
          The Playwright suite drives the real UI (create project → add feature → generate → review → accept a suggestion) but intercepts the three AI
          routes with fixtures. That keeps the test fast, free and deterministic, and it deliberately feeds malformed shapes (uppercase types, a non array
          <code className="mx-1 font-mono text-[12px] text-fg">suggestions</code>) to prove the UI tolerates them.
        </p>
        <p className="mt-2"><Src path="tests/e2e/testmind-complete-flow.spec.ts" /></p>
      </Section>

      <Section id="next" eyebrow="06 · tradeoffs" title="What I&apos;d do next">
        <ul className="space-y-2 text-[14px] text-muted">
          {[
            ["Stream node progress", "The trace arrives when the run ends. Streaming graph events over SSE would light up each node as it finishes."],
            ["Prompt regression evals", "A fixed set of specs with expected coverage, run in CI, so a prompt or model change can't silently lower quality."],
            ["Sliding window limits per route", "One fixed window for all of /api/* is simple but treats a cheap read like an LLM call."],
            ["Auth and multi tenancy", "Projects are global today; scoping by user is the first step to a real product."],
          ].map(([t, d]) => (
            <li key={t} className="flex gap-3"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" /><span><span className="text-fg font-medium">{t}.</span> {d}</span></li>
          ))}
        </ul>
      </Section>
    </article>
    </Page>
  );
}
