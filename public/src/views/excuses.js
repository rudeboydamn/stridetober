// Court of Excuses — the cheek centerpiece. Spec: docs/PLAN.md §5.8.
import { esc, rich, n } from "../lib/format.js";
import { icon, seal, note, toast, reduced, crest } from "../lib/fx.js";

const KEY = "stridetober:pleas";
const readCount = () => { try { return +localStorage.getItem(KEY) || 0; } catch { return 0; } };
const saveCount = v => { try { localStorage.setItem(KEY, String(v)); } catch { /* private mode */ } };

const ME = "stridetober:me";
const me = () => { try { return localStorage.getItem(ME) || ""; } catch { return ""; } };

// Typed pleas, kept by /api/excuses (Neon). Everyone sees the docket.
function filing(ctx) {
  const opts = ctx.walkers.filter(w => w.paid)
    .map(w => `<option value="${w.id}"${w.id === me() ? " selected" : ""}>${w.crest} ${esc(w.short)}</option>`).join("");
  return `
  <section class="wrap section" data-reveal>
    <form class="card filing" id="filing">
      <span class="kicker">File your own excuse</span>
      <label class="field"><span>Who is pleading</span>
        <select name="walker" required><option value="">Choose yourself…</option>${opts}</select></label>
      <label class="field"><span>The excuse</span>
        <textarea name="body" maxlength="280" rows="3" required placeholder="It was raining. Inside."></textarea></label>
      <button class="btn btn-primary" type="submit">Enter it into the record</button>
    </form>
  </section>
  <section class="wrap section" data-reveal>
    <header class="section-head"><h2 class="h2">The Record</h2><p class="sub">Every excuse, on file forever.</p></header>
    <ol class="record" id="record"><li class="caption">Fetching the record…</li></ol>
  </section>`;
}

const entry = (ctx, x) => {
  const w = ctx.walkers.find(v => v.id === x.walker);
  return w ? `<li class="card record-row">${crest(w)}<div><p class="record-plea">“${esc(x.body)}”</p>
    <p class="caption">${esc(w.short)} · ${new Date(x.at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</p></div></li>` : "";
};

function mountFiling(root, ctx) {
  const list = root.querySelector("#record"), form = root.querySelector("#filing");
  if (!list) return;
  const empty = `<li class="caption">No excuses on file. Suspicious.</li>`;
  fetch("/api/excuses").then(r => r.ok ? r.json() : Promise.reject())
    .then(rows => { list.innerHTML = rows.map(x => entry(ctx, x)).join("") || empty; })
    .catch(() => { list.innerHTML = `<li class="caption">The Court is in recess. Try again later.</li>`; });
  form.addEventListener("submit", async e => {
    e.preventDefault();
    const btn = form.querySelector("button"), data = Object.fromEntries(new FormData(form));
    btn.disabled = true;
    try {
      const r = await fetch("/api/excuses", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
      if (!r.ok) throw 0;
      const row = await r.json();
      try { localStorage.setItem(ME, data.walker); } catch { /* private mode */ }
      if (list.querySelector(".record-row")) list.insertAdjacentHTML("afterbegin", entry(ctx, row));
      else list.innerHTML = entry(ctx, row);
      form.body.value = "";
      toast("Entered into the record.");
    } catch { toast("The Court is in recess. Try again later."); }
    btn.disabled = false;
  });
}

export function render(ctx) {
  const heard = readCount();
  return `
  <section class="wrap section" data-reveal>
    <div class="card card-raised bench">
      <div class="bench-top">
        <span class="bench-gavel" id="gavel">${icon("gavel")}</span>
        <p class="h3">Got an excuse? Let's hear it.</p>
      </div>
      <button class="btn btn-primary" type="button" id="plead">Plead your case</button>
      <div class="verdict" id="verdict" aria-live="polite"></div>
      <p class="caption pleas">Pleas heard: <b class="num" id="pleaCount">${n(heard)}</b></p>
      <div class="pleas-note" id="pleasNote">${heard >= 10 ? note("the Court has heard everything. Everything.") : ""}</div>
    </div>
  </section>${filing(ctx)}`;
}

export function mount(root, ctx) {
  mountFiling(root, ctx);
  const pool = ctx.copy.EXCUSES;
  const verdict = root.querySelector("#verdict"), gavel = root.querySelector("#gavel");
  const countEl = root.querySelector("#pleaCount"), noteSlot = root.querySelector("#pleasNote");
  let last = -1, timers = [];

  root.querySelector("#plead").addEventListener("click", () => {
    timers.forEach(clearTimeout);
    let i;
    do { i = Math.floor(Math.random() * pool.length); } while (pool.length > 1 && i === last);
    last = i;
    const { plea, ruling, pardon } = pool[i];
    const quick = reduced();

    verdict.innerHTML = `<p class="plea">“${esc(plea)}”</p>`;
    const strike = () => {
      gavel.classList.remove("gavel-strike");
      void gavel.offsetWidth;
      gavel.classList.add("gavel-strike");
    };
    const rule = () => {
      verdict.insertAdjacentHTML("beforeend", `
        <div class="ruling-row">
          ${pardon ? seal("Pardoned", { size: "seal-96", cls: "stamping", label: "Pardoned" })
                   : `<span class="stamp stamp-lg slams">Overruled</span>`}
          <p class="ruling-text">${rich(ruling)}</p>
        </div>`);
      if (pardon) toast(esc(ctx.copy.TOASTS.pardoned));
    };
    if (quick) { strike(); rule(); }
    else timers = [setTimeout(strike, 450), setTimeout(rule, 700)];

    const heard = readCount() + 1;
    saveCount(heard);
    countEl.textContent = n(heard);
    if (heard === 10) { noteSlot.innerHTML = note("the Court has heard everything. Everything."); reveal(noteSlot.parentElement.parentElement); }
  });
}
