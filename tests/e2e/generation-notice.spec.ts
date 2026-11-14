import { test, expect } from "./fixtures";
import { openNewSuite } from "./helpers";

const PAUSED =
  "Generating new test cases is paused right now. This demo runs on free plans, so it can pause until the monthly allowance resets on the 1st. Your projects and saved suites still work.";

test("the suite page explains a paused generation above the Generate button", async ({ page }) => {
  await page.route("/api/generation-status", (route) =>
    route.fulfill({ json: { available: false, message: PAUSED } }),
  );
  await openNewSuite(page, `Notice ${Date.now()}`, "Notice check", `Paused ${Date.now()}`, "Shows the notice.");

  await expect(page.getByRole("status").filter({ hasText: "paused right now" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Generate test cases" })).toBeVisible();
});

test("the notice stays hidden while generation is available", async ({ page }) => {
  await page.route("/api/generation-status", (route) => route.fulfill({ json: { available: true } }));
  await openNewSuite(page, `Notice ${Date.now()}`, "Notice check", `Available ${Date.now()}`, "No notice.");

  await expect(page.getByRole("button", { name: "Generate test cases" })).toBeVisible();
  await expect(page.getByText("paused right now")).toHaveCount(0);
});
