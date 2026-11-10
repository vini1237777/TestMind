import { test as setup, expect } from "@playwright/test";

// Read by every test through storageState in playwright.config.ts.
const AUTH_FILE = "playwright/.auth/user.json";

// Every run signs up its own account, so tests start signed in and never share data.
setup("sign up a fresh account", async ({ request }) => {
  const stamp = Date.now();
  const res = await request.post("/api/auth/signup", {
    headers: { "x-real-ip": `10.9.${stamp % 250}.${stamp % 200}` },
    data: { email: `e2e-${stamp}@example.com`, password: `e2e-password-${stamp}` },
  });
  expect(res.status()).toBe(201);
  await request.storageState({ path: AUTH_FILE });
});
