// The calendar file: every date the walkers need, each with a reminder, valid line endings.
import { test } from "node:test";
import assert from "node:assert/strict";
import { calendarFile } from "../public/src/lib/calendar.js";
import { CHALLENGE } from "../public/data/challenge.js";

const ics = calendarFile(CHALLENGE, new Date("2026-09-30T12:00:00Z"));
const events = ics.split("BEGIN:VEVENT").slice(1);

test("calendar: kickoff, four due Sundays and the final bell — six events, all-day", () => {
  assert.equal(events.length, 6);
  const starts = events.map(e => e.match(/DTSTART;VALUE=DATE:(\d+)/)[1]);
  assert.deepEqual(starts, ["20261004", "20261011", "20261018", "20261025", "20261101", "20261031"]);
  for (const e of events) assert.match(e, /DTEND;VALUE=DATE:\d+/);
});

test("calendar: every event has a reminder; the kickoff has two", () => {
  for (const e of events) assert.ok(/BEGIN:VALARM/.test(e), "an event has no alarm");
  assert.equal((events[0].match(/BEGIN:VALARM/g) || []).length, 2);
  assert.match(events[1], /TRIGGER:PT20H/, "Sunday reminders land at 8 PM");
});

test("calendar: CRLF endings, folded lines, escaped commas, never the old name", () => {
  assert.ok(ics.startsWith("BEGIN:VCALENDAR\r\n") && ics.endsWith("END:VCALENDAR\r\n"));
  assert.ok(!/(^|[^\r])\n/.test(ics.replace(/\\n/g, "")), "a bare LF slipped in");
  for (const line of ics.split("\r\n")) assert.ok(line.length <= 73, `line too long: ${line.slice(0, 40)}…`);
  assert.doesNotMatch(ics, /dammy/i);
  assert.match(ics.replace(/\r\n /g, ""), /Screenshot all seven days and send it to the Judge\./, "unfolded, the text reads whole");
});
