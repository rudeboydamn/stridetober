// Visual effects and small shared UI builders. Spec: docs/PLAN.md §4.
// Every effect checks reduced() first and degrades to its final state.
import { n, rich } from "./format.js";

export const SPRITE = "/assets/sprite.svg";

export const reduced = () =>
  matchMedia("(prefers-reduced-motion: reduce)").matches || document.documentElement.dataset.motion === "reduce";

export function mulberry32(seed) {
  let a = seed;
  return () => {
    a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ── markup helpers ─────────────────────────────────────────
export const icon = (id, cls = "icon", viewBox = "0 0 24 24") =>
  `<svg class="${cls}" viewBox="${viewBox}" aria-hidden="true"><use href="${SPRITE}#${id}"/></svg>`;

export const seal = (text, { size = "", cls = "", i = 0, label = "" } = {}) =>
  `<span class="seal ${size} ${cls}" style="--i:${i}"${label ? ` role="img" aria-label="${label}"` : ` aria-hidden="true"`}>` +
  `<svg viewBox="-2 -2 104 104"><use href="${SPRITE}#seal"/></svg><span class="seal-text">${text}</span></span>`;

export const crest = (walker, size = "") =>
  `<span class="crest ${size}" style="--c:var(--walker-${walker.color})" aria-hidden="true">${walker.crest}</span>`;

// Rank movement since the previous posted week — always a glyph, never color alone.
export const delta = r =>
  !r.delta ? `<span class="delta flat" aria-label="no change">—</span>`
  : r.delta > 0 ? `<span class="delta up" aria-label="up ${r.delta}">▲${r.delta}</span>`
  : `<span class="delta down" aria-label="down ${-r.delta}">▼${-r.delta}</span>`;

export const tallySvg = (counting = true) =>
  `<svg class="tally${counting ? " counting" : ""}" viewBox="0 0 32 24" aria-hidden="true">` +
  `<path d="M6 4v16"/><path d="M11 4v16"/><path d="M16 4v16"/><path d="M21 4v16"/><path d="M3 17L25 7"/></svg>`;

// A hand-lettered margin note with a drawn arrow (M11).
export const note = (text, cls = "") =>
  `<span class="note ${cls}">${rich(text)}<svg viewBox="0 0 46 30" aria-hidden="true"><path d="M3 4c10 1 22 6 30 18m0 0l-8-2m8 2l1-8"/></svg></span>`;

// ── M1 leaves ──────────────────────────────────────────────
export function leaves(container, { eve = false } = {}) {
  if (!container) return;
  const rand = mulberry32(1004);
  const r = (a, b) => a + rand() * (b - a);
  const count = matchMedia("(min-width: 768px)").matches ? 10 : 6;
  const shapes = ["leaf-maple", "leaf-oak", "leaf-birch"];
  let html = "";
  for (let i = 0; i < count; i++) {
    const bat = eve && i < 2;
    const dur = r(14, 22);
    const style = [
      `--x:${r(0, 96).toFixed(1)}%`, `--dur:${dur.toFixed(1)}s`, `--delay:${(-r(0, dur)).toFixed(1)}s`,
      `--sway:${r(3.2, 4.6).toFixed(2)}s`, `--flip:${r(1.8, 2.6).toFixed(2)}s`, `--size:${Math.round(r(14, 28))}px`,
      `--tint:${bat ? "var(--ink-2)" : `var(--leaf-${1 + Math.floor(rand() * 4)})`}`,
    ].join(";");
    const shape = bat ? "bat" : shapes[i % shapes.length];
    html += `<span class="leaf${bat ? " bat" : ""}" style="${style}"><span class="leaf-sway">` +
      `<svg class="leaf-flip" viewBox="${bat ? "0 0 32 16" : "0 0 24 24"}"><use href="${SPRITE}#${shape}"/></svg></span></span>`;
  }
  container.innerHTML = html;
}

// ── M2 leaf burst ──────────────────────────────────────────
const LEAF_PATHS = [
  "M12 1.2l1.7 3.6 2.4-1.2-.5 4.9 3.4-2.6.8 2.2 3-.5-1.5 3.5 1.5 1.2-4.9 4 .8 2.2-5-.9-.8 4.4H11l-.8-4.4-5 .9.8-2.2-4.9-4 1.5-1.2L1.1 8.1l3 .5.8-2.2 3.4 2.6-.5-4.9 2.4 1.2z",
  "M12 1.5c1.7 1 1.2 2.7 2.5 3.3 1.3.6 2.7-.4 3.2 1 .5 1.3-1.1 2.1-.4 3.2.6 1 2.3.9 2.3 2.3s-1.9 1.4-2 2.7c-.1 1.2 1.4 2 .7 3.2-.7 1.1-2.3.3-3.2 1.1-.8.7-.4 2.2-1.6 2.8V23h-3v-1.9c-1.2-.6-.8-2.1-1.6-2.8-.9-.8-2.5 0-3.2-1.1-.7-1.2.8-2 .7-3.2-.1-1.3-2-1.3-2-2.7s1.7-1.3 2.3-2.3c.7-1.1-.9-1.9-.4-3.2.5-1.4 1.9-.4 3.2-1C10.8 4.2 10.3 2.5 12 1.5z",
  "M12 1.5C6.3 6.2 4.8 11.4 6.3 16c1 3.1 3.4 5 5.7 6.5 2.3-1.5 4.7-3.4 5.7-6.5C19.2 11.4 17.7 6.2 12 1.5z",
];
let bits = [], raf = 0, sprites = null;

function makeSprites() {
  const css = getComputedStyle(document.documentElement);
  const tints = [1, 2, 3, 4].map(k => css.getPropertyValue(`--leaf-${k}`).trim() || "#E0661B");
  return LEAF_PATHS.flatMap(d => tints.map(tint => {
    const c = document.createElement("canvas");
    c.width = c.height = 32;
    const g = c.getContext("2d");
    g.scale(32 / 24, 32 / 24);
    g.fillStyle = tint;
    g.fill(new Path2D(d));
    return c;
  }));
}

export function burst({ x, y, count, from } = {}) {
  if (reduced()) {
    if (from) { from.classList.remove("pulse"); void from.offsetWidth; from.classList.add("pulse"); }
    return;
  }
  const cv = document.getElementById("burst");
  if (!cv) return;
  const de = document.documentElement;
  const w = de.clientWidth, h = de.clientHeight;         // clientWidth, never innerWidth (scrollbar)
  const dpr = Math.min(2, devicePixelRatio || 1);
  const ctx = cv.getContext("2d");
  if (!raf) {
    cv.width = w * dpr;
    cv.height = h * dpr;
  }
  sprites ||= makeSprites();
  const rnd = (a, b) => a + Math.random() * (b - a);
  const total = count ?? (w >= 768 ? 110 : 60);
  const ox = x ?? w / 2, oy = y ?? h * .25;
  for (let i = 0; i < total; i++) {
    bits.push({ x: ox, y: oy, vx: rnd(-6, 6), vy: rnd(-11, -6), rot: rnd(0, 6.283), vr: rnd(-.12, .12),
                phase: rnd(0, 6.283), s: rnd(.6, 1.1), img: sprites[Math.floor(Math.random() * sprites.length)] });
  }
  if (raf) return;
  let t = 0;
  const step = () => {
    t++;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, cv.width, cv.height);
    bits = bits.filter(b => b.y < h + 40);
    for (const b of bits) {
      b.vx *= .985;
      b.vy = b.vy * .985 + .18;
      b.x += b.vx + Math.sin(t * .05 + b.phase) * .6;
      b.y += b.vy;
      b.rot += b.vr;
      const c = Math.cos(b.rot) * b.s * dpr, s = Math.sin(b.rot) * b.s * dpr;
      ctx.setTransform(c, s, -s, c, b.x * dpr, b.y * dpr);
      ctx.drawImage(b.img, -16, -16);
    }
    if (bits.length) { raf = requestAnimationFrame(step); return; }
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, cv.width, cv.height);
    raf = 0;
  };
  raf = requestAnimationFrame(step);
}

