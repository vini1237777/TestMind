// Shared by the Tech stack page and the Features modal.
export const REPO = "https://github.com/vini1237777/TestMind";

export const RESULTS = [
  { value: "420+ req/s", was: "from about 40", label: "Cached API throughput" },
  { value: "~250 ms", was: "from about 2.5 s", label: "API response time" },
  { value: "281 MB", was: "from 1.18 GB", label: "Docker image size" },
];

export const STACK = [
  { group: "Frontend", items: ["Next.js 16 (App Router)", "React 19", "TypeScript", "Tailwind CSS 4"] },
  { group: "AI", items: ["OpenAI gpt-4o-mini", "LangGraph", "Zod schemas"] },
  { group: "Data", items: ["MongoDB with Mongoose", "Upstash Redis"] },
  { group: "Delivery", items: ["Docker (multi stage)", "PM2 cluster mode", "Railway", "Sentry"] },
  { group: "Testing", items: ["Playwright end to end"] },
];

// One run, left to right. AI steps call gpt-4o-mini; code steps are plain TypeScript.
export const FLOW = [
  { step: "Generate", kind: "AI", note: "drafts cases" },
  { step: "Validate", kind: "code", note: "Zod schema check" },
  { step: "Review", kind: "AI", note: "scores out of 100" },
  { step: "Improve", kind: "code", note: "merges and dedupes" },
];

export const OPTIMISATIONS = [
  {
    group: "Speed",
    items: [
      ["Redis cache", "for project and suite lists"],
      ["Compound index", "on projectId and createdAt"],
    ],
  },
  {
    group: "Cost and safety",
    items: [
      ["Rate limit", "10 requests a minute per IP"],
      ["Save only on success", "no half written suites"],
    ],
  },
  {
    group: "Reliability",
    items: [
      ["PM2 cluster", "two processes, memory capped"],
      ["Sentry via /monitoring", "ad blockers cannot drop errors"],
    ],
  },
  {
    group: "Visibility",
    items: [
      ["Per step tracing", "time and tokens on every run"],
      ["Standalone Docker build", "only what production needs"],
    ],
  },
] as const;
