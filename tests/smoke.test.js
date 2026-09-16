import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync } from "node:fs";

test("scaffold: public/ is the deploy root", () => {
  assert.ok(existsSync("public/index.html"), "public/index.html missing");
});

test("scaffold: every data file imports cleanly", async () => {
  for (const m of ["challenge", "walkers", "weeks", "copy", "finds", "demo"]) {
    const mod = await import(`../public/data/${m}.js`);
    assert.ok(Object.keys(mod).length > 0, `public/data/${m}.js exports nothing`);
  }
});

test("scaffold: challenge dates are sane", async () => {
  const { CHALLENGE } = await import("../public/data/challenge.js");
  assert.equal(CHALLENGE.weeks.length, 4);
  assert.equal(CHALLENGE.weeks[3].end, "2026-10-31");
});
