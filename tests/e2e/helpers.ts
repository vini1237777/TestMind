import { expect, type Page } from "./fixtures";

// Creates a project and a feature through the UI, then opens the new suite.
export async function openNewSuite(
  page: Page,
  projectName: string,
  projectDescription: string,
  featureName: string,
  featureDescription: string,
) {
  await page.goto("/projects");

  await expect(page.getByRole("heading", { name: /projects/i })).toBeVisible();

  await page.getByRole("button", { name: /new project/i }).click();
  await expect(page.getByRole("dialog")).toBeVisible();

  await page.getByPlaceholder(/project name/i).fill(projectName);
  await page.getByPlaceholder(/project description/i).fill(projectDescription);
  await page.getByRole("button", { name: /^create (project|feature)$/i }).click();

  await expect(page.getByText(projectName, { exact: true })).toBeVisible();
  // The list also shows this name, so wait for the URL to prove the click navigated.
  // A click can land while the list re-renders, which is why it may need a retry.
  await expect(async () => {
    await page.getByText(projectName, { exact: true }).click();
    await page.waitForURL(/\/projects\/[a-f\d]{24}$/, { timeout: 3_000 });
  }).toPass();

  await page
    .getByRole("button", { name: "+ New Feature" })
    .click();
  await expect(page.getByText("Create new feature")).toBeVisible();

  await page.getByPlaceholder(/feature name/i).fill(featureName);
  await page.getByPlaceholder(/description/i).fill(featureDescription);
  await page.getByRole("button", { name: /^create (project|feature)$/i }).click();

  await expect(page.getByText(featureName, { exact: true })).toBeVisible();
  await page.locator("a[href*=\"/suites/\"]").first().click();
}
