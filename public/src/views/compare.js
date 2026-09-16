// Settle It — head-to-head adjudication. Spec: docs/PLAN.md §5.7.
import { n, esc, rich, fill } from "../lib/format.js";
import { crest, icon, toast, reveal } from "../lib/fx.js";
import { h2h } from "../lib/stats.js";
import { climbChart } from "../lib/charts.js";

const DOW = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const vw = () => (typeof document !== "undefined" ? document.documentElement.clientWidth : 1024);

const head = () => `
  <header class="wrap page-head" data-reveal>
    <span class="ribbon">The Judge adjudicates</span>
    <h1 class="page-title">Settle It</h1>
  </header>`;

const pickGrid = (ctx, href) => `
  <div class="pick-grid">${ctx.paid.map(w => `
    <a class="chip pick" href="${esc(href(w))}">${crest(w)}<span>${esc(w.short)}</span></a>`).join("")}
  </div>`;

const emptyState = (title, sub) => `
  <section class="wrap section" data-reveal>
    <div class="card empty-state">${inner(title, sub)}</div>
  </section>`;
const inner = (title, sub) => `<p class="h3">${esc(title)}</p><p class="sub">${esc(sub)}</p>`;

function verdictFor(margin, copy) {
  if (margin === 0) return rich(copy.VERDICTS.deadEven);
  if (margin <= 5_000) return rich(fill(copy.VERDICTS.tight, { gap: n(margin) }));
  if (margin <= 25_000) return rich(copy.VERDICTS.clear);
  return rich(copy.VERDICTS.blowout);
}

export function render(ctx, { a, b } = {}) {
  if (ctx.phase === "muster" || !ctx.weeks.length) {
    return head() + emptyState("There is nothing to settle yet. Walk first.",
      "Once the first Ledger posts, the Judge will hear disputes here.") +
      `<section class="wrap section" data-reveal><a class="textlink" href="#/">See the Roll →</a></section>`;
  }

  if (!a) {
    return head() + `<section class="wrap section" data-reveal>
      <header class="section-head"><h2 class="h2">Pick a walker</h2></header>
      <div class="card">${pickGrid(ctx, w => `#/compare/${w.id}`)}</div>
    </section>`;
  }

  const A = ctx.walkers.find(w => w.id === a);
  if (!A || !A.paid) return head() + emptyState("No such walker has sworn in.", "The Court only hears paid contenders.");

  if (!b) {
    return head() + `<section class="wrap section" data-reveal>
      <header class="section-head"><h2 class="h2">And the other?</h2></header>
      <div class="card">${pickGrid({ ...ctx, paid: ctx.paid.filter(w => w.id !== a) }, w => `#/compare/${a}/${w.id}`)}</div>
    </section>`;
  }

  const B = ctx.walkers.find(w => w.id === b);
  if (!B || !B.paid) return head() + emptyState("No such walker has sworn in.", "The Court only hears paid contenders.");

  if (a === b) {
    return head() + emptyState("The Judge declines to adjudicate a walker against themselves.",
      "They would win. They would also lose.") +
      `<section class="wrap section" data-reveal><a class="textlink" href="#/compare">Pick two different walkers →</a></section>`;
  }

  const rA = ctx.standings.find(r => r.walker.id === a);
  const rB = ctx.standings.find(r => r.walker.id === b);
  const h = h2h(a, b, ctx.weeks);
  const margin = Math.abs(rA.total - rB.total);
  const winner = rA.total >= rB.total ? rA : rB;

  const side = r => `
    <div class="vs-side" style="--c:var(--walker-${r.walker.color})">
      ${crest(r.walker, "crest-56")}
      <p class="vs-name">${esc(r.walker.name)}</p>
      <p class="vs-total num" data-count="${r.total}">${n(r.total)}</p>
      <p class="caption">${r.rank === 1 ? "the lead" : `${n(ctx.standings[0].total - r.total)} behind`}</p>
      ${r.bestDay ? `<p class="vs-best">Best day: ${n(r.bestDay.n)} <span class="caption">(${DOW[r.bestDay.day]}, W${r.bestDay.week})</span></p>` : ""}
    </div>`;

  const weekRows = h.byWeek.map(w => `
    <tr>
      <th scope="row">W${w.week}</th>
      <td class="num">${w.a === null ? "—" : n(w.a)}</td>
      <td class="num">${w.b === null ? "—" : n(w.b)}</td>
      <td>${w.winner === "tie" ? "tie" : w.winner === "a" ? esc(A.short) : esc(B.short)}</td>
    </tr>`).join("");

  return head() + `
  <section class="wrap section" data-reveal>
    <div class="card card-raised vs">
      <div class="vs-grid">
        ${side(rA)}
        <p class="vs-mark" aria-hidden="true">VS</p>
        ${side(rB)}
      </div>
      <p class="verdict-line">${verdictFor(margin, ctx.copy)}</p>
      <p class="h2h-score">Weeks taken: <b class="num">${h.aWins}–${h.bWins}${h.ties ? `–${h.ties}` : ""}</b> · ${esc(winner.walker.short)} leads by <b class="num">${n(margin)}</b></p>
      <div class="btn-row">
        <button class="btn btn-primary" type="button" id="shareBtn">${icon("share")}Share this verdict</button>
        <a class="btn btn-secondary" href="#/compare/${b}/${a}">Swap</a>
      </div>
    </div>
  </section>
  <section class="wrap section" data-reveal>
    <header class="section-head"><h2 class="h2">The Climb, head to head</h2></header>
    <div class="card">${climbChart(ctx.standings.filter(r => r.walker.id === a || r.walker.id === b), ctx.weeks, vw())}</div>
    <details class="chart-data week-table"><summary>Week by week</summary>
      <table><thead><tr><th scope="col">Week</th><th scope="col">${esc(A.short)}</th><th scope="col">${esc(B.short)}</th><th scope="col">Taken by</th></tr></thead>
      <tbody>${weekRows}</tbody></table>
    </details>
  </section>`;
}

export function mount(root, ctx, params = {}) {
  reveal(root);
  const btn = root.querySelector("#shareBtn");
  if (!btn) return;
  const url = location.href;
  const copy = () => navigator.clipboard?.writeText(url)
    .then(() => toast(esc(ctx.copy.TOASTS.copied)))
    .catch(() => toast(`Copy this link: <b>${esc(url)}</b>`))
    ?? toast(`Copy this link: <b>${esc(url)}</b>`);
  btn.addEventListener("click", async () => {
    const A = ctx.walkers.find(w => w.id === params.a), B = ctx.walkers.find(w => w.id === params.b);
    if (!navigator.share) { copy(); return; }
    try {
      await navigator.share({
        title: `Settle It — ${A.short} vs ${B.short}`,
        text: `The Judge adjudicates: ${A.short} vs ${B.short}, Stridetober.`,
        url,
      });
    } catch (e) {
      if (e.name !== "AbortError") copy();
    }
  });
}
