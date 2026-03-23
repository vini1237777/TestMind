import { test, expect } from "@playwright/test";

test("user can create and open a project", async ({ page }) => {
  const projectName = `PW Project ${Date.now()}`;
  const projectDescription = "Playwright-created description";

  await page.goto("/");

  await expect(page.getByRole("heading", { name: /projects/i })).toBeVisible();

  await page.getByRole("button", { name: /new project/i }).click();
  await expect(page.getByText(/create project/i)).toBeVisible();

  await page.getByPlaceholder(/project name/i).fill(projectName);
  await page.getByPlaceholder(/project description/i).fill(projectDescription);

  await page.getByRole("button", { name: /^save$/i }).click();

  await expect(page.getByText(projectName, { exact: true })).toBeVisible();

  await page.getByText(projectName, { exact: true }).click();

  await expect(page.getByText(projectName)).toBeVisible();
});
