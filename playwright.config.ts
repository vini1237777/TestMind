import { defineConfig } from "@playwright/test";

const CI = !!process.env.CI;
// Written by tests/e2e/auth.setup.ts.
const AUTH_FILE = "playwright/.auth/user.json";

export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 90_000,
  retries: 0,
  workers: 1,
  forbidOnly: CI,
  reporter: CI ? [["list"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL: "http://localhost:3000",
    headless: CI,
    trace: CI ? "retain-on-failure" : "on-first-retry",
  },
  projects: [
    { name: "setup", testMatch: /auth\.setup\.ts/ },
    { name: "e2e", dependencies: ["setup"], use: { storageState: AUTH_FILE } },
  ],
  // In CI the workflow starts the built app, the worker and local stand ins for
  // MongoDB, Redis and the model, so this only starts a dev server locally.
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: true,
    timeout: 120_000,
  },
});
