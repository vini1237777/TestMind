import type { Metadata } from "next";
import { NODE_INFO, WORKFLOWS } from "@/src/lib/ai/graph/topology";

export const metadata: Metadata = {
  title: "TestMind Architecture",
  description: "How TestMind turns a feature spec into a reviewed test suite: LangGraph workflows, schema validated LLM output, rate limiting, caching and tracing.",
};

const SRC = "https://github.com/vini1237777/TestMind/blob/main/";

function Src({ path, children }: { path: string; children?: React.ReactNode }) {
  return (
    <a href={SRC + path} target="_blank" rel="noreferrer" className="font-mono text-[11.5px] text-amber-600 dark:text-amber-400 hover:underline">
      {children ?? path}
    </a>
  );
}

function Box({ title, sub, tone = "default" }: { title: string; sub: string; tone?: "default" | "accent" }) {
  return (
    <div className={`rounded-lg border px-3 py-2.5 bg-rounded-lg border bg-white shadow-sm dark:border-gray-700 dark:bg-gray-900 ${tone === "accent" ? "border-amber-400" : "border-gray-300 dark:border-gray-600"}`}>
      <p className="text-[13px] font-medium">{title}</p>
      <p className="font-mono text-[10.5px] text-gray-400">{sub}</p>
    </div>
  );
}

function Down({ label }: { label?: string }) {
  return (
    <div className="flex items-center gap-2 py-1 pl-6" aria-hidden>
      <span className="h-5 w-px bg-gray-200 dark:bg-gray-700-strong" />
      {label && <span className="font-mono text-[10.5px] text-gray-400">{label}</span>}
    </div>
  );
}

function Section({ id, eyebrow, title, children }: { id: string; eyebrow: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="scroll-mt-20 border-t border-gray-200 dark:border-gray-700 pt-10 mt-10">
      <p className="text-[11px] font-semibold uppercase tracking-widest text-amber-600 dark:text-amber-400">{eyebrow}</p>
      <h2 className=" mt-1 mb-5 text-[26px] font-semibold">{title}</h2>
      {children}
    </section>
  );
}

const GUARDRAILS = [
  { t: "JSON mode + Zod", d: "Every model completion must satisfy a strict contract: 1 to 8 cases, category restricted to happy | negative | edge, and populated step arrays. Malformed responses fail fast before touching the UI.", src: "src/lib/ai/schemas/test-case.ts" },
  { t: "Deterministic nodes", d: "Data normalization and deduplication run in pure TypeScript rather than prompts. Logic matches on category plus normalized title before reindexing IDs.", src: "src/lib/ai/utils/test-case.ts" },
  { t: "Error accumulation", d: "StateGraphs maintain an append only error log. If any node records a fault, the orchestrator aborts the run to prevent partial writes.", src: "src/lib/ai/graph/annotations.ts" },
  { t: "Closed feedback loop", d: "Subsequent generation runs automatically ingest the previous audit score and gap analysis, steering the model toward previously missed edge cases.", src: "src/lib/ai/prompts/generate-tests.ts" },
];

const OPS = [
  { t: "Edge rate limiting", d: "The Next.js proxy enforces an Upstash fixed window limit across /api/* routes at 10 requests per 60s per IP, returning 429 on quota exhaustion.", src: "src/proxy.ts" },
  { t: "Distributed read cache", d: "Project and suite queries cache in Upstash Redis (60 to 300s TTL) paired with s-maxage / stale-while-revalidate headers and an explicit X-Cache diagnostic header.", src: "src/lib/cache.ts" },
  { t: "Compound indexing", d: "A MongoDB compound index on { projectId, createdAt } accelerates the primary workspace access pattern: fetching a project's newest suites first.", src: "src/app/models/TestSuite.ts" },
  { t: "Execution tracing", d: "Every graph node logs execution duration, model identifier, and token count directly into graph state, which the UI renders for each run.", src: "src/lib/ai/graph/trace.ts" },
  { t: "Ad blocker proof telemetry", d: "Sentry instrumentation spans client, server, and edge runtimes, routed through a custom /monitoring tunnel so browser extensions cannot drop error events.", src: "next.config.ts" },
  { t: "Containerized delivery", d: "Multi stage Docker build packaging Next.js standalone output, managed by PM2 in cluster mode (2 instances, 350 MB memory ceiling) on Railway.", src: "Dockerfile.prod" },
];

