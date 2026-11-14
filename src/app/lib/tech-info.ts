// Shared by the Tech stack page and the Features modal. Kept in line with the README.
export const REPO = "https://github.com/vini1237777/TestMind";

// Measured locally on an Apple M2, see "Results" in the README. Production differs.
export const RESULTS = [
  { value: "234 req/s", was: "159 req/s", label: "Suite list throughput, cache on" },
  { value: "198 ms", was: "294 ms", label: "Suite list p50 latency, cache on" },
  { value: "10 ms", was: "5.05 s", label: "Start a generation, background worker" },
];

export const STACK = [
  { group: "Frontend", items: ["Next.js 16 (App Router)", "React 19", "TypeScript", "Tailwind CSS 4"] },
  { group: "AI", items: ["OpenAI gpt-4o-mini", "Gemini fallback", "LangGraph", "Zod schemas"] },
  { group: "Retrieval", items: ["MongoDB Atlas Vector Search", "text-embedding-3-small, 256 dimensions"] },
  { group: "Data", items: ["MongoDB with Mongoose", "BullMQ on Redis", "Upstash Redis"] },
  { group: "Delivery", items: ["Docker (multi stage)", "PM2", "Railway", "Sentry"] },
  { group: "Testing", items: ["Playwright end to end", "Node unit tests", "k6 load tests", "Lighthouse"] },
];

// One run, in order. Generation and review are two LangGraph workflows.
export const FLOW = [
  "The API saves a job and answers at once. A separate worker runs up to 3 generations at a time.",
  "Atlas Vector Search finds up to 5 similar saved cases in the same project and passes them to the model as context.",
  "gpt-4o-mini drafts 1 to 8 cases in JSON mode. If OpenAI fails or its answer fails the Zod schema, Gemini answers the same prompt.",
  "Code checks every case. A bad response stops the run, so nothing half written is saved.",
  "A second workflow scores coverage out of 100 and suggests missing cases. Code merges the ones you accept and drops duplicates.",
];

export const OPTIMISATIONS = [
  {
    group: "Speed",
    items: [
      ["Background worker", "the API answers in about 10 ms"],
      ["Redis cache", "for project and suite lists"],
      ["Compound index", "on projectId and createdAt"],
    ],
  },
  {
    group: "Cost and safety",
    items: [
      ["Rate limit", "10 requests a minute per IP"],
      ["Queue cap", "new jobs are refused past 50 waiting"],
      ["Save only on success", "no half written suites"],
    ],
  },
  {
    group: "Reliability",
    items: [
      ["Gemini fallback", "no retry before the switch"],
      ["Rate limit fallback", "counted in memory when Redis cannot answer"],
      ["Quiet worker", "checks an empty queue every 5 minutes"],
      ["PM2", "2 web processes and 1 worker, memory capped"],
      ["Sentry via /monitoring", "ad blockers cannot drop errors"],
    ],
  },
  {
    group: "Visibility",
    items: [
      ["Per step tracing", "time, model and tokens on every run"],
      ["Standalone Docker build", "only what production needs"],
    ],
  },
] as const;
