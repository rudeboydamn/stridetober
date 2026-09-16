import { test } from "node:test";
import assert from "node:assert/strict";
import {
  paidWalkers, weekSteps, totals, standings, leader, gapToLead, honours, together,
} from "../public/src/lib/stats.js";

const walkers = [
  { id: "ash", name: "Ash Alder", short: "Ash", paid: true },
  { id: "bo",  name: "Bo Birch",  short: "Bo",  paid: true },
  { id: "cy",  name: "Cy Cedar",  short: "Cy",  paid: true },
  { id: "uma", name: "Uma Unpaid", short: "Uma", paid: false },
];
const w1 = {
  week: 1,
  steps: { ash: 70000, bo: 70000, cy: null },
  days: { ash: [10000, 10000, 10000, 10000, 10000, 10000, 10000],
          bo:  [5000, 12000, 9000, 11000, 10000, 8000, 15000], cy: null },
  derived: [],
};
const w2 = {
  week: 2,
  steps: { ash: 60000, bo: 80000, cy: 81000, uma: 99999 },
  days: { ash: [8000, 9000, 0, 10000, 11000, 9000, 13000],
          bo:  [20000, 10000, 10000, 10000, 10000, 10000, 10000],
          cy:  [15000, 9000, 9000, 9000, 9000, 9000, 21000] },
  derived: [],
};
const byId = (rows, id) => rows.find(r => r.walker.id === id);
const honour = (list, key) => list.find(h => h.key === key);

test("paidWalkers: only paid === true", () => {
  assert.deepEqual(paidWalkers(walkers).map(w => w.id), ["ash", "bo", "cy"]);
});

test("weekSteps: a null screenshot counts as zero", () => {
  assert.deepEqual(weekSteps(w1), { ash: 70000, bo: 70000, cy: 0 });
});

test("totals: cumulative per id across posted weeks", () => {
  assert.deepEqual(totals([w1, w2]), { ash: 130000, bo: 150000, cy: 81000, uma: 99999 });
});

test("standings: excludes unpaid walkers and sorts by total", () => {
  const s = standings(walkers, [w1, w2]);
  assert.deepEqual(s.map(r => r.walker.id), ["bo", "ash", "cy"]);
  assert.deepEqual(s.map(r => r.total), [150000, 130000, 81000]);
});

test("standings: a missing screenshot is 'missing' in byWeek and adds nothing", () => {
  const cy = byId(standings(walkers, [w1, w2]), "cy");
  assert.deepEqual(cy.byWeek, ["missing", 81000]);
  assert.equal(cy.total, 81000);
});

test("standings: competition ranking — ties share a rank, the next rank skips", () => {
  const s = standings(walkers, [w1]);
  assert.deepEqual(s.map(r => [r.walker.id, r.rank]), [["ash", 1], ["bo", 1], ["cy", 3]]);
});

test("standings: rank delta against the previous posted week (positive = climbed)", () => {
  const s = standings(walkers, [w1, w2]);
  assert.deepEqual(s.map(r => [r.walker.id, r.prevRank, r.delta]), [["bo", 1, 0], ["ash", 1, -1], ["cy", 3, 0]]);
  assert.equal(standings(walkers, [w1])[0].prevRank, null, "no previous week, no delta");
  assert.equal(standings(walkers, [w1])[0].delta, null);
});

test("standings: bestDay uses Sunday-first day indexes; perDay spans every posted day", () => {
  const s = standings(walkers, [w1, w2]);
  assert.deepEqual(byId(s, "bo").bestDay, { n: 20000, week: 2, day: 0 });
  assert.deepEqual(byId(s, "cy").bestDay, { n: 21000, week: 2, day: 6 });
  assert.equal(Math.round(byId(s, "bo").perDay), 10714);
  assert.equal(standings(walkers, [])[0].bestDay, null);
});

test("leader and gapToLead", () => {
  const s = standings(walkers, [w1, w2]);
  assert.equal(leader(s).walker.id, "bo");
  assert.equal(gapToLead(s, "cy"), 69000);
  assert.equal(gapToLead(s, "bo"), 0);
  assert.equal(leader(standings(walkers, [])), null, "nobody leads at zero");
});

test("honours: each criterion from PLAN §7.4 on a two-week fixture", () => {
  const h = honours(walkers, [w1, w2]);
  assert.deepEqual(honour(h, "leaf-pile"),    { key: "leaf-pile",    who: "cy",  detail: { n: 81000, week: 2 } });
  assert.deepEqual(honour(h, "longest"),      { key: "longest",      who: "cy",  detail: { n: 21000, week: 2, day: 6 } });
  assert.deepEqual(honour(h, "metronome"),    { key: "metronome",    who: "ash", detail: { n: 0, week: 1 } });
  assert.equal(honour(h, "weekender").who, "cy");
  assert.equal(honour(h, "weekender").detail.week, 2);
  assert.equal(Math.round(honour(h, "weekender").detail.pct * 100), 44);
  assert.deepEqual(honour(h, "second-wind"),  { key: "second-wind",  who: "bo",  detail: { n: 10000, week: 2 } });
  assert.deepEqual(honour(h, "photo-finish"), { key: "photo-finish", who: "cy",  detail: { n: 1000, week: 2 } });
  assert.deepEqual(honour(h, "rest-day"),     { key: "rest-day",     who: "ash", detail: { week: 2, day: 2 } });
  assert.equal(honour(h, "quiet"), undefined, "quiet waits for the final week");
});

test("honours: unpaid walkers never win, and nothing is awarded without data", () => {
  assert.ok(honours(walkers, [w1, w2]).every(x => x.who !== "uma"));
  assert.deepEqual(honours(walkers, []), []);
});

test("honours: ties go to the earliest walker in roster order", () => {
  const h = honours(walkers, [w1]);
  assert.equal(honour(h, "weekender").who, "ash", "ash and bo both put 2/7 of week 1 on the weekend");
  assert.equal(honour(h, "photo-finish"), undefined, "a tied week has no winner");
});

test("honours: the Quiet Achiever appears once week 4 is posted", () => {
  const weeks = [1, 2, 3, 4].map(k => ({ week: k, steps: { ash: 100, bo: 90, cy: 95 }, days: {}, derived: [] }));
  const h = honours(walkers, weeks);
  assert.deepEqual(honour(h, "quiet"), { key: "quiet", who: "cy", detail: { n: 380 } });
  assert.equal(honour(h, "longest"), undefined, "no dailies, no longest walk");
});

test("together: 2,000 steps to the mile, 26.2 miles to the marathon", () => {
  const t = together({ a: 2000, b: 50400 });
  assert.equal(t.steps, 52400);
  assert.equal(t.miles, 26.2);
  assert.equal(t.marathons, 1);
  assert.equal(Math.round(t.km * 10) / 10, 42.2);
});
