import { test, expect, type Page } from "@playwright/test";

async function openNewSuite(
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

test("user can create project, add feature, and generate test cases", async ({
  page,
}) => {
  const projectName = `PW Project ${Date.now()}`;
  const projectDescription = "Playwright-created description";
  const featureName = `Natural Language → Test Generation ${Date.now()}`;
  const featureDescription =
    "Users can type a plain sentence and AI converts it into structured test cases automatically.";

  let generationBody: Record<string, string> = {};

  await page.route("/api/generate-tests", async (route) => {
    generationBody = route.request().postDataJSON?.() || {};

    await route.fulfill({
      status: 202,
      contentType: "application/json",
      body: JSON.stringify({ jobId: "mock-job-1" }),
    });
  });

  // The first poll finds the job still running, like a real generation.
  let polls = 0;
  await page.route("/api/generate-tests/mock-job-1", async (route) => {
    polls += 1;
    if (polls === 1) {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ status: "running" }),
      });
      return;
    }

    const body = generationBody;
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        status: "done",
        result: {
        suiteId: body.suiteId || "mock-suite-id-1",
        projectId: body.projectId || "mock-project-id-1",
        createdAt: new Date().toISOString(),
        lastFeedbackSummary: "",
        lastFeedbackScore: null,
        lastReviewedAt: null,
        workflow: "langgraph_generation",
        testCases: [
          {
            id: "TC_1",
            type: "HAPPY",
            title: "Valid input generates tests",
            steps: ["Open feature page", "Enter valid input", "Click generate"],
            expected: "System generates structured test cases",
            samplePayload: {
              "Test Case": "TC_1",
              Type: "HAPPY",
              Title: "Valid input generates tests",
            },
          },
          {
            id: "TC_2",
            type: "NEGATIVE",
            title: "Invalid input shows validation guidance",
            steps: [
              "Open feature page",
              "Enter incomplete input",
              "Click generate",
            ],
            expected: "System asks for better input details",
            samplePayload: {
              "Test Case": "TC_2",
              Type: "NEGATIVE",
              Title: "Invalid input shows validation guidance",
            },
          },
        ],
        },
      }),
    });
  });

  await page.route("/api/feedback-review", async (route) => {
    const request = route.request();
    const body = request.postDataJSON?.() || {};
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        suiteId: body.suiteId || "mock-suite-id-1",
        projectId: body.projectId || "mock-project-id-1",
        score: 75,
        coverage: "Moderate",
        summary: "Core coverage exists but edge cases are missing.",
        missingAreas: ["Ambiguous input", "Missing context"],
        improvementSuggestions: ["Add tests for vague user prompts"],
        suggestions: {
          type: "NEGATIVE",
          title: "User enters ambiguous input",
          steps: [
            "Open the feature page",
            "Enter vague text",
            "Click generate",
          ],
          expected: "System asks for more specific input",
        },
        suggestedTestCases: [
          {
            id: "TC_3",
            type: "NEGATIVE",
            title: "User enters ambiguous input",
            steps: [
              "Open the feature page",
              "Enter vague text",
              "Click generate",
            ],
            expected: "System asks for more specific input",
          },
        ],
      }),
    });
  });

  await page.route("/api/suites/add-cases", async (route) => {
    const request = route.request();
    const body = request.postDataJSON?.() || {};

    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        success: true,
        suiteId: body.suiteId || "mock-suite-id-1",
        testCases: body.testCases || [],
      }),
    });
  });

  await openNewSuite(page, projectName, projectDescription, featureName, featureDescription);

  await expect(page.getByRole("button", { name: "Generate Test Cases" })).toBeVisible();

  await page.waitForTimeout(2000);

  page.on("request", (request) => {
    console.log("Request:", request.method(), request.url());
  });

  await page.getByRole("button", { name: "Generate Test Cases" }).click();

  await expect(page.getByText("Valid input generates tests")).toBeVisible();

  page.on("request", (request) => {
    console.log("Request:", request.method(), request.url());
  });

  page.on("request", (request) => {
    console.log("Request:", request.method(), request.url());
  });

  await page.getByRole("button", { name: /review coverage/i }).click();

  await expect(page.getByText("Not covered yet")).toBeVisible();

  page.on("request", (request) => {
    console.log("Request:", request.method(), request.url());
  });

  await expect(page.getByText("Missing context")).toBeVisible();
  await page
    .getByRole("button", { name: /^accept$/i })
    .first()
    .click();

  await expect(page.getByText("User enters ambiguous input")).toBeVisible();
});

test("shows an error when the generation job fails", async ({ page }) => {
  const stamp = Date.now();

  await page.route("/api/generate-tests", async (route) => {
    await route.fulfill({
      status: 202,
      contentType: "application/json",
      body: JSON.stringify({ jobId: "mock-job-2" }),
    });
  });
  await page.route("/api/generate-tests/mock-job-2", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        status: "failed",
        error: "Failed to generate test cases. Please try again.",
      }),
    });
  });

  await openNewSuite(
    page,
    `PW Project ${stamp}`,
    "Playwright-created description",
    `Failing generation ${stamp}`,
    "A generation that fails in the background.",
  );

  await expect(page.getByRole("button", { name: "Generate Test Cases" })).toBeVisible();
  await page.waitForTimeout(2000);
  await page.getByRole("button", { name: "Generate Test Cases" }).click();

  await expect(
    page.getByText("Failed to generate test cases. Please try again."),
  ).toBeVisible();
});
