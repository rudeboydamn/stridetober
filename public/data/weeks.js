// The weekly edit — appended each Sunday (Oct 11, 18, 25, Nov 1). Runbook: docs/PLAN.md §9.2.
// { week:1, posted:"2026-10-11T19:20",
//   steps: { sam: 84210, jules: null },                     // null = NO SCREENSHOT (counts 0)
//   days:  { sam: [9,120, 12,004, …], jules: null },        // 7 numbers SUNDAY-first, or null
//   derived: [],                                           // ids whose daily split was chart-read
//   judgeNote: "…" }
// steps is authoritative as submitted. days null = pending — never guess.
export const WEEKS = [];

// Alicia's birthday falls on kickoff day. Live all day Sunday Oct 4, then it retires itself.
export const ANNOUNCEMENT = {
  from: "2026-10-04T00:00", until: "2026-10-05T00:00", mode: "note", who: "alicia",
  kicker: "Hear ye, hear ye",
  title: "🎂 The Maple turns a year more golden today!",
  lead: "Born on the very first day of Stridetober, which the Judge finds *fairly* suspicious. Happy birthday, Alicia! Birthday steps still count exactly once. The Judge is generous, not careless.",
  cta: "Read her Chronicle",
};
// or { from?:"2026-10-19T00:00", until:"2026-10-20T00:00", mode:"note"|"getwell", who:"sam",   // from = optional start
//      kicker:"…", title:"…", lead:"…", points:[[emoji,text],…], note:"…", cta:"…" }
// mode:"getwell" replaces the Court's ledger preview; mode:"note" is a dismissible banner.
