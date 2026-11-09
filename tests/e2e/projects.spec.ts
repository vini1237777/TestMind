import { test, expect } from "@playwright/test";

async function openNewProject(page: import("@playwright/test").Page) {
  await page.goto("/projects");
  await page.getByRole("button", { name: /new project/i }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
}

test("a blank project name cannot be submitted", async ({ page }) => {
  await openNewProject(page);
  const create = page.getByRole("button", { name: /^create (project|feature)$/i });
  await expect(create).toBeDisabled();

  await page.getByPlaceholder(/project name/i).fill("   ");
  await expect(create).toBeDisabled();

  await page.getByPlaceholder(/project name/i).fill("Checkout");
  await expect(create).toBeEnabled();
});

test("a new project is still there after a reload", async ({ page }) => {
  const name = `Saved project ${Date.now()}`;
  await openNewProject(page);
  await page.getByPlaceholder(/project name/i).fill(name);
  await page.getByPlaceholder(/project description/i).fill("Kept after reload");
  await page.getByRole("button", { name: /^create (project|feature)$/i }).click();
  await expect(page.getByText(name, { exact: true })).toBeVisible();

  await page.reload();
  await expect(page.getByText(name, { exact: true })).toBeVisible();
});
