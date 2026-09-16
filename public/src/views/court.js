// The Court — home, per phase. Spec: docs/PLAN.md §5.2.
import { nextMilestone, countdownParts, parseLocal } from "../lib/time.js";
import { n, esc, rich, fill, pick } from "../lib/format.js";
import { totals, together } from "../lib/stats.js";
import { SPRITE, seal, crest, note, delta, countdownHTML, tickCountdown, tallySvg, reveal } from "../lib/fx.js";

const longDay = s => parseLocal(s).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });

// ── hero ──────────────────────────────────────────────────
function hero(ctx) {
  const L = ctx.copy.PHASE_LINES[ctx.phase];
  const wk = ctx.week?.n ?? ctx.weeks.length;
  const head = ctx.phase === "walking" ? pick(ctx.copy.COURT_WALKING, wk - 1) : L.head;
  const muster = ctx.phase === "muster";
  const venmo = esc(ctx.challenge.venmoUrl);
  return `
  <section class="hero" data-reveal>
    <div class="wrap hero-grid">
      <div class="hero-copy">
        <span class="ribbon">${esc(fill(L.kick, { n: wk }))}</span>
        <h1 class="hero-title">${rich(head, { n: wk })}</h1>
        <p class="hero-sub">${rich(L.sub)}</p>
        ${muster ? `<p class="hero-lede">It's time to find out who has the most active feet… and who has been training professionally for the Couch Olympics.</p>
        ${note("stretch now, thank us later", "hero-note flip")}` : ""}
        <div class="btn-row hero-cta">
          ${muster
            ? `<a class="btn btn-primary" href="${venmo}" target="_blank" rel="noopener">Pay the Tribute 🪙</a>
               <a class="btn btn-secondary" href="#/rules">Read the Decree</a>`
            : `<a class="btn btn-primary" href="#/ledger">See the Ledger</a>
               <a class="btn btn-secondary" href="#/check-in">Check-in</a>`}
        </div>
      </div>
      <div class="hero-art">
        <svg class="hero-sneaker" viewBox="0 0 64 32" aria-hidden="true"><use href="${SPRITE}#sneaker"/></svg>
        <button class="bottle" type="button" aria-label="The water bottle has advice">
          <svg viewBox="0 0 36 72" aria-hidden="true"><use href="${SPRITE}#bottle"/></svg>
          <span class="bottle-label" aria-hidden="true">Small steps make big changes</span>
        </button>
        <p class="bubble-slot" role="status"></p>
      </div>
    </div>
  </section>`;
}

// ── countdown ─────────────────────────────────────────────
const CAPTIONS = {
  kickoff: (m, ctx) => `${longDay(ctx.challenge.kickoff)} · 12:00 AM, your time`,
  weekEnd: (m, ctx) => `Week ${m.week} is called ${longDay(ctx.challenge.weeks[m.week - 1].end)} at midnight`,
  due:     m => `Week ${m.week} screenshots are due tonight, 11:59 PM — DIRECTLY TO DAMMY`,
  bell:    () => "The clock strikes 12:00 AM on November 1st",
};

const srSentence = (p, label) => `${+p.d} days, ${+p.h} hours and ${+p.m} minutes ${label}.`;
const witching = p => p.totalMs > 0 && p.totalMs < 3_600_000;

function countdownCard(ctx) {
  const m = nextMilestone(ctx);
  const label = ctx.copy.COUNTDOWN_LABELS[m.key];
  if (!m.target) {
    return `
    <section class="wrap section" data-reveal>
      <div class="card countdown-card">
        <span class="kicker">${esc(label)}</span>
        <div class="counting-row">${tallySvg(m.key === "counted")}
          <p class="h3">${m.key === "counted" ? "Pens down. Sneakers off." : "The walking is done."}</p></div>
      </div>
    </section>`;
  }
  const p = countdownParts(ctx.now, m.target);
  return `
  <section class="wrap section" data-reveal>
    <div class="card countdown-card" id="countdown" data-key="${m.key}"${witching(p) ? " data-witching" : ""}>
      <span class="kicker">${esc(label)}</span>
      ${countdownHTML(p)}
      <p class="cd-caption">${esc(CAPTIONS[m.key](m, ctx))}</p>
      ${m.key === "due" ? `<p class="counting-row small">${tallySvg()}<span>The Judge is counting</span></p>` : ""}
      <p class="sr-only cd-sr">${srSentence(p, label)}</p>
    </div>
  </section>`;
}

