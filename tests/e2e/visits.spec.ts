import { test, expect } from "@playwright/test";

const BROWSER = "Mozilla/5.0 (Macintosh) Chrome/130.0 Safari/537.36";

test("a visitor counts once, and a bot does not count", async ({ request }) => {
  const ip = `10.3.${Date.now() % 250}.${Date.now() % 200}`;
  const visit = async (userAgent: string, address = ip) => {
    const res = await request.post("/api/visits", {
      headers: { "x-real-ip": address, "user-agent": userAgent },
    });
    expect(res.status()).toBe(200);
    return (await res.json()).visitors as number;
  };

  const first = await visit(BROWSER);
  expect(await visit(BROWSER)).toBe(first);
  expect(await visit("Googlebot/2.1", `${ip}1`)).toBe(first);
  expect(await visit(BROWSER, `${ip}2`)).toBe(first + 1);
});

for (const path of ["/", "/projects"]) {
  test(`${path} shows the count in the navbar`, async ({ page }) => {
    await page.goto(path);
    await expect(page.getByRole("navigation").getByTestId("visitor-count")).toHaveText(
      /Profile visits\s*\d+/,
    );
  });
}
