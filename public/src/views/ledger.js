// The Ledger — standings. Spec: docs/PLAN.md §5.3.
// R1 ships the muster empty state and the standings rows/table; charts and the
// Reading of the Ledger (FLIP) arrive with Task 8.
import { countdownParts, parseLocal } from "../lib/time.js";
import { n, esc, rich } from "../lib/format.js";
import { seal, crest, delta, reveal } from "../lib/fx.js";

const head = (kick, sub = "") => `
  <header class="wrap page-head" data-reveal>
    <span class="ribbon">${esc(kick)}</span>
    <h1 class="page-title">The Ledger</h1>
    ${sub ? `<p class="sub">${rich(sub)}</p>` : ""}
  </header>`;

const empty = inner => `
  <section class="wrap section" data-reveal>
    <div class="card empty-state">${seal("", { size: "seal-96", cls: "hollow" })}${inner}</div>
  </section>`;

const missingStamp = `<span class="stamp stamp-sm">No screenshot</span>`;

export function render(ctx) {
  if (ctx.phase === "muster") {
    const p = countdownParts(ctx.now, parseLocal(ctx.challenge.kickoff));
    return head("Opens at kickoff") + empty(`
      <p class="h3">The ledger opens at kickoff.</p>
      <span class="chip num">Opens in ${+p.d}d ${p.h}h ${p.m}m</span>
      <a class="textlink" href="#/">See the Roll →</a>`);
  }
  if (!ctx.weeks.length) {
    const E = ctx.copy.LEDGER_EMPTY;
    return head(`Week ${ctx.week?.n ?? 1} of 4`) + empty(`<p class="h3">${rich(E.head)}</p><p class="sub">${rich(E.sub)}</p>`);
  }

  const kick = ctx.phase === "crowned" ? "Final" : ctx.phase === "counting" ? "The Final Bell" : `Week ${ctx.week.n} of 4`;
  const sub = ctx.phase === "crowned" ? "So ordered. The Judge is *fairly* confident in the arithmetic."
    : ctx.phase === "counting" ? "The Judge is counting — nothing below is final."
    : `Every step accounted for after week ${ctx.weeks.length}. Nothing is rounded. Ever.`;
  const top = Math.max(1, ctx.standings[0]?.total || 0);
  const champ = ctx.phase === "crowned" ? ctx.challenge.champion : null;

  const cards = ctx.standings.map((r, i) => `
    <li class="card lb-row${r.walker.id === champ ? " is-champ" : ""}" style="--c:var(--walker-${r.walker.color});--i:${i}">
      <span class="lb-rank" aria-label="Rank ${r.rank}">${r.rank}</span>
      ${crest(r.walker)}
      <span class="lb-name"><span class="full">${esc(r.walker.name)}</span><span class="short">${esc(r.walker.short)}</span></span>
      <span class="lb-right"><b class="num lb-total" data-count="${r.total}">${n(r.total)}</b>${delta(r)}</span>
      <span class="harvest lb-bar" aria-hidden="true"><i class="harvest-fill" style="--p:${(r.total / top).toFixed(4)}"></i></span>
      ${r.byWeek.at(-1) === "missing" ? missingStamp : ""}
    </li>`).join("");

  const weekCols = ctx.challenge.weeks.map(w => `<th scope="col">W${w.n}</th>`).join("");
  const rows = ctx.standings.map(r => `
    <tr class="${r.walker.id === champ ? "is-champ" : ""}" style="--c:var(--walker-${r.walker.color})">
      <td class="num">${r.rank}</td>
      <th scope="row"><span class="lb-who">${crest(r.walker)}${esc(r.walker.name)}</span></th>
      ${ctx.challenge.weeks.map((w, k) => {
        const v = r.byWeek[k];
        return `<td class="num">${v === undefined ? "—" : v === "missing" ? missingStamp : n(v)}</td>`;
      }).join("")}
      <td class="num lb-total">${n(r.total)}</td>
      <td>${delta(r)}</td>
    </tr>`).join("");

  const shelf = ctx.honours.map(h => {
    const label = ctx.copy.HONOURS.find(x => x.key === h.key)?.label || h.key;
    const who = ctx.walkers.find(w => w.id === h.who);
    return `<li class="chip">🍂 ${esc(label)} — ${esc(who?.short || h.who)}</li>`;
  }).join("");

  return head(kick, sub) + `
  <section class="wrap section" data-reveal>
    <ol class="lb-cards">${cards}</ol>
    <div class="lb-table-wrap">
      <table class="lb-table">
        <thead><tr><th scope="col">Rank</th><th scope="col">Walker</th>${weekCols}<th scope="col">Total</th><th scope="col">Δ</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
  </section>
  ${shelf ? `<section class="wrap section" data-reveal>
    <header class="section-head"><h2 class="h2">The Honours Shelf</h2></header>
    <ul class="honours">${shelf}</ul>
  </section>` : ""}`;
}

export function mount(root) {
  reveal(root);
}

export function tick(root, ctx) {
  const chip = root.querySelector(".empty-state .chip");
  if (!chip || ctx.phase !== "muster") return;
  const p = countdownParts(ctx.now, parseLocal(ctx.challenge.kickoff));
  chip.textContent = `Opens in ${+p.d}d ${p.h}h ${p.m}m`;
}
