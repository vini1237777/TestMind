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

export const MODEL = [
  { k: "Model", v: "OpenAI gpt-4o-mini. Fast and cheap enough to call twice per run, and reliable at structured JSON." },
  { k: "Calls per run", v: "Two, each in its own small LangGraph graph: one writes the cases, the other reviews them and scores coverage out of 100. Plain code validates and merges in between." },
  { k: "Output format", v: "JSON mode, then a Zod schema check. Anything that does not match is rejected before it reaches the database or the UI." },
  { k: "Feedback loop", v: "The previous review score and summary go into the next generation prompt, so each run targets what the last one missed." },
];

export const OPTIMISATIONS = [
  { title: "Redis read cache", text: "Project and suite lists are cached in Upstash Redis with short TTLs and stale while revalidate headers." },
  { title: "Rate limiting at the edge", text: "The Next.js proxy allows 10 requests per minute per IP on the API, so one visitor cannot run up the OpenAI bill." },
  { title: "Database index", text: "A compound MongoDB index on projectId and createdAt serves the most common query, a project's newest suites, without a scan." },
  { title: "Small production image", text: "A multi stage Docker build ships only the Next.js standalone output and nothing from the build step." },
  { title: "Two processes, not one", text: "PM2 runs the server in cluster mode with two instances and a memory ceiling, so a crash or a slow request does not take the app down." },
  { title: "Validation before saving", text: "A suite is written to MongoDB only after every graph step succeeds, so a bad model response never leaves half saved data." },
  { title: "Per step tracing", text: "Each graph step records its duration and token count, shown on the suite page after every run." },
  { title: "Error tracking that survives ad blockers", text: "Sentry events go through a first party /monitoring route, so browser extensions do not drop them." },
];

