// Standings, honours and group totals. Spec: docs/PLAN.md §7.4.
// Only paid walkers ever appear in standings or honours. Ties go to the
// earliest walker in roster order (the Roll is kept in payment order).

export const MILE = 2000;          // steps per mile
const MARATHON = 26.2;             // miles

const isNum = v => typeof v === "number" && Number.isFinite(v);

export const paidWalkers = walkers => walkers.filter(w => w.paid === true);

export const weekSteps = week =>
  Object.fromEntries(Object.entries(week.steps || {}).map(([id, v]) => [id, isNum(v) ? v : 0]));

export function totals(weeks) {
  const t = {};
  for (const week of weeks) {
    for (const [id, v] of Object.entries(weekSteps(week))) t[id] = (t[id] || 0) + v;
  }
  return t;
}

function ranked(walkers, weeks) {
  const rows = paidWalkers(walkers).map(walker => {
    const byWeek = weeks.map(w => (isNum(w.steps?.[walker.id]) ? w.steps[walker.id] : "missing"));
    return { walker, byWeek, total: byWeek.reduce((a, v) => a + (isNum(v) ? v : 0), 0) };
  });
  rows.sort((a, b) => b.total - a.total || a.walker.name.localeCompare(b.walker.name));
  rows.forEach((r, i) => { r.rank = i && r.total === rows[i - 1].total ? rows[i - 1].rank : i + 1; });
  return rows;
}

export function standings(walkers, weeks) {
  const rows = ranked(walkers, weeks);
  const prev = weeks.length > 1 ? ranked(walkers, weeks.slice(0, -1)) : null;
  for (const r of rows) {
    r.prevRank = prev ? prev.find(p => p.walker.id === r.walker.id).rank : null;
    r.delta = prev ? r.prevRank - r.rank : null;
    r.perDay = weeks.length ? r.total / (weeks.length * 7) : 0;
    r.bestDay = null;
    for (const w of weeks) {
      (w.days?.[r.walker.id] || []).forEach((v, day) => {
        if (isNum(v) && (!r.bestDay || v > r.bestDay.n)) r.bestDay = { n: v, week: w.week, day };
      });
    }
  }
  return rows;
}

export const leader = rows => (rows[0] && rows[0].total > 0 ? rows[0] : null);

export const gapToLead = (rows, id) =>
  (rows[0]?.total ?? 0) - (rows.find(r => r.walker.id === id)?.total ?? 0);

// Strict comparisons keep the first candidate on a tie; candidates are generated
// week by week in roster order.
const best = (cands, better) => cands.reduce((b, c) => (!b || better(c.score, b.score) ? c : b), null);
const most = cands => best(cands, (a, b) => a > b);
const least = cands => best(cands, (a, b) => a < b);

const fullWeek = d => Array.isArray(d) && d.length === 7 && d.every(isNum);

export function honours(walkers, weeks, { final = weeks.length >= 4 } = {}) {
  const ids = paidWalkers(walkers).map(w => w.id);
  const out = [];
  const award = (key, c) => { if (c) out.push({ key, who: c.who, detail: c.detail }); };
  const each = fn => weeks.flatMap((w, i) => ids.flatMap(id => fn(w, id, i) || []));

  const last = weeks.at(-1);
  if (last) {
    award("leaf-pile", most(ids.filter(id => isNum(last.steps?.[id]) && last.steps[id] > 0)
      .map(id => ({ who: id, score: last.steps[id], detail: { n: last.steps[id], week: last.week } }))));
  }

  award("longest", most(each((w, id) => (w.days?.[id] || []).flatMap((v, day) =>
    isNum(v) ? [{ who: id, score: v, detail: { n: v, week: w.week, day } }] : []))));

  award("metronome", least(each((w, id) => {
    const d = w.days?.[id];
    if (!fullWeek(d)) return null;
    const range = Math.max(...d) - Math.min(...d);
    return { who: id, score: range, detail: { n: range, week: w.week } };
  })));

  award("weekender", most(each((w, id) => {
    const d = w.days?.[id];
    const sum = fullWeek(d) ? d.reduce((a, b) => a + b, 0) : 0;
    if (!sum) return null;
    const pct = (d[0] + d[6]) / sum;                       // Sunday + Saturday
    return { who: id, score: pct, detail: { pct, week: w.week } };
  })));

  award("second-wind", most(each((w, id, i) => {
    const prev = weeks[i - 1]?.steps?.[id], cur = w.steps?.[id];
    if (!isNum(prev) || !isNum(cur) || cur - prev <= 0) return null;
    return { who: id, score: cur - prev, detail: { n: cur - prev, week: w.week } };
  })));

  const weekWinner = w => {
    const top = ids.filter(id => isNum(w.steps?.[id])).sort((a, b) => w.steps[b] - w.steps[a]);
    if (top.length < 2 || w.steps[top[0]] === w.steps[top[1]]) return null;
    return { who: top[0], margin: w.steps[top[0]] - w.steps[top[1]] };
  };
  award("photo-finish", least(weeks.flatMap(w => {
    const win = weekWinner(w);
    return win ? [{ who: win.who, score: win.margin, detail: { n: win.margin, week: w.week } }] : [];
  })));

  for (const w of [...weeks].reverse()) {
    const who = ids.find(id => isNum(w.steps?.[id]) && (w.days?.[id] || []).includes(0));
    if (who) { award("rest-day", { who, detail: { week: w.week, day: w.days[who].indexOf(0) } }); break; }
  }

  if (final) {
    const won = new Set(weeks.flatMap(w => {
      const top = Math.max(0, ...ids.map(id => (isNum(w.steps?.[id]) ? w.steps[id] : 0)));
      return top > 0 ? ids.filter(id => w.steps?.[id] === top) : [];
    }));
    const t = totals(weeks);
    award("quiet", most(ids.filter(id => !won.has(id) && t[id] > 0)
      .map(id => ({ who: id, score: t[id], detail: { n: t[id] } }))));
  }

  return out;
}

export function together(t) {
  const steps = Object.values(t).reduce((a, v) => a + (isNum(v) ? v : 0), 0);
  const miles = steps / MILE;
  return { steps, miles, km: miles * 1.609344, marathons: miles / MARATHON };
}

// The pot: paid × buyIn, split per challenge.split ([0.5, 0.3, 0.2] → 1st/2nd/3rd).
// Amounts are whole dollars: pot is always a multiple of $20 and each share a multiple of $2.
export function purse(walkers, challenge) {
  const pot = paidWalkers(walkers).length * challenge.buyIn;
  return { pot, shares: challenge.split.map((pct, i) => ({ place: i + 1, pct, amount: Math.round(pot * pct) })) };
}

// Head-to-head record between two walkers across posted weeks.
// Missing weeks still count (a NO SCREENSHOT is a loss — "No screenshot = No steps!").
export function h2h(aId, bId, weeks) {
  const byWeek = weeks.map(w => {
    const a = w.steps?.[aId], b = w.steps?.[bId];
    const an = isNum(a) ? a : 0, bn = isNum(b) ? b : 0;
    return { week: w.week, a: isNum(a) ? a : null, b: isNum(b) ? b : null,
             winner: an > bn ? "a" : bn > an ? "b" : "tie" };
  });
  return {
    byWeek,
    aWins: byWeek.filter(w => w.winner === "a").length,
    bWins: byWeek.filter(w => w.winner === "b").length,
    ties: byWeek.filter(w => w.winner === "tie").length,
  };
}
