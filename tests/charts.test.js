import { test } from "node:test";
import assert from "node:assert/strict";
import { chartDims, phoneWidth, totalsChart } from "../public/src/lib/charts.js";

test("phone charts are drawn at the card's real width, so 12px labels render at 12px", () => {
  // 320px phone: 16px gutters, 16px card padding and a 1px border on each side leave 254px.
  assert.equal(chartDims(320).w, 254);
  assert.equal(chartDims(375).w, 309);
  assert.equal(chartDims(430).w, 364);
  assert.equal(chartDims(600).w, 396, "capped once the card is wide enough");
  assert.equal(phoneWidth(200), 240, "never narrower than 240");
  assert.equal(chartDims(1024).w, 620);
});

test("totals chart leaves room for the leader's number inside the viewBox", () => {
  const walker = (id, short, color = "moss") => ({ id, name: short, short, color, paid: true });
  const rows = [
    { walker: walker("a", "Linden"), total: 172650 },
    { walker: walker("b", "Ash"), total: 90000 },
  ];
  const svg = totalsChart(rows, 320);
  const width = +svg.match(/viewBox="0 0 (\d+)/)[1];
  const [, x] = svg.match(/class="chart-axis chart-val" x="([\d.]+)"/);
  assert.ok(+x + "172,650".length * 7 <= width, `leader's total starts at ${x} and runs past ${width}`);
});

test("climbChart: the dash follows the walker flagged as a palette reuse, not ninth place", async () => {
  const { climbChart } = await import("../public/src/lib/charts.js");
  const mk = (id, color, dashed, total) => ({ walker: { id, color, dashed, short: id, name: id, crest: "🍂" }, total });
  const rows = [mk("pie", "cranberry", true, 900), ...Array.from({ length: 8 }, (_, i) => mk("w" + i, "moss", false, 800 - i))];
  const weeks = [{ week: 1, steps: Object.fromEntries(rows.map(r => [r.walker.id, r.total])) }];
  const svg = climbChart(rows, weeks, 375);
  const lines = svg.match(/<polyline[^>]*>/g);
  assert.match(lines[0], /stroke-dasharray/, "the flagged walker is dashed even in first place");
  assert.equal(lines.filter(l => l.includes("stroke-dasharray")).length, 1);
});
