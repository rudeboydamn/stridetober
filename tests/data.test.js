// The deploy gate (docs/PLAN.md §7.6). Vercel runs this before every deploy,
// so a bad WEEKS entry can never reach the site.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { CHALLENGE } from "../public/data/challenge.js";
import { WALKERS } from "../public/data/walkers.js";
import { WEEKS, ANNOUNCEMENT } from "../public/data/weeks.js";
import { FALL_FINDS } from "../public/data/finds.js";
import { DEMO_WALKERS, DEMO_WEEKS } from "../public/data/demo.js";
import * as COPY from "../public/data/copy.js";
import { parseLocal, endOfDay, DAY } from "../public/src/lib/time.js";
import { standings } from "../public/src/lib/stats.js";

const PALETTE = [...readFileSync("public/styles/tokens.css", "utf8").matchAll(/--light-walker-([a-z]+):/g)].map(m => m[1]);
const SLUG = /^[a-z][a-z0-9-]*$/;
const isInt = v => Number.isInteger(v) && v >= 0;

function checkRoster(walkers, label) {
  const ids = walkers.map(w => w.id), crests = walkers.map(w => w.crest);
  assert.equal(new Set(ids).size, ids.length, `${label}: duplicate walker id`);
  assert.equal(new Set(crests).size, crests.length, `${label}: duplicate crest`);
  for (const w of walkers) {
    assert.match(w.id, SLUG, `${label}: id "${w.id}" is not a slug`);
    assert.ok(w.name && w.short && w.crest, `${label}: ${w.id} needs name, short and crest`);
    assert.ok(PALETTE.includes(w.color), `${label}: ${w.id} color "${w.color}" is not one of ${PALETTE.join(", ")}`);
    assert.equal(typeof w.paid, "boolean", `${label}: ${w.id} paid must be true or false`);
    if (w.birthday != null) assert.match(w.birthday, /^\d\d-\d\d$/, `${label}: ${w.id} birthday is "MM-DD"`);
  }
}

function checkWeeks(weeks, walkers, label) {
  const paid = new Set(walkers.filter(w => w.paid).map(w => w.id));
  weeks.forEach((wk, i) => {
    const where = `${label} week ${wk.week}`;
    assert.equal(wk.week, i + 1, `${label}: WEEKS must run 1..n in order`);
    const sched = CHALLENGE.weeks[i];
    assert.ok(sched, `${where}: there are only ${CHALLENGE.weeks.length} weeks`);
    if (wk.posted) assert.ok(parseLocal(wk.posted) > endOfDay(sched.end), `${where}: posted before the week ended`);
    for (const [id, v] of Object.entries(wk.steps)) {
      assert.ok(paid.has(id), `${where}: "${id}" is not a paid walker`);
      assert.ok(v === null || (isInt(v) && v <= 700_000), `${where}: ${id} steps ${v} is not a whole number 0–700,000`);
    }
    for (const [id, d] of Object.entries(wk.days || {})) {
      assert.ok(id in wk.steps, `${where}: days for "${id}" but no steps entry`);
      if (d === null) continue;
      assert.ok(Array.isArray(d) && d.length === 7 && d.every(isInt), `${where}: ${id} days must be 7 whole numbers, Sunday first`);
      const sum = d.reduce((a, b) => a + b, 0), total = wk.steps[id];
      assert.notEqual(total, null, `${where}: ${id} has days but NO SCREENSHOT`);
      const slack = (wk.derived || []).includes(id) ? 1500 : 0;
      assert.ok(Math.abs(sum - total) <= slack,
        `${where}: ${id} days add up to ${sum} but steps is ${total} — stop and ask Dammy`);
    }
    for (const id of wk.derived || []) assert.ok(Array.isArray(wk.days?.[id]), `${where}: derived "${id}" has no days`);
  });
}

