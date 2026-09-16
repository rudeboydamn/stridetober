import { test } from "node:test";
import assert from "node:assert/strict";
import { CHALLENGE } from "../public/data/challenge.js";
import {
  parseLocal, endOfDay, phaseOf, weekStatus, currentWeek, nextMilestone,
  countdownParts, daypart, isEve, phaseSignature,
} from "../public/src/lib/time.js";

const at = parseLocal;
const W = n => ({ week: n, steps: {}, days: {}, derived: [], judgeNote: "" });

test("parseLocal: a date-only string is LOCAL midnight, not UTC", () => {
  const d = parseLocal("2026-10-04");
  assert.deepEqual([d.getFullYear(), d.getMonth(), d.getDate(), d.getHours(), d.getMinutes()], [2026, 9, 4, 0, 0]);
  assert.equal(d.getDay(), 0, "kickoff is a Sunday");
});

test("parseLocal: date-time with and without seconds", () => {
  const a = parseLocal("2026-11-01T00:00");
  assert.deepEqual([a.getMonth(), a.getDate(), a.getHours()], [10, 1, 0]);
  const b = parseLocal("2026-10-11T19:20:05");
  assert.deepEqual([b.getHours(), b.getMinutes(), b.getSeconds()], [19, 20, 5]);
});

test("endOfDay: last millisecond of that local day", () => {
  const d = endOfDay("2026-10-10");
  assert.deepEqual([d.getDate(), d.getHours(), d.getMinutes(), d.getSeconds(), d.getMilliseconds()], [10, 23, 59, 59, 999]);
  assert.equal(d.getDay(), 6, "weeks end on Saturday");
});

test("phaseOf: muster until the kickoff minute", () => {
  assert.equal(phaseOf(at("2026-09-16T14:00"), CHALLENGE, []), "muster");
  assert.equal(phaseOf(at("2026-10-03T23:59:59"), CHALLENGE, []), "muster");
  assert.equal(phaseOf(at("2026-10-04T00:00"), CHALLENGE, []), "walking");
});

test("phaseOf: walking through Halloween, counting at the final bell", () => {
  assert.equal(phaseOf(at("2026-10-31T23:59:59"), CHALLENGE, [W(1), W(2), W(3)]), "walking");
  assert.equal(phaseOf(at("2026-11-01T00:00"), CHALLENGE, [W(1), W(2), W(3)]), "counting");
});

test("phaseOf: crowned once week 4 is posted", () => {
  assert.equal(phaseOf(at("2026-11-01T19:00"), CHALLENGE, [W(1), W(2), W(3), W(4)]), "crowned");
});

test("currentWeek: Saturday 23:59:59 is still the old week, Sunday 00:00 the new one", () => {
  assert.equal(currentWeek(CHALLENGE, at("2026-10-10T23:59:59")).n, 1);
  assert.equal(currentWeek(CHALLENGE, at("2026-10-11T00:00")).n, 2);
  assert.equal(currentWeek(CHALLENGE, at("2026-10-31T12:00")).n, 4);
  assert.equal(currentWeek(CHALLENGE, at("2026-10-03T12:00")), null);
  assert.equal(currentWeek(CHALLENGE, at("2026-11-01T00:00")), null);
});

test("weekStatus: upcoming → walking → counting → posted", () => {
  const w1 = CHALLENGE.weeks[0];
  assert.equal(weekStatus(w1, at("2026-10-03T23:00"), []), "upcoming");
  assert.equal(weekStatus(w1, at("2026-10-10T23:59:59"), []), "walking");
  assert.equal(weekStatus(w1, at("2026-10-11T00:00"), []), "counting");
  assert.equal(weekStatus(w1, at("2026-10-11T00:00"), [W(1)]), "posted");
});

test("isEve: all of October 31 and nothing else", () => {
  assert.equal(isEve(at("2026-10-30T23:59:59")), false);
  assert.equal(isEve(at("2026-10-31T00:00")), true);
  assert.equal(isEve(at("2026-10-31T23:59:59")), true);
  assert.equal(isEve(at("2026-11-01T00:00")), false);
});

