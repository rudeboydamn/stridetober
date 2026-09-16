// Fall Finds — the field journal. Spec: docs/PLAN.md §5.9.
// Catalogue numbers are assigned by date (oldest = №01); the grid shows newest first.
import { esc, rich, fmtDay } from "../lib/format.js";
import { crest, tallySvg, seal, reveal } from "../lib/fx.js";

const numbered = finds => {
  const byDate = [...finds].sort((a, b) => a.date < b.date ? -1 : 1);
  return new Map(byDate.map((f, i) => [f.id, i + 1]));
};

const finderChip = (ctx, id) => {
  const w = ctx.walkers.find(x => x.id === id);
  if (!w) return "";
  return `<a class="chip finder" href="#/walker/${w.id}">${crest(w)}<span>${esc(w.short)}</span></a>`;
};

export function render(ctx) {
  const finds = [...ctx.finds].sort((a, b) => (a.date > b.date ? -1 : 1)); // newest first
  const nums = numbered(ctx.finds);

  return `
  <header class="wrap page-head" data-reveal>
    <span class="ribbon">The field journal</span>
    <h1 class="page-title">Fall Finds</h1>
    <p class="sub">Things spotted mid-walk. Evidence the miles happened.</p>
  </header>
  ${!finds.length ? `
  <section class="wrap section" data-reveal>
    <div class="card empty-state">
      ${seal("", { size: "seal-96", cls: "hollow" })}
      <p class="h3">The trail has yielded nothing yet. Suspicious.</p>
      <p class="sub">Find something worth photographing on a walk, send it to Dammy, and it joins the journal.</p>
    </div>
  </section>` : `
  <section class="wrap section" data-reveal>
    <div class="finds-grid">${finds.map(f => `
      <figure class="card find">
        ${f.img
          ? `<img src="${esc(f.img)}" width="${f.w}" height="${f.h}" loading="lazy" alt="${esc(f.caption)}">`
          : `<div class="find-developing" role="img" aria-label="Photo developing">${tallySvg(false)}<span>developing the film…</span></div>`}
        <figcaption>
          <span class="caption">№ ${nums.get(f.id)} · ${fmtDay(f.date)}</span>
          <p class="find-cap">${rich(f.caption)}</p>
          <p class="find-finders">${(f.who || []).map(id => finderChip(ctx, id)).join("")}</p>
        </figcaption>
      </figure>`).join("")}
    </div>
  </section>`}`;
}

export function mount(root) {
  reveal(root);
}
