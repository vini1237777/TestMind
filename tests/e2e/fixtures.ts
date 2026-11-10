import { test as base } from "@playwright/test";

// The proxy allows 10 requests a minute per address. Browser tests would otherwise
// share one address and use up each other's allowance, so each test gets its own,
// in the same way the API tests set x-real-ip per request.
const RUN = Math.floor(Date.now() / 1000) % 250;
let next = 0;

export const test = base.extend({
  extraHTTPHeaders: async ({ extraHTTPHeaders }, use) => {
    await use({ ...extraHTTPHeaders, "x-real-ip": `10.7.${RUN}.${next++ % 250}` });
  },
});

export { expect, type Page } from "@playwright/test";
