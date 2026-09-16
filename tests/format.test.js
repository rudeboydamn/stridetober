import { test } from "node:test";
import assert from "node:assert/strict";
import { n, tick, ord, esc, plural, pick, fmtDay, fmtRange, fresh, fill, rich } from "../public/src/lib/format.js";

test("n: full digits with commas, never abbreviated", () => {
  assert.equal(n(84210), "84,210");
  assert.equal(n(9996), "9,996");
  assert.equal(n(0), "0");
  assert.equal(n(null), "0");
});

test("tick: chart axis labels only", () => {
  assert.equal(tick(84210), "84k");
  assert.equal(tick(1500), "1.5k");
  assert.equal(tick(2000), "2k");
  assert.equal(tick(950), "950");
  assert.equal(tick(0), "0");
});

test("ord: English ordinals including the teens", () => {
  assert.deepEqual([1, 2, 3, 4, 11, 12, 13, 21, 22, 23, 101, 111, 112].map(ord),
    ["1st", "2nd", "3rd", "4th", "11th", "12th", "13th", "21st", "22nd", "23rd", "101st", "111th", "112th"]);
});

test("esc: neutralises every HTML-significant character", () => {
  assert.equal(esc(`<b a="1">Tom & 'Jo'</b>`), "&lt;b a=&quot;1&quot;&gt;Tom &amp; &#39;Jo&#39;&lt;/b&gt;");
  assert.equal(esc(42), "42");
  assert.equal(esc(null), "");
});

test("plural: picks the word", () => {
  assert.equal(plural(1, "leaf", "leaves"), "leaf");
  assert.equal(plural(3, "leaf", "leaves"), "leaves");
  assert.equal(plural(0, "leaf", "leaves"), "leaves");
});

test("pick: deterministic wrap-around", () => {
  assert.equal(pick(["a", "b", "c"], 4), "b");
  assert.equal(pick(["a", "b", "c"], 0), "a");
});

test("fmtDay and fmtRange: short month, en dash, month repeated only when it changes", () => {
  assert.equal(fmtDay("2026-10-11"), "Oct 11");
  assert.equal(fmtRange("2026-10-04", "2026-10-10"), "Oct 4 – 10");
  assert.equal(fmtRange("2026-10-25", "2026-11-01"), "Oct 25 – Nov 1");
});

test("fresh: human relative time", () => {
  const now = new Date(2026, 9, 18, 20, 0);
  assert.equal(fresh(new Date(2026, 9, 18, 19, 59, 30), now), "just now");
  assert.equal(fresh(new Date(2026, 9, 18, 19, 45), now), "15m ago");
  assert.equal(fresh(new Date(2026, 9, 18, 17, 0), now), "3h ago");
  assert.equal(fresh(new Date(2026, 9, 17, 12, 0), now), "yesterday");
  assert.equal(fresh(new Date(2026, 9, 11, 12, 0), now), "Oct 11");
});

test("fill: interpolates {keys}, leaves unknown keys visible", () => {
  assert.equal(fill("Week {n}. {name} leads.", { n: 2, name: "Ash" }), "Week 2. Ash leads.");
  assert.equal(fill("Hi {who}", {}), "Hi {who}");
});

test("rich: escapes first, then *emphasis* becomes <em>", () => {
  assert.equal(rich("The Judge is *fairly* <sure>"), "The Judge is <em>fairly</em> &lt;sure&gt;");
  assert.equal(rich("{name} is *fairly* close", { name: "<Ash>" }), "&lt;Ash&gt; is <em>fairly</em> close");
});
