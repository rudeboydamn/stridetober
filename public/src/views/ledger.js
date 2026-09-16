// The Ledger — standings, charts, honours. Spec: docs/PLAN.md §5.3.
// The Reading of the Ledger (M13/§4.7) replays a new week's reorder on first visit.
import { countdownParts, parseLocal } from "../lib/time.js";
import { n, esc, rich } from "../lib/format.js";
import { seal, crest, delta, reveal, flip, burst, toast, reduced } from "../lib/fx.js";
import { climbChart, totalsChart } from "../lib/charts.js";
import { purse } from "../lib/stats.js";

const vw = () => (typeof document !== "undefined" ? document.documentElement.clientWidth : 1024);

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
  const crowned = ctx.phase === "crowned";
  const purse_ = crowned ? purse(ctx.walkers, ctx.challenge) : null;

  // In the crowned phase the first three rows carry their share of the pot.
  const payChip = r => {
    if (!crowned || r.rank > 3) return "";
    const share = purse_.shares[r.rank - 1];
    if (!share) return "";
    const sent = ctx.challenge.payouts?.[r.rank];
    return `<span class="chip pay-chip">${ctx.copy.PODIUM[r.rank - 1].medal} $${n(share.amount)}${sent ? " · sent ✓" : ""}</span>`;
  };

  const cards = ctx.standings.map((r, i) => `
    <li class="card lb-row${r.rank === 1 && crowned ? " is-champ" : ""}" data-id="${r.walker.id}" style="--c:var(--walker-${r.walker.color});--i:${i}">
      <span class="lb-rank" aria-label="Rank ${r.rank}">${r.rank}</span>
      <a class="lb-who" href="#/walker/${r.walker.id}">${crest(r.walker)}
        <span class="lb-name"><span class="full">${esc(r.walker.name)}</span><span class="short">${esc(r.walker.short)}</span></span></a>
      <span class="lb-right"><b class="num lb-total" data-count="${r.total}">${n(r.total)}</b>${delta(r)}${payChip(r)}</span>
      <span class="harvest lb-bar" aria-hidden="true"><i class="harvest-fill" style="--p:${(r.total / top).toFixed(4)}"></i></span>
      ${r.byWeek.at(-1) === "missing" ? missingStamp : ""}
    </li>`).join("");

  const weekCols = ctx.challenge.weeks.map(w => `<th scope="col">W${w.n}</th>`).join("");
  const rows = ctx.standings.map(r => `
    <tr class="${r.rank === 1 && crowned ? "is-champ" : ""}" data-id="${r.walker.id}" style="--c:var(--walker-${r.walker.color})">
      <td class="num">${r.rank}</td>
      <th scope="row"><a class="lb-who" href="#/walker/${r.walker.id}">${crest(r.walker)}${esc(r.walker.name)}</a>${payChip(r)}</th>
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
    return `<li><a class="chip" href="#/walker/${h.who}">🍂 ${esc(label)} — ${esc(who?.short || h.who)}</a></li>`;
  }).join("");

  return head(kick, sub) + `
  <section class="wrap section" data-reveal>
    <div class="reading-head" id="readingHead"></div>
    <ol class="lb-cards">${cards}</ol>
    <div class="lb-table-wrap">
      <table class="lb-table">
        <thead><tr><th scope="col">Rank</th><th scope="col">Walker</th>${weekCols}<th scope="col">Total</th><th scope="col">Δ</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
  </section>
  <section class="wrap section" data-reveal>
    <header class="section-head"><h2 class="h2">The Climb</h2><p class="sub">Cumulative steps, week over week.</p></header>
    <div class="card">${climbChart(ctx.standings, ctx.weeks, vw())}</div>
  </section>
  <section class="wrap section" data-reveal>
    <header class="section-head"><h2 class="h2">The Totals</h2></header>
    <div class="card">${totalsChart(ctx.standings, vw())}</div>
  </section>
  ${shelf ? `<section class="wrap section" data-reveal>
    <header class="section-head"><h2 class="h2">The Honours Shelf</h2></header>
    <ul class="honours">${shelf}</ul>
  </section>` : ""}`;
}

// ── the Reading of the Ledger (M13) ────────────────────────
const SEEN = "stridetober:last-seen-week";
const seenWeek = () => { try { return +localStorage.getItem(SEEN) || 0; } catch { return Infinity; } };
const markSeen = w => { try { localStorage.setItem(SEEN, String(w)); } catch { /* private mode */ } };

export function mount(root, ctx) {
  reveal(root);
  const latest = ctx.weeks.at(-1)?.week ?? 0;
  if (!latest) return;

  const fresh = latest > seenWeek() && ctx.prevStandings;
  if (!fresh) { markSeen(latest); return; }

  const lists = [root.querySelector(".lb-cards"), root.querySelector(".lb-table tbody")].filter(Boolean);
  const applyOrder = (list, ids) => ids.forEach(id => {
    const el = list.querySelector(`[data-id="${id}"]`);
    if (el) list.appendChild(el);
  });
  const prevIds = ctx.prevStandings.map(r => r.walker.id);
  const curIds = ctx.standings.map(r => r.walker.id);
  const leaderChanged = prevIds[0] && prevIds[0] !== curIds[0];

  // Show the previous week's order with deltas hidden, then read the new order aloud.
  root.classList.add("reading");
  lists.forEach(l => applyOrder(l, prevIds));

  const skip = Object.assign(document.createElement("button"), {
    className: "textlink reading-skip", type: "button", textContent: "Skip ▸",
  });
  root.querySelector("#readingHead")?.appendChild(skip);

  let done = false;
  const read = () => {
    if (done) return;
    done = true;
    lists.forEach(l => flip(l, () => applyOrder(l, curIds)));
    setTimeout(() => {
      root.classList.remove("reading");
      root.querySelectorAll(".delta").forEach(d => d.classList.add("pop-in"));
      if (leaderChanged) { burst({}); toast(esc(ctx.copy.TOASTS.newLeader)); }
      markSeen(latest);
      skip.remove();
    }, reduced() ? 0 : 760);
  };
  const timer = setTimeout(read, 600);
  skip.addEventListener("click", () => { clearTimeout(timer); read(); });
}

export function tick(root, ctx) {
  const chip = root.querySelector(".empty-state .chip");
  if (!chip || ctx.phase !== "muster") return;
  const p = countdownParts(ctx.now, parseLocal(ctx.challenge.kickoff));
  chip.textContent = `Opens in ${+p.d}d ${p.h}h ${p.m}m`;
}
