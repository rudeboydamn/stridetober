// Challenge clock. Spec: docs/PLAN.md §7.2.
// Every date in the data files is LOCAL wall-clock time on the viewer's device —
// steps are counted by each walker's own phone calendar. Never hand a date-only
// ISO string to new Date(): it parses as UTC midnight, which is still Saturday
// evening in the Americas.

export const DAY = 86_400_000;

export function parseLocal(s) {
  const [y, mo, d, h = 0, mi = 0, se = 0] = String(s).split(/\D+/).map(Number);
  return new Date(y, mo - 1, d, h, mi, se);
}

export function endOfDay(s) {
  const d = parseLocal(s);
  d.setHours(23, 59, 59, 999);
  return d;
}

const isPosted = (weeks, n) => weeks.some(w => w.week === n);

export function phaseOf(now, challenge, weeks) {
  if (now < parseLocal(challenge.kickoff)) return "muster";
  if (now < parseLocal(challenge.finalBell)) return "walking";
  return isPosted(weeks, challenge.weeks.length) ? "crowned" : "counting";
}

export function currentWeek(challenge, now) {
  return challenge.weeks.find(w => now >= parseLocal(w.start) && now <= endOfDay(w.end)) ?? null;
}

export function weekStatus(wk, now, weeks) {
  if (isPosted(weeks, wk.n)) return "posted";
  if (now < parseLocal(wk.start)) return "upcoming";
  return now <= endOfDay(wk.end) ? "walking" : "counting";
}

// What the countdown card aims at right now.
export function nextMilestone({ now, challenge, weeks }) {
  const phase = phaseOf(now, challenge, weeks);
  if (phase === "muster") return { key: "kickoff", target: parseLocal(challenge.kickoff) };
  if (phase === "counting") return { key: "counted", target: null };
  if (phase === "crowned") return { key: "done", target: null };

  const due = challenge.weeks.find(w =>
    !isPosted(weeks, w.n) && now >= parseLocal(w.due) && now <= endOfDay(w.due));
  if (due) return { key: "due", week: due.n, target: endOfDay(due.due) };

  const cur = currentWeek(challenge, now);
  if (cur.n === challenge.weeks.length) return { key: "bell", week: cur.n, target: parseLocal(challenge.finalBell) };
  return { key: "weekEnd", week: cur.n, target: endOfDay(cur.end) };
}

export function countdownParts(now, target) {
  const totalMs = Math.max(0, target - now);
  const pad = v => String(v).padStart(2, "0");
  return {
    d: pad(Math.floor(totalMs / DAY)),
    h: pad(Math.floor(totalMs / 3_600_000) % 24),
    m: pad(Math.floor(totalMs / 60_000) % 60),
    s: pad(Math.floor(totalMs / 1000) % 60),
    totalMs,
  };
}

export function daypart(now) {
  const h = now.getHours();
  if (h >= 5 && h <= 10) return "morning";
  if (h >= 11 && h <= 16) return "afternoon";
  if (h >= 17 && h <= 19) return "dusk";
  return "night";
}

export const isEve = now => now.getMonth() === 9 && now.getDate() === 31;

export const announcementLive = (announcement, now) =>
  !!announcement && now < parseLocal(announcement.until);

// Changes exactly when the current view has to re-render (PLAN §7.7).
export function phaseSignature({ now, challenge, weeks, crownedSeen = false, announcement = null }) {
  return [
    phaseOf(now, challenge, weeks),
    currentWeek(challenge, now)?.n ?? "-",
    weeks.length,
    nextMilestone({ now, challenge, weeks }).key,
    isEve(now),
    crownedSeen,
    announcementLive(announcement, now),
  ].join("|");
}
