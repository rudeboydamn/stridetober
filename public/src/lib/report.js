// The Sunday text: seven daily totals in, one message out, in the shape of a
// fitness app's week view — a line per day, then the total and the daily average.
// Pure functions; views/checkin.js owns the form. Spec: docs/PLAN.md §5.5.1.
import { n } from "./format.js";
import { parseLocal } from "./time.js";

export const MAX_DAY = 200_000;

// "17,078", " 17078 " → 17078. Anything else — blank, decimals, negatives, words — → null.
export function parseSteps(text) {
  const t = String(text ?? "").replace(/[,\s]/g, "");
  if (!/^\d+$/.test(t)) return null;
  const v = Number(t);
  return v <= MAX_DAY ? v : null;
}

// The seven dates of a week, Sunday first.
export function weekDates(week) {
  const start = parseLocal(week.start);
  return Array.from({ length: 7 }, (_, i) => new Date(start.getFullYear(), start.getMonth(), start.getDate() + i));
}

const long = d => d.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" });
const range = w => {
  const [a, b] = [parseLocal(w.start), parseLocal(w.end)];
  const f = d => d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  return a.getMonth() === b.getMonth() ? `${f(a)} – ${b.getDate()}` : `${f(a)} – ${f(b)}`;
};

// days: seven parsed numbers, Sunday first. Returns null until all seven are real.
export function weekReport({ name, week, days }) {
  if (days.length !== 7 || days.some(d => d === null)) return null;
  const total = days.reduce((a, b) => a + b, 0);
  const avg = Math.round(total / 7);
  const dates = weekDates(week);
  const text = [
    `Stridetober · Week ${week.n} · ${range(week)}`,
    name,
    "",
    ...days.map((d, i) => `${long(dates[i])} — ${n(d)}`),
    "",
    `Total Steps: ${n(total)}`,
    `Avg Daily: ${n(avg)}`,
  ].join("\n");
  return { text, total, avg };
}

// sms: needs "?&body=" to work on both iOS and Android; no number = the phone asks who.
export const smsHref = (phone, text) =>
  `sms:${String(phone || "").replace(/[^\d+]/g, "")}?&body=${encodeURIComponent(text)}`;
