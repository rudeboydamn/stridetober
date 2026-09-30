// The Stridetober calendar file: kickoff, every Sunday, the final bell.
// One .ics, every event an all-day entry with its own alarm. Pure (calendarFile
// builds text; downloadCalendar hands it to the browser). Spec: docs/PLAN.md §5.5.1.
import { parseLocal } from "./time.js";
import { fmtRange } from "./format.js";

const SITE = "https://stridetober.vercel.app";
const fold = line => (line.length <= 72 ? line : line.match(/.{1,72}/g).join("\r\n "));
const esc = t => t.replace(/[\\,;]/g, m => "\\" + m).replace(/\n/g, "\\n");
const compact = d => `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
const nextDay = s => { const d = parseLocal(s); d.setDate(d.getDate() + 1); return d; };

// trigger is relative to the all-day event's midnight start: "PT20H" = 8 PM that day, "-PT4H" = 8 PM the day before.
const alarm = (text, trigger) => ["BEGIN:VALARM", "ACTION:DISPLAY", `DESCRIPTION:${esc(text)}`, `TRIGGER:${trigger}`, "END:VALARM"];

export function calendarFile(challenge, now) {
  const stamp = now.toISOString().replace(/[-:]/g, "").replace(/\.\d+/, "");
  const event = (uid, date, summary, description, alarms) => [
    "BEGIN:VEVENT", `UID:stridetober-${uid}@stridetober.vercel.app`, `DTSTAMP:${stamp}`,
    `DTSTART;VALUE=DATE:${compact(parseLocal(date))}`, `DTEND;VALUE=DATE:${compact(nextDay(date))}`,
    `SUMMARY:${esc(summary)}`, `DESCRIPTION:${esc(description)}`, `URL:${SITE}/#/check-in`,
    ...alarms.flatMap(([text, trigger]) => alarm(text, trigger)), "END:VEVENT",
  ];
  const last = challenge.weeks.at(-1);
  const events = [
    ...event("kickoff", challenge.kickoff, "Stridetober begins — go walk",
      "The first day. Every step counts from midnight.",
      [["Tomorrow: Stridetober begins. Lay out the sneakers.", "-PT4H"], ["It has begun. Shoes on.", "PT8H"]]),
    ...challenge.weeks.flatMap(w => event(`week-${w.n}`, w.due,
      w.n === challenge.weeks.length ? "Stridetober — final screenshots" : "Stridetober — send the Judge your week",
      `Week ${w.n}: ${fmtRange(w.start, w.end)}. Screenshot all seven days and send it to the Judge. DIRECTLY TO THE JUDGE — NOT THE GROUP CHAT!` +
        (w.n === challenge.weeks.length ? " The champion is named today." : ""),
      [["Sunday night: send the Judge your week", "PT20H"]])),
    ...event("final-bell", last.end, "Stridetober — the final bell tonight",
      "The last steps that count. The bell rings at midnight.",
      [["Last steps. The bell rings at midnight.", "PT18H"]]),
  ];
  return ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Stridetober//Calendar//EN", "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH", "X-WR-CALNAME:Stridetober", ...events, "END:VCALENDAR"].map(fold).join("\r\n") + "\r\n";
}

export function downloadCalendar(challenge) {
  const url = URL.createObjectURL(new Blob([calendarFile(challenge, new Date())], { type: "text/calendar;charset=utf-8" }));
  const a = Object.assign(document.createElement("a"), { href: url, download: "stridetober.ics" });
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}