// ── M5 count-up ────────────────────────────────────────────
export function countUp(el, to, { from = 0, dur = 900 } = {}) {
  el.setAttribute("aria-label", n(to));
  if (reduced() || to === from) { el.textContent = n(to); return; }
  el.style.minWidth = n(to).length + "ch";
  const t0 = performance.now();
  const step = now => {
    const t = Math.min(1, (now - t0) / dur);
    el.textContent = n(from + (to - from) * (1 - (1 - t) ** 3));
    if (t < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

// ── M4 reveal (also starts count-ups and note arrows) ──────
let io = null;
export function reveal(root) {
  root.querySelectorAll(".note svg path").forEach(p => {
    try { p.style.setProperty("--len", Math.ceil(p.getTotalLength())); } catch { /* not rendered */ }
  });
  const show = el => {
    el.classList.add("is-in");
    el.querySelectorAll("[data-count]").forEach(c => countUp(c, +c.dataset.count));
  };
  const els = root.querySelectorAll("[data-reveal]");
  io?.disconnect();
  if (reduced() || !("IntersectionObserver" in window)) { els.forEach(show); return; }
  io = new IntersectionObserver(entries => {
    for (const e of entries) if (e.isIntersecting) { show(e.target); io.unobserve(e.target); }
  }, { threshold: .15, rootMargin: "0px 0px -10% 0px" });
  els.forEach(el => io.observe(el));
}

// ── M17 toast (+ a persistent live region for screen readers) ──
let toastTimer = 0;
export function toast(html) {
  let live = document.getElementById("live");
  if (!live) {
    live = Object.assign(document.createElement("p"), { id: "live", className: "sr-only" });
    live.setAttribute("aria-live", "polite");
    document.body.appendChild(live);
  }
  document.querySelector(".toast")?.remove();
  const t = document.createElement("div");
  t.className = "toast";
  t.innerHTML = `${seal("", { size: "seal-36" })}<p>${html}</p>`;
  document.body.appendChild(t);
  live.textContent = t.querySelector("p").textContent;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    t.classList.add("is-out");
    setTimeout(() => t.remove(), 220);
  }, 6000);
}

// ── M6/M7 countdown ────────────────────────────────────────
export function countdownHTML(parts) {
  const cell = (v, label) =>
    `<div class="cd-cell"><div class="cd-digits">${[...v].map(ch => `<span class="digit"><span>${ch}</span></span>`).join("")}</div>` +
    `<span class="cd-label">${label}</span></div>`;
  const colon = `<span class="cd-colon">:</span>`;
  return `<div class="countdown${urgent(parts) ? " urgent" : ""}" aria-hidden="true">` +
    `${cell(parts.d, "Days")}${colon}${cell(parts.h, "Hrs")}${colon}${cell(parts.m, "Min")}${colon}${cell(parts.s, "Sec")}</div>`;
}

const urgent = parts => parts.totalMs > 0 && parts.totalMs < 48 * 3_600_000;

// Swap only the digits that changed. Returns false when the layout no longer
// fits (e.g. a 3-digit day count) so the caller can re-render.
export function tickCountdown(root, parts) {
  const box = root.querySelector(".countdown");
  const values = parts.d + parts.h + parts.m + parts.s;
  const digits = box ? box.querySelectorAll(".digit") : [];
  if (digits.length !== values.length) return false;
  digits.forEach((d, i) => {
    d.querySelectorAll(".d-out").forEach(x => x.remove());
    const cur = d.lastElementChild;
    if (cur.textContent === values[i]) return;
    if (reduced()) { cur.textContent = values[i]; return; }
    cur.className = "d-out";
    cur.addEventListener("animationend", () => cur.remove(), { once: true });
    d.appendChild(Object.assign(document.createElement("span"), { className: "d-in", textContent: values[i] }));
  });
  box.classList.toggle("urgent", urgent(parts));
  return true;
}

// ── M21 rake the leaves ────────────────────────────────────
export function rake(pile, line, milestones) {
  if (!pile || !line) return;
  const rand = mulberry32(31);
  const shapes = ["leaf-maple", "leaf-oak", "leaf-birch"];
  pile.innerHTML = Array.from({ length: 14 }, (_, i) =>
    `<svg class="pile-leaf" viewBox="0 0 24 24" style="left:${(2 + i * 6.8 + rand() * 2).toFixed(1)}%;` +
    `bottom:${Math.round(rand() * 16)}px;--r:${Math.round(rand() * 360)}deg;color:var(--leaf-${1 + (i % 4)})">` +
    `<use href="${SPRITE}#${shapes[i % 3]}"/></svg>`).join("");
  const leafEls = [...pile.children];
  let count = 0, idle = 0;
  const update = () => {
    const hit = [...milestones].reverse().find(m => count >= m.at);
    line.innerHTML = `Leaves raked: <b class="num">${n(count)}</b> · Steps credited: 0 · The Judge checked.` +
      (hit && hit.at > 1 ? ` <span class="rake-note">${rich(hit.note)}</span>` : "");
  };
  const settle = () => leafEls.forEach(l => {
    l.classList.remove("kicked");
    ["--kx", "--ky", "--kr"].forEach(p => l.style.removeProperty(p));
  });
  pile.addEventListener("pointermove", e => {
    if (reduced()) return;
    let kicked = 0;
    for (const leaf of leafEls) {
      if (leaf.classList.contains("kicked")) continue;
      const r = leaf.getBoundingClientRect();
      const dx = r.left + r.width / 2 - e.clientX, dy = r.top + r.height / 2 - e.clientY;
      if (Math.hypot(dx, dy) > 48) continue;
      const k = 10 + Math.random() * 16;
      leaf.classList.add("kicked");
      leaf.style.setProperty("--kx", `${(dx < 0 ? -k : k).toFixed(0)}px`);
      leaf.style.setProperty("--ky", `${(-6 - Math.random() * 16).toFixed(0)}px`);
      leaf.style.setProperty("--kr", `${(Math.random() * 80 - 40).toFixed(0)}deg`);
      kicked++;
    }
    if (kicked) { count += kicked; update(); }
    clearTimeout(idle);
    idle = setTimeout(settle, 1200);
  });
  pile.addEventListener("click", () => { if (reduced()) { count++; update(); } });
}
