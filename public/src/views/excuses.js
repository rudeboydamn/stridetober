// Court of Excuses — the cheek centerpiece. Spec: docs/PLAN.md §5.8.
import { esc, rich, n } from "../lib/format.js";
import { icon, seal, note, toast, reveal, reduced } from "../lib/fx.js";

const KEY = "stridetober:pleas";
const readCount = () => { try { return +localStorage.getItem(KEY) || 0; } catch { return 0; } };
const saveCount = v => { try { localStorage.setItem(KEY, String(v)); } catch { /* private mode */ } };

export function render() {
  const heard = readCount();
  return `
  <header class="wrap page-head" data-reveal>
    <span class="ribbon">All pleas are heard. Few are granted.</span>
    <h1 class="page-title">Court of Excuses</h1>
  </header>
  <section class="wrap section" data-reveal>
    <div class="card card-raised bench">
      <div class="bench-top">
        <span class="bench-gavel" id="gavel">${icon("gavel")}</span>
        <p class="h3">State your excuse. The Judge is <em>fairly</em> listening.</p>
      </div>
      <button class="btn btn-primary" type="button" id="plead">Plead your case</button>
      <div class="verdict" id="verdict" aria-live="polite"></div>
      <p class="caption pleas">Pleas heard: <b class="num" id="pleaCount">${n(heard)}</b></p>
      <div class="pleas-note" id="pleasNote">${heard >= 10 ? note("the Judge has heard everything. Everything.") : ""}</div>
    </div>
  </section>`;
}

export function mount(root, ctx) {
  reveal(root);
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
    if (heard === 10) { noteSlot.innerHTML = note("the Judge has heard everything. Everything."); reveal(noteSlot.parentElement.parentElement); }
  });
}