// ── muster sections ───────────────────────────────────────
function tribute(ctx) {
  const sworn = ctx.paid.length, pot = sworn * ctx.challenge.buyIn;
  return `
  <section class="wrap section" data-reveal>
    <div class="card card-raised tribute">
      ${seal("$20", { size: "seal-96", label: "Twenty dollar tribute" })}
      <div class="tribute-body">
        <h2 class="h2">The Tribute</h2>
        <p class="tribute-line">Send your $20 to Dammy BEFORE October 4th!</p>
        <a class="btn btn-primary btn-ring" href="${esc(ctx.challenge.venmoUrl)}" target="_blank" rel="noopener">Pay the Tribute 🪙</a>
        <p class="caption">Venmo @${esc(ctx.challenge.venmoHandle)}</p>
        <p class="pot">The pot so far: <b class="num" data-count="${pot}">${n(pot)}</b> dollars · ${sworn} sworn</p>
      </div>
      <span class="stamp tribute-stamp">NO $20 = NO COMPETING!</span>
    </div>
  </section>`;
}

function roll(ctx) {
  const list = [...ctx.walkers].sort((a, b) => Number(b.paid === true) - Number(a.paid === true));
  const body = list.length
    ? `<ul class="roll">${list.map((w, i) => `
        <li class="card roll-card thuds" style="--i:${i}">
          ${crest(w)}
          ${w.paid ? seal("Paid", { cls: "stamps", i, label: "Paid" }) : seal("", { cls: "hollow" })}
          <span class="roll-name">${esc(w.name)}</span>
          <span class="caption">${w.paid ? "sworn in" : "tribute pending"}</span>
        </li>`).join("")}</ul>`
    : `<div class="card roll-empty">
        ${seal("", { size: "seal-96", cls: "hollow" })}
        <p class="h3">The Roll awaits its first tribute.</p>
        ${note("the early bird avoids the guilt")}
      </div>`;
  return `
  <section class="wrap section" data-reveal>
    <header class="section-head">
      <h2 class="h2">The Roll of the Sworn</h2>
      <p class="sub">Walkers appear here as their tribute lands.</p>
    </header>
    ${body}
  </section>`;
}

const CHECK = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12.5l5 5L20 6.5"/></svg>`;

function kit() {
  return `
  <section class="section" data-reveal>
    <div class="card kit">
      <span class="kicker">What you need</span>
      <h2 class="h2">The Sworn Kit</h2>
      <ul class="checks">
        <li class="check-row" style="--i:0">${CHECK}A step tracker</li>
        <li class="check-row" style="--i:1">${CHECK}Two functioning feet</li>
        <li class="check-row kit-stamp"><span class="stamp stamp-lg">NO EXCUSES</span></li>
      </ul>
    </div>
  </section>`;
}

function how() {
  const steps = [
    ["Walk", "Oct 4 – Nov 1. Every step counts."],
    ["Report", "Screenshot your week. Send it DIRECTLY TO DAMMY — NOT THE GROUP CHAT!"],
    ["Win", "Most total steps takes the pot. Crowned November 1."],
  ];
  return `
  <section class="wrap section" data-reveal>
    <header class="section-head"><h2 class="h2">How it works</h2></header>
    <ol class="how">${steps.map(([h, p], i) => `
      <li class="card how-card">
        <span class="how-n" aria-hidden="true">${i + 1}</span>
        <h3 class="h3">${h}</h3>
        <p>${p}</p>
      </li>`).join("")}
    </ol>
    <a class="textlink" href="#/rules">Read the full Decree →</a>
  </section>`;
}

function job() {
  const items = [
    ["🏆", "Who's in the lead"],
    ["🛋️", "Who has been permanently attached to the couch"],
    ["🏃", "Who's walking like they're being chased"],
    ["🧸", "Who is using this challenge to escape their children"],
    ["😲", "And who suddenly became an Olympic-level walker overnight!"],
  ];
  return `
  <section class="section" data-reveal>
    <div class="card job">
      <span class="kicker">DAMMY'S JOB:</span>
      <p class="job-lede">Our official Count Holder, Dammy Henry, will keep track of everyone's numbers and let us know:</p>
      <ul class="job-list">${items.map(([e, t]) => `<li><span aria-hidden="true">${e}</span>${t}</li>`).join("")}</ul>
    </div>
  </section>`;
}

const flourish = `<p class="wrap flourish">Fall into Healthy Habits</p>`;