test("challenge: kickoff is a Sunday and the four weeks are contiguous Sun→Sat, due the next Sunday", () => {
  assert.equal(parseLocal(CHALLENGE.kickoff).getDay(), 0);
  assert.equal(+parseLocal(CHALLENGE.finalBell), +endOfDay(CHALLENGE.weeks.at(-1).end) + 1);
  CHALLENGE.weeks.forEach((w, i) => {
    assert.equal(w.n, i + 1);
    assert.equal(parseLocal(w.start).getDay(), 0, `week ${w.n} starts on a Sunday`);
    assert.equal(parseLocal(w.end).getDay(), 6, `week ${w.n} ends on a Saturday`);
    assert.equal(parseLocal(w.due).getDay(), 0, `week ${w.n} is due on a Sunday`);
    assert.equal(Math.round((parseLocal(w.due) - parseLocal(w.end)) / DAY), 1);
    if (i) assert.equal(Math.round((parseLocal(w.start) - parseLocal(CHALLENGE.weeks[i - 1].end)) / DAY), 1);
  });
  assert.equal(CHALLENGE.weeks[0].start, CHALLENGE.kickoff.slice(0, 10));
});

// Some Stridetober walkers also walked Big Steppas, so names are no longer the test.
// What must never appear is the old challenge itself: its name, its houses, its jokes.
test("walkers: slugs, unique crests, palette colors, no Big Steppas callbacks", () => {
  checkRoster(WALKERS, "walkers.js");
  const banned = /big ?steppas?|steppas|house of/i;
  for (const f of ["walkers.js", "copy.js", "weeks.js"]) {
    assert.doesNotMatch(readFileSync(`public/data/${f}`, "utf8"), banned, `${f} calls back to Big Steppas`);
  }
});

test("copy: every critter the page can show has something for the Judge to say", async () => {
  const { WILD } = await import("../public/src/lib/fx.js");
  const residents = ["bird", "owl", "squirrel", "caterpillar", "hedgehog", "mouse", "bat", "spider"];
  for (const id of [...residents, ...WILD.map(w => w.id)]) {
    assert.ok(COPY.CRITTER_LINES[id]?.length, `copy.js: CRITTER_LINES has no lines for "${id}"`);
  }
});

test("weeks: posted entries are paid, whole, Sunday-first and add up", () => {
  checkWeeks(WEEKS, WALKERS, "weeks.js");
});

test("champion: only after week 4, and only the overall leader", () => {
  if (CHALLENGE.champion == null) return;
  assert.equal(WEEKS.length, CHALLENGE.weeks.length, "champion set before the final week was posted");
  assert.equal(standings(WALKERS, WEEKS)[0].walker.id, CHALLENGE.champion, "champion is not the total-steps leader");
});

test("announcement: null, or a live-until timestamp with a known mode", () => {
  if (ANNOUNCEMENT == null) return;
  assert.ok(!Number.isNaN(+parseLocal(ANNOUNCEMENT.until)), "ANNOUNCEMENT.until must be YYYY-MM-DDTHH:mm");
  assert.ok(["note", "getwell"].includes(ANNOUNCEMENT.mode), `unknown ANNOUNCEMENT.mode "${ANNOUNCEMENT.mode}"`);
});

test("finds: every photo exists in public/finds (or img is null)", () => {
  for (const f of FALL_FINDS) {
    if (f.img === null) continue;
    assert.ok(existsSync("public" + f.img), `finds.js: ${f.id} photo ${f.img} is missing`);
    assert.ok(f.w > 0 && f.h > 0, `finds.js: ${f.id} needs w and h`);
  }
});

test("copy: every pool from PLAN §7.1 is exported", () => {
  for (const key of ["PHASE_LINES", "COURT_WALKING", "COUNTDOWN_LABELS", "DOSSIER_LINES", "NO_STEPS_WEEK",
    "AS_COUNTED", "DERIVED_NOTE", "TOGETHER_LINES", "VERDICTS", "EXCUSES", "TOASTS", "DECOY_TOASTS",
    "BOTTLE", "RAKE_LINES", "MARGIN_NOTES", "HONOURS", "JUMP_LINES", "SQUIRREL_LINES", "MILESTONE_TOASTS",
    "CRITTER_LINES"]) {
    assert.ok(COPY[key] != null, `copy.js is missing ${key}`);
  }
});

test("demo: the ?demo=1 fixture obeys the same rules", () => {
  checkRoster(DEMO_WALKERS, "demo.js");
  checkWeeks(DEMO_WEEKS, DEMO_WALKERS, "demo.js");
});
