# TestMind — AI-Powered Test Suite Generator

TestMind is an AI-assisted tool that converts plain feature descriptions into structured test suites.  
It is designed as an internal-style QA tool for teams that want to quickly generate happy, negative, and edge case scenarios for web or mobile applications.

Live Demo: https://test-mind.vercel.app/  
Tech Stack: Next.js · TypeScript · Tailwind CSS · OpenAI API

---

## Features

- AI-generated test suites  
  Provide a feature name and description, and TestMind generates realistic test cases using AI.

- Structured test cases  
  Each test case includes:

  - `id` (TC_1, TC_2, …)
  - `type` (`happy | negative | edge`)
  - `title`
  - `steps[]`
  - `expected` result

- Test suite history  
  Every AI generation is saved as a test suite. You can:

  - See all saved suites in a sidebar
  - Click a suite to view its test cases

- Latest run preview  
  The most recently generated test cases are shown in a dedicated section.

- Responsive dashboard layout  
  Works on mobile and desktop — stacked layout on small screens, sidebar + detail view on larger screens.

---

## How it works

1. User enters:
   - Feature Name
   - Feature Description
2. Frontend calls the API endpoint: `POST /api/generate-tests`
3. Backend:
   - Builds a detailed QA prompt
   - Calls OpenAI (`gpt-4o-mini`) with JSON response format
   - Parses the JSON into the `TestCase[]` type
4. Frontend:
   - Displays the latest test cases
   - Saves them as a `TestSuite` in local state
   - Shows suites and details in a simple dashboard

---

## Tech Stack

- Frontend / Fullstack

  - Next.js (App Router)
  - React + TypeScript
  - Tailwind CSS

- AI

  - OpenAI SDK
  - `gpt-4o-mini` with JSON structured output

- Other
  - Vercel deployment
  - Environment-based API key management

---

## Core Types

```ts
export type TestCase = {
  id: string;
  type: "happy" | "negative" | "edge";
  title: string;
  steps: string[];
  expected: string;
};

export type TestSuite = {
  id: string;
  name: string;
  featureName: string;
  description: string;
  createdAt: string;
  testCases: TestCase[];
};
```