test("nextMilestone: kickoff during muster", () => {
  const m = nextMilestone({ now: at("2026-09-20T09:00"), challenge: CHALLENGE, weeks: [] });
  assert.equal(m.key, "kickoff");
  assert.equal(+m.target, +at("2026-10-04T00:00"));
});

test("nextMilestone: mid-week counts down to Saturday 23:59:59", () => {
  const m = nextMilestone({ now: at("2026-10-07T12:00"), challenge: CHALLENGE, weeks: [] });
  assert.equal(m.key, "weekEnd");
  assert.equal(m.week, 1);
  assert.equal(+m.target, +endOfDay("2026-10-10"));
});

test("nextMilestone: due Sunday with the week unposted counts down to Sunday night", () => {
  const m = nextMilestone({ now: at("2026-10-11T10:00"), challenge: CHALLENGE, weeks: [] });
  assert.equal(m.key, "due");
  assert.equal(m.week, 1);
  assert.equal(+m.target, +endOfDay("2026-10-11"));
});

test("nextMilestone: once that week is posted, Sunday counts down to the next week's end", () => {
  const m = nextMilestone({ now: at("2026-10-11T20:00"), challenge: CHALLENGE, weeks: [W(1)] });
  assert.equal(m.key, "weekEnd");
  assert.equal(m.week, 2);
});

test("nextMilestone: the final week counts down to the Final Bell", () => {
  const m = nextMilestone({ now: at("2026-10-28T08:00"), challenge: CHALLENGE, weeks: [W(1), W(2), W(3)] });
  assert.equal(m.key, "bell");
  assert.equal(+m.target, +at("2026-11-01T00:00"));
});

test("nextMilestone: counting and crowned have no digits", () => {
  const c = nextMilestone({ now: at("2026-11-01T09:00"), challenge: CHALLENGE, weeks: [W(1), W(2), W(3)] });
  assert.deepEqual([c.key, c.target], ["counted", null]);
  const d = nextMilestone({ now: at("2026-11-01T21:00"), challenge: CHALLENGE, weeks: [W(1), W(2), W(3), W(4)] });
  assert.deepEqual([d.key, d.target], ["done", null]);
});

test("countdownParts: zero-padded and clamped at zero", () => {
  const now = at("2026-10-01T00:00");
  const target = new Date(+now + 86_400_000 + 3_600_000 + 60_000 + 1_000);
  assert.deepEqual(countdownParts(now, target), { d: "01", h: "01", m: "01", s: "01", totalMs: 90_061_000 });
  assert.deepEqual(countdownParts(target, now), { d: "00", h: "00", m: "00", s: "00", totalMs: 0 });
});

test("daypart: the sky bands from PLAN §3.2", () => {
  const h = hour => daypart(new Date(2026, 9, 12, hour, 30));
  assert.deepEqual([4, 5, 10, 11, 16, 17, 19, 20, 23].map(h),
    ["night", "morning", "morning", "afternoon", "afternoon", "dusk", "dusk", "night", "night"]);
});

test("phaseSignature: stable within a state, changes when the view must re-render", () => {
  const base = { now: at("2026-10-07T12:00"), challenge: CHALLENGE, weeks: [], crownedSeen: false, announcement: null };
  const same = { ...base, now: at("2026-10-07T12:00:01") };
  assert.equal(phaseSignature(base), phaseSignature(same));
  assert.notEqual(phaseSignature(base), phaseSignature({ ...base, weeks: [W(1)] }));
  assert.notEqual(phaseSignature(base), phaseSignature({ ...base, now: at("2026-10-11T00:00") }));
  const anno = { until: "2026-10-08T00:00" };
  assert.notEqual(phaseSignature({ ...base, announcement: anno }),
                  phaseSignature({ ...base, announcement: anno, now: at("2026-10-08T00:00") }));
});
