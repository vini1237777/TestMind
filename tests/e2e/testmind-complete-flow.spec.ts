import { test, expect } from "@playwright/test";

test("user can create project, add feature, and generate test cases", async ({
  page,
}) => {
  const projectName = `PW Project ${Date.now()}`;
  const projectDescription = "Playwright-created description";
  const featureName = `Natural Language → Test Generation ${Date.now()}`;
  const featureDescription =
    "Users can type a plain sentence and AI converts it into structured test cases automatically.";

  await page.route("/api/generate-tests", async (route) => {
    const request = route.request();
    const body = request.postDataJSON?.() || {};

    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
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

  await page
    .getByRole("button", { name: "+ New Feature / Test Suite" })
    .click();
  await expect(page.getByText("Create New Feature / Suite")).toBeVisible();

  await page.getByPlaceholder(/feature name/i).fill(featureName);
  await page.getByPlaceholder(/description/i).fill(featureDescription);
  await page.getByRole("button", { name: /^save$/i }).click();

  await expect(page.getByText(featureName, { exact: true })).toBeVisible();
  await page.getByText("View test cases", { exact: true }).click();

  await expect(page.getByText("Test Suites")).toBeVisible();

  await page.waitForTimeout(2000);

  page.on("request", (request) => {
    console.log("Request:", request.method(), request.url());
  });

  await page.getByRole("button", { name: "Generate Test Cases" }).click();

  await expect(page.getByText("TC_1")).toBeVisible();

  page.on("request", (request) => {
    console.log("Request:", request.method(), request.url());
  });

  page.on("request", (request) => {
    console.log("Request:", request.method(), request.url());
  });

  await page.getByRole("button", { name: /run ai feedback review/i }).click();

  await expect(page.getByText(/AI reviewed/i)).toBeVisible();

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
