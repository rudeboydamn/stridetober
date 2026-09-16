// Dossier — one walker, examined. Spec: docs/PLAN.md §5.4.
import { n, esc, rich, ord, pick, fill, fmtRange } from "../lib/format.js";
import { seal, crest, note, delta, reveal } from "../lib/fx.js";
import { dailyChart } from "../lib/charts.js";
import { h2h } from "../lib/stats.js";

const DOW = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const band = (r, size) =>
  !r ? "bottom"
  : r.rank === 1 ? "lead"
  : r.rank === size ? "bottom"
  : r.rank <= 3 ? "chase"
  : "mid";

const seedOf = id => [...id].reduce((a, c) => a + c.charCodeAt(0), 0);

function weekCard(ctx, w, wk) {
  const steps = wk.steps?.[w.id];
  const days = wk.days?.[w.id];
  const derived = (wk.derived || []).includes(w.id);
  const postedHere = w.id in (wk.steps || {});
  return `
  <article class="card week-card">
    <header class="week-head">
      <h3 class="h3">Week ${wk.week}</h3>
      <span class="caption">${fmtRange(wk.start ?? ctx.challenge.weeks[wk.week - 1].start, wk.end ?? ctx.challenge.weeks[wk.week - 1].end)}</span>
    </header>
    ${!postedHere || steps === null ? `
      <p class="week-zero">0 steps counted</p><span class="stamp week-stamp">No screenshot</span>` : `
      <p class="week-total"><b class="num" data-count="${steps}">${n(steps)}</b> steps</p>
      ${days ? dailyChart(days, { color: w.color, derived }) : `<p class="caption">Dailies pending — the Judge accepted the total.</p>`}
      ${derived ? `<details class="chart-data derived-note"><summary>${esc(ctx.copy.DERIVED_NOTE.head)}</summary><p class="caption">${esc(ctx.copy.DERIVED_NOTE.body)}</p></details>` : ""}`}
  </article>`;
}

export function render(ctx, { id } = {}) {
  const w = ctx.walkers.find(x => x.id === id);
  if (!w) {
    return `<section class="wrap section"><div class="card off-trail" data-reveal>
      <h1 class="h2">No such walker has sworn in.</h1>
      <p class="sub">The Roll knows nothing of “${esc(id || "?")}”.</p>
      <a class="btn btn-primary" href="#/">See the Roll</a></div></section>`;
  }

  const r = ctx.standings.find(x => x.walker.id === id);
  if (!r) {
    return `<header class="wrap page-head" data-reveal>
        <span class="ribbon">Tribute pending</span>
        <h1 class="page-title">${esc(w.name)}</h1>
      </header>
      <section class="wrap section"><div class="card empty-state" data-reveal>
        ${seal("", { size: "seal-96", cls: "hollow" })}
        <p class="h3">The $20 has not landed yet.</p>
        <p class="sub">The Ledger will not see ${esc(w.short)} until it does. NO $20 = NO COMPETING!</p>
        <a class="textlink" href="#/">Back to the Roll →</a>
      </div></section>`;
  }

  const lines = ctx.copy.DOSSIER_LINES[band(r, ctx.standings.length)];
  const assessment = fill(pick(lines, seedOf(id) + ctx.weeks.length), { name: esc(w.short) });
  const lead = ctx.standings[0];
  const gap = lead.walker.id === id ? "the lead" : `${n(gapTo(r, lead))} behind`;
  const h2hRows = ctx.standings
    .filter(o => o.walker.id !== id)
    .map(o => {
      const h = h2h(id, o.walker.id, ctx.weeks);
      const diff = r.total - o.total;
      return `<a class="h2h-row" href="#/compare/${id}/${o.walker.id}">
        ${crest(o.walker)}
        <span class="h2h-name">vs ${esc(o.walker.short)}</span>
        <span class="chip num">${h.aWins}–${h.bWins}${h.ties ? `–${h.ties}` : ""}</span>
        <span class="num h2h-gap">${diff === 0 ? "even" : diff > 0 ? `+${n(diff)}` : `−${n(-diff)}`}</span>
      </a>`;
    }).join("");

  const myHonours = ctx.honours.filter(h => h.who === id).map(h => {
    const meta = ctx.copy.HONOURS.find(x => x.key === h.key);
    return `<li class="chip">🍂 ${esc(meta?.label || h.key)}</li>`;
  }).join("");

  return `
  <header class="wrap page-head" data-reveal>
    <span class="ribbon">Dossier</span>
  </header>
  <section class="wrap" data-reveal>
    <div class="card card-raised dossier-hero">
      <div class="dossier-top">
        ${crest(w, "crest-56")}
        <div class="dossier-id">
          <h1 class="h2">${esc(w.name)}</h1>
          <p class="caption">${ord(r.rank)} of ${ctx.standings.length} ${delta(r)}</p>
        </div>
      </div>
      <p class="dossier-assess">${rich(assessment)}</p>
      <dl class="stat-grid">
        <div><dt>Total</dt><dd class="num" data-count="${r.total}">${n(r.total)}</dd></div>
        <div><dt>Per day avg</dt><dd class="num">${n(Math.round(r.perDay))}</dd></div>
        <div><dt>Gap to lead</dt><dd class="num">${esc(gap)}</dd></div>
      </dl>
      <div class="dossier-note">${note(pick(ctx.copy.MARGIN_NOTES, seedOf(id)))}</div>
    </div>
  </section>

  ${ctx.weeks.length ? `<section class="wrap section" data-reveal>
    <header class="section-head"><h2 class="h2">Week by week</h2></header>
    <div class="weeks-grid">${ctx.weeks.map(wk => weekCard(ctx, w, wk)).join("")}</div>
  </section>` : ""}

  ${myHonours ? `<section class="wrap section" data-reveal>
    <header class="section-head"><h2 class="h2">Honours</h2></header>
    <ul class="honours">${myHonours}</ul>
  </section>` : `<section class="wrap section" data-reveal>
    <p class="caption">No honours yet. The Judge is watching. <em>Fairly</em>.</p>
  </section>`}

  ${h2hRows ? `<section class="wrap section" data-reveal>
    <header class="section-head"><h2 class="h2">Head to head</h2><p class="sub">Weeks won across posted results. Tap to adjudicate.</p></header>
    <div class="card h2h-list">${h2hRows}</div>
  </section>` : ""}`;
}

const gapTo = (r, lead) => lead.total - r.total;

export function mount(root) {
  reveal(root);
}