// ── walking / counting / crowned sections ─────────────────
function ledgerPreview(ctx) {
  const E = ctx.copy.LEDGER_EMPTY;
  if (!ctx.weeks.length) {
    return `
    <section class="wrap section" data-reveal>
      <div class="card preview">
        <span class="kicker">The Ledger</span>
        <p class="h3">${rich(E.head)}</p>
        <p class="sub">${rich(E.sub)}</p>
      </div>
    </section>`;
  }
  const behind = ctx.week && ctx.week.n - 1 > ctx.weeks.length;
  const tag = ctx.phase === "counting" ? "unofficial" : behind ? ctx.copy.AS_COUNTED : `after week ${ctx.weeks.length}`;
  const rows = ctx.standings.slice(0, 3).map((r, i) => `
    <li class="preview-row" style="--c:var(--walker-${r.walker.color})">
      <span class="preview-rank" aria-label="Rank ${r.rank}">${r.rank}</span>
      ${crest(r.walker)}
      <span class="preview-name">${esc(r.walker.short)}</span>
      <b class="num preview-total" data-count="${r.total}">${n(r.total)}</b>
      ${delta(r)}
    </li>`).join("");
  return `
  <section class="wrap section" data-reveal>
    <div class="card preview">
      <header class="preview-head"><span class="kicker">The Ledger</span><span class="caption">${esc(tag)}</span></header>
      <ol class="preview-list">${rows}</ol>
      <a class="textlink" href="#/ledger">See the full Ledger →</a>
      <div class="preview-note">${note(pick(ctx.copy.MARGIN_NOTES, ctx.weeks.length - 1))}</div>
    </div>
  </section>`;
}

function report(ctx) {
  const wk = ctx.weeks.at(-1);
  if (!wk?.judgeNote) return "";
  return `
  <section class="wrap section" data-reveal>
    <div class="card report">
      ${seal("", { size: "seal-56" })}
      <div>
        <span class="kicker">The Judge's Report</span>
        <blockquote class="report-note">${rich(wk.judgeNote)}</blockquote>
        <p class="caption">— The <em>Fairly</em> Impartial Judge, Week ${wk.week}</p>
      </div>
    </div>
  </section>`;
}

function togetherTile(ctx) {
  if (!ctx.weeks.length) return "";
  const t = together(totals(ctx.weeks));
  const line = fill(pick(ctx.copy.TOGETHER_LINES, ctx.weeks.length + 2), {
    mi: n(t.miles), marathons: t.marathons.toFixed(1), n: n(Math.max(1, Math.round(t.miles / 25))),
  });
  return `
  <section class="wrap section" data-reveal>
    <div class="card together">
      <span class="kicker">Together, the walkers have walked</span>
      <p class="together-total"><b class="num" data-count="${t.steps}">${n(t.steps)}</b> steps</p>
      <ul class="together-chips">
        <li class="chip">≈ ${n(t.miles)} miles</li>
        <li class="chip">${t.marathons.toFixed(1)} marathons</li>
      </ul>
      <p class="sub">${rich(line)}</p>
    </div>
  </section>`;
}

// ── view contract ─────────────────────────────────────────
export function render(ctx) {
  if (ctx.phase === "muster") {
    return hero(ctx) + countdownCard(ctx) + tribute(ctx) + roll(ctx)
      + `<div class="wrap section duo">${job()}${kit()}</div>` + how() + flourish;
  }
  return hero(ctx) + countdownCard(ctx) + ledgerPreview(ctx) + report(ctx) + togetherTile(ctx) + how();
}

export function mount(root, ctx) {
  reveal(root);
  const bottle = root.querySelector(".bottle");
  const slot = root.querySelector(".bubble-slot");
  const lines = ctx.copy.BOTTLE;
  let i = Math.floor(Math.random() * lines.length), hide = 0;
  bottle?.addEventListener("click", () => {
    bottle.classList.add("tilt");
    setTimeout(() => bottle.classList.remove("tilt"), 300);
    slot.innerHTML = `<span class="bubble">${rich(lines[i++ % lines.length])}</span>`;
    clearTimeout(hide);
    hide = setTimeout(() => { slot.innerHTML = ""; }, 3000);
  });
}

export function tick(root, ctx) {
  const card = root.querySelector("#countdown");
  if (!card) return;
  const m = nextMilestone(ctx);
  if (!m.target || m.key !== card.dataset.key) return;
  const p = countdownParts(ctx.now, m.target);
  if (!tickCountdown(card, p)) card.querySelector(".countdown").outerHTML = countdownHTML(p);
  card.toggleAttribute("data-witching", witching(p));
  if (p.s === "00") card.querySelector(".cd-sr").textContent = srSentence(p, ctx.copy.COUNTDOWN_LABELS[m.key]);
}

