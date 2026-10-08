// The Courtroom — the Court of Excuses and Settle It, one page, two dockets.
// #/excuses (and #/courtroom) is the Pleas docket; #/compare[/a[/b]] is the Disputes docket.
// The docket switch is two links, so every docket has its own URL and old links keep working.
import { reveal } from "../lib/fx.js";
import * as excuses from "./excuses.js";
import * as compare from "./compare.js";

const DOCKETS = [
  { key: "pleas",    href: "#/excuses", label: "Plead an excuse",  icon: "🙏" },
  { key: "disputes", href: "#/compare", label: "Settle a dispute", icon: "⚖️" },
];

export function render(ctx, params = {}) {
  const docket = params.docket === "disputes" ? "disputes" : "pleas";
  return `
  <header class="wrap page-head" data-reveal>
    <span class="ribbon">All pleas heard. All disputes settled.</span>
    <h1 class="page-title">The Courtroom</h1>
    <nav class="docket" aria-label="Docket">${DOCKETS.map(d => `
      <a class="docket-tab" href="${d.href}"${d.key === docket ? ' aria-current="page"' : ""}><span aria-hidden="true">${d.icon}</span>${d.label}</a>`).join("")}
    </nav>
  </header>
  ${docket === "pleas" ? excuses.render(ctx) : compare.render(ctx, params)}`;
}

export function mount(root, ctx, params = {}) {
  reveal(root);
  (params.docket === "disputes" ? compare : excuses).mount(root, ctx, params);
}