export default function ArchitecturePage() {
  return (
    <main className="max-w-full mx-4 px-4 py-8">
    <article className="max-w-[980px]">
      <p className="text-[11px] font-semibold uppercase tracking-widest text-amber-600 dark:text-amber-400">system design</p>
      <h1 className=" mt-2 text-[38px] font-semibold leading-[1.05] sm:text-[52px]">Inside the TestMind Engine</h1>
      <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-gray-500 dark:text-gray-400">
        TestMind treats the LLM as a single untrusted step inside a strict, deterministic pipeline. Generation and auditing run as
        two isolated LangGraph workflows. Every model response is validated via Zod, normalized in plain TypeScript, and traced
        for token and latency telemetry.
      </p>

      <nav className="mt-6 flex flex-wrap gap-2 text-[12.5px]" aria-label="On this page">
        {[["system", "System"], ["workflows", "Workflows"], ["guardrails", "LLM guardrails"], ["ops", "Performance & ops"], ["testing", "Testing"]].map(([id, l]) => (
          <a key={id} href={`#${id}`} className="rounded-full border border-gray-200 dark:border-gray-700 px-3 py-1 text-gray-500 dark:text-gray-400 hover:border-amber-400 hover:text-black dark:hover:text-white">{l}</a>
        ))}
      </nav>

      <Section id="system" eyebrow="topology" title="Request lifecycle">
        <div className="rounded-lg border bg-white shadow-sm dark:border-gray-700 dark:bg-gray-900 grid gap-6 p-5 md:grid-cols-[1fr_1fr]">
          <div>
            <Box title="Browser" sub="React 19 App Router client components" />
            <Down label="fetch /api/*" />
            <Box title="Next.js proxy" sub="Upstash rate limit, 10 requests per 60s per IP" tone="accent" />
            <Down />
            <Box title="Route handlers & server actions" sub="input validation, 400 on invalid specs" />
            <Down label="generate / review" />
            <Box title="LangGraph orchestrator" sub="2 compiled StateGraphs with traced execution nodes" tone="accent" />
            <Down />
            <Box title="OpenAI gpt-4o-mini" sub="strict JSON mode → Zod schema enforcement" />
          </div>
          <div className="flex flex-col gap-3 md:pt-[112px]">
            <Box title="MongoDB (Mongoose)" sub="projects, features, test suites" />
            <Box title="Upstash Redis" sub="distributed read cache and rate limiter state" />
            <Box title="Sentry" sub="client, server and edge telemetry" />
            <p className="mt-2 text-[12.5px] leading-relaxed text-gray-500 dark:text-gray-400">
              Database writes occur strictly after the state graph completes without error, guaranteeing that a failed LLM call never persists corrupted or partial suite data.
            </p>
          </div>
        </div>
      </Section>

      <Section id="workflows" eyebrow="orchestration" title="Two graphs, four deterministic nodes">
        <p className="mb-5 max-w-2xl text-[14px] text-gray-500 dark:text-gray-400">
          Graph definitions and UI visualizers share a single source of truth for node identifiers (<Src path="src/lib/ai/graph/topology.ts" />), preventing
          architectural drift. A telemetry wrapper instruments every node for execution timing and token consumption.
        </p>
        <div className="grid gap-4 md:grid-cols-2">
          {(Object.keys(WORKFLOWS) as (keyof typeof WORKFLOWS)[]).map((k) => (
            <div key={k} className="rounded-lg border bg-white shadow-sm dark:border-gray-700 dark:bg-gray-900 p-4">
              <p className=" text-[18px] font-semibold">{WORKFLOWS[k].label}</p>
              <ol className="mt-3 space-y-2">
                {WORKFLOWS[k].nodes.map((n, i) => (
                  <li key={n} className="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 p-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[13px] font-medium"><span className="font-mono text-gray-400 mr-2">{i + 1}</span>{NODE_INFO[n].label}</span>
                      <span className={`font-mono text-[10.5px] ${NODE_INFO[n].kind === "llm" ? "text-amber-600 dark:text-amber-400" : "text-gray-400"}`}>{NODE_INFO[n].kind === "llm" ? "LLM" : "code"}</span>
                    </div>
                    <p className="mt-1.5 text-[12.5px] leading-relaxed text-gray-500 dark:text-gray-400">{NODE_INFO[n].does}</p>
                  </li>
                ))}
              </ol>
            </div>
          ))}
        </div>
        <p className="mt-4 text-[13px] text-gray-500 dark:text-gray-400">
          <span className="text-gray-900 dark:text-white font-medium">Why LangGraph over a linear chain:</span> early prototypes used a single LangChain call. Moving to a typed state machine enabled strict inter node
          validation, decoupled the review loop from initial generation, and unlocked per node observability.
        </p>
      </Section>

      <Section id="guardrails" eyebrow="resilience" title="Defensive LLM guardrails">
        <div className="grid gap-3 sm:grid-cols-2">
          {GUARDRAILS.map((g) => (
            <div key={g.t} className="rounded-lg border bg-white shadow-sm dark:border-gray-700 dark:bg-gray-900 p-4">
              <p className="text-[14px] font-medium">{g.t}</p>
              <p className="mt-1 text-[13px] leading-relaxed text-gray-500 dark:text-gray-400">{g.d}</p>
              <p className="mt-2"><Src path={g.src} /></p>
            </div>
          ))}
        </div>
      </Section>

      <Section id="ops" eyebrow="production ops" title="Performance and infrastructure">
        <div className="rounded-lg border bg-white shadow-sm dark:border-gray-700 dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
          {OPS.map((o) => (
            <div key={o.t} className="grid gap-1 p-4 sm:grid-cols-[180px_1fr_auto] sm:gap-4 sm:items-baseline">
              <p className="text-[13.5px] font-medium">{o.t}</p>
              <p className="text-[13px] leading-relaxed text-gray-500 dark:text-gray-400">{o.d}</p>
              <Src path={o.src}>{o.src.split("/").pop()}</Src>
            </div>
          ))}
        </div>
        <div className="mt-4 grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-200 dark:bg-gray-700 sm:grid-cols-3">
          {[
            { v: "~40 → 420+", k: "cached API throughput (req/s)" },
            { v: "~2.5s → ~250ms", k: "API latency" },
            { v: "1.18 GB → 281 MB", k: "optimized Docker image footprint" },
          ].map((m) => (
            <div key={m.k} className="bg-rounded-lg border bg-white shadow-sm dark:border-gray-700 dark:bg-gray-900 p-4">
              <p className="font-mono text-[18px] font-semibold text-amber-600 dark:text-amber-400">{m.v}</p>
              <p className="mt-1 text-[12px] text-gray-500 dark:text-gray-400">{m.k}</p>
            </div>
          ))}
        </div>
        <p className="mt-2 font-mono text-[11px] text-gray-400">Measured with autocannon load tests, as noted in the repository README.</p>
      </Section>

      <Section id="testing" eyebrow="verification" title="Deterministic end to end verification">
        <p className="max-w-2xl text-[14px] leading-relaxed text-gray-500 dark:text-gray-400">
          Playwright tests execute the full user journey (create project → define feature → generate → audit → merge suggestion) while intercepting
          the three AI endpoints with deterministic fixtures. This keeps runs fast and free while injecting adversarial payloads (uppercase enums, a non array
          <code className="mx-1 font-mono text-[12px] text-gray-900 dark:text-white">suggestions</code>) to verify frontend resilience.
        </p>
        <p className="mt-2"><Src path="tests/e2e/testmind-complete-flow.spec.ts" /></p>
      </Section>
    </article>
    </main>
  );
}
