import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { isBot, visitorId } from "../../src/lib/visitors";

describe("visitors", () => {
  test("one address always gives the same id", () => {
    assert.equal(visitorId("10.0.0.1", "s"), visitorId("10.0.0.1", "s"));
    assert.notEqual(visitorId("10.0.0.1", "s"), visitorId("10.0.0.2", "s"));
  });

  test("the id does not contain the address", () => {
    assert.match(visitorId("10.0.0.1", "s"), /^[a-f\d]{64}$/);
  });

  test("recognises bots and browsers", () => {
    assert.equal(isBot("Googlebot/2.1"), true);
    assert.equal(isBot("Mozilla/5.0 HeadlessChrome/130.0"), true);
    assert.equal(isBot(null), true);
    assert.equal(isBot("Mozilla/5.0 (Macintosh) Chrome/130.0 Safari/537.36"), false);
    assert.equal(
      isBot("Mozilla/5.0 (Linux; Android 9; CUBOT X20 PRO) AppleWebKit/537.36 Chrome/130.0.0.0 Mobile Safari/537.36"),
      false,
    );
  });
});
