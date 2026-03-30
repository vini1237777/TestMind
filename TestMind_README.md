# TestMind — AI-Powered Test Suite Generator

TestMind converts plain feature descriptions into structured test suites using AI. Built as a QA automation tool that generates happy, negative, and edge case scenarios for web and mobile applications.

**Live:** [testmind-production.up.railway.app](https://testmind-production.up.railway.app/)

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js (App Router), React, TypeScript, Tailwind CSS |
| AI | LangGraph, OpenAI API (`gpt-4o-mini`), structured JSON output |
| Backend | Node.js, MongoDB, Redis |
| Testing | Playwright (E2E), Sentry (error monitoring) |
| DevOps | Docker (multi-stage builds), Railway |

---

## Features

- **AI-generated test suites** — enter a feature name and description, get structured test cases with IDs, types (happy/negative/edge), steps, and expected results
- **Test suite history** — every generation is saved and accessible from a sidebar
- **Latest run preview** — most recent test cases displayed in a dedicated section
- **Responsive dashboard** — stacked layout on mobile, sidebar + detail view on desktop

---

## Architecture & Engineering Decisions

### LangChain → LangGraph Migration
LangChain's single-chain architecture couldn't support multi-step AI workflows. Migrated to **LangGraph** for shared state across generation steps — enabling input validation, structured orchestration, and output reliability checks in a single pipeline.

### Performance Optimization
API responses were timing out at ~40 req/s under load. Introduced **Redis caching** and **rate limiting** to redesign the request pipeline:
- **Throughput:** ~40 req/s → 420+ req/s
- **Latency:** ~2.5s → ~250 ms

### Deployment
Reduced deployment time by **~60%** through Docker multi-stage builds, smaller production images, and streamlined release workflows.

---

## How It Works

1. User enters a **feature name** and **description**
2. Frontend calls `POST /api/generate-tests`
3. Backend builds a QA prompt → calls OpenAI with JSON response format → parses into `TestCase[]`
4. Frontend displays results and saves the suite to history

---

## Core Types

```typescript
type TestCase = {
  id: string;           // TC_1, TC_2, ...
  type: "happy" | "negative" | "edge";
  title: string;
  steps: string[];
  expected: string;
};

type TestSuite = {
  id: string;
  name: string;
  featureName: string;
  description: string;
  createdAt: string;
  testCases: TestCase[];
};
```

---

## Local Setup

```bash
git clone https://github.com/vini1237777/TestMind.git
cd TestMind
npm install
```

Create a `.env.local` file:
```
OPENAI_API_KEY=your_key_here
MONGODB_URI=your_mongodb_uri
REDIS_URL=your_redis_url
```

```bash
npm run dev
```

### Docker
```bash
docker build -f Dockerfile.prod -t testmind .
docker run -p 3000:3000 testmind
```

---


