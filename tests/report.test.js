// The Sunday text: parsing, the message shape, and the sms: link.
import { test } from "node:test";
import assert from "node:assert/strict";
import { parseSteps, weekDates, weekReport, smsHref } from "../public/src/lib/report.js";
import { CHALLENGE } from "../public/data/challenge.js";

const wk2 = CHALLENGE.weeks[1];
const DAYS = [17078, 5291, 6925, 11729, 13936, 13453, 8004];   // a real week off a phone

test("parseSteps: whole numbers with or without commas, nothing else", () => {
  assert.equal(parseSteps("17,078"), 17078);
  assert.equal(parseSteps(" 5291 "), 5291);
  assert.equal(parseSteps("0"), 0);
  for (const bad of ["", "  ", "12.5", "-3", "ten", "1e4", "200001", null, undefined]) assert.equal(parseSteps(bad), null, String(bad));
});

test("weekDates: seven local days, Sunday first, across a month edge", () => {
  const d = weekDates(wk2);
  assert.equal(d.length, 7);
  assert.equal(d[0].getDay(), 0);
  assert.equal(d[6].getDay(), 6);
  assert.deepEqual(d.map(x => x.getDate()), [11, 12, 13, 14, 15, 16, 17]);
  assert.deepEqual(weekDates({ start: "2026-10-25" }).map(x => x.getDate()), [25, 26, 27, 28, 29, 30, 31]);
});

test("weekReport: the message is a line per day, then the total and the daily average", () => {
  const r = weekReport({ name: "Alicia Ramos", week: wk2, days: DAYS });
  assert.equal(r.total, 76416);
  assert.equal(r.avg, 10917);
  assert.equal(r.text, [
    "Stridetober · Week 2 · Oct 11 – 17",
    "Alicia Ramos",
    "",
    "Sunday, Oct 11 — 17,078",
    "Monday, Oct 12 — 5,291",
    "Tuesday, Oct 13 — 6,925",
    "Wednesday, Oct 14 — 11,729",
    "Thursday, Oct 15 — 13,936",
    "Friday, Oct 16 — 13,453",
    "Saturday, Oct 17 — 8,004",
    "",
    "Total Steps: 76,416",
    "Avg Daily: 10,917",
  ].join("\n"));
});

test("weekReport: never invents a day — any blank means no message", () => {
  assert.equal(weekReport({ name: "x", week: wk2, days: [1, 2, 3, 4, 5, 6, null] }), null);
  assert.equal(weekReport({ name: "x", week: wk2, days: [1, 2, 3] }), null);
  assert.ok(weekReport({ name: "x", week: wk2, days: [0, 0, 0, 0, 0, 0, 0] }), "a week of zeros is still a week");
});

test("smsHref: number optional, body encoded, works on iOS and Android", () => {
  assert.equal(smsHref("", "hi\nthere"), "sms:?&body=hi%0Athere");
  assert.equal(smsHref("+1 (555) 123-4567", "a b"), "sms:+15551234567?&body=a%20b");
});
