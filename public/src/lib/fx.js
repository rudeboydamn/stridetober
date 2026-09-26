// Visual effects and small shared UI builders. Spec: docs/PLAN.md §4.
// Every effect checks reduced() first and degrades to its final state.
import { n, esc, rich } from "./format.js";

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

// ── M1 leaves (+ M27: one of them is a spinning maple samara) ──
export function leaves(container, { eve = false } = {}) {
  if (!container) return;
  const rand = mulberry32(1004);
  const r = (a, b) => a + rand() * (b - a);
  const count = matchMedia("(min-width: 768px)").matches ? 10 : 6;
  const shapes = ["leaf-maple", "leaf-oak", "leaf-birch"];
  let html = "";
  for (let i = 0; i < count; i++) {
    const bat = eve && i < 2;
    const samara = !eve && i === count - 1;
    const dur = r(14, 22);
    const style = [
      `--x:${r(0, 96).toFixed(1)}%`, `--dur:${dur.toFixed(1)}s`, `--delay:${(-r(0, dur)).toFixed(1)}s`,
      `--sway:${r(3.2, 4.6).toFixed(2)}s`, `--flip:${samara ? ".55" : r(1.8, 2.6).toFixed(2)}s`, `--size:${Math.round(r(14, 28))}px`,
      `--tint:${bat ? "var(--ink-2)" : `var(--leaf-${1 + Math.floor(rand() * 4)})`}`,
    ].join(";");
    const shape = bat ? "bat" : samara ? "samara" : shapes[i % shapes.length];
    html += `<span class="leaf${bat ? " bat" : samara ? " samara" : ""}" style="${style}"><span class="leaf-sway">` +
      `<svg class="leaf-flip" viewBox="${bat ? "0 0 32 16" : "0 0 24 24"}"><use href="${SPRITE}#${shape}"/></svg></span></span>`;
  }
  container.innerHTML = html;
}

// ── M26 wind gusts: every 35–70s a few leaves blow across ──
export function blowGust(container) {
  if (!container || document.hidden || reduced()) return;
  const shapes = ["leaf-maple", "leaf-oak", "leaf-birch"];
  const r = (a, b) => a + Math.random() * (b - a);
  const count = matchMedia("(min-width: 768px)").matches ? 6 : 4;
  for (let i = 0; i < count; i++) {
    const el = document.createElement("span");
    el.className = "gust-leaf";
    el.style.cssText = `--y:${r(12, 72).toFixed(0)}vh;--size:${r(16, 28).toFixed(0)}px;--dur:${r(2.6, 3.6).toFixed(2)}s;` +
      `--delay:${(i * r(.12, .3)).toFixed(2)}s;--arc:${r(-10, 8).toFixed(0)}vh;--turns:${r(540, 960).toFixed(0)}deg;` +
      `--tint:var(--leaf-${1 + (i % 4)})`;
    el.innerHTML = `<svg viewBox="0 0 24 24"><use href="${SPRITE}#${shapes[i % 3]}"/></svg>`;
    el.addEventListener("animationend", () => el.remove(), { once: true });
    container.appendChild(el);
  }
  container.classList.remove("gusting");
  void container.offsetWidth;
  container.classList.add("gusting");
}

export function gusts(container, onGust = () => {}) {
  const next = ms => setTimeout(() => { blowGust(container); onGust(); next(35_000 + Math.random() * 35_000); }, ms);
  next(12_000 + Math.random() * 8_000);
}

// ── M2 leaf burst ──────────────────────────────────────────
export const LEAF_PATHS = [   // maple, oak, birch — the sprite's leaf outlines

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

export function burst({ x, y, count, from, power = 1 } = {}) {
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
    bits.push({ x: ox, y: oy, vx: rnd(-6, 6) * power, vy: rnd(-11, -6) * power, rot: rnd(0, 6.283), vr: rnd(-.12, .12),
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

// ── M28 a small puff of leaves from a pressed button ──────
export function puff(el) {
  if (reduced()) return;
  const r = el.getBoundingClientRect();
  burst({ x: r.left + r.width / 2, y: r.top + r.height / 2, count: 12, power: .45 });
}

// Share sheet where the phone has one; otherwise copy the link. Either way, say so.
export async function share(data, copiedMsg) {
  const fallback = () => toast(`Copy this link: <b>${esc(data.url)}</b>`);
  const copy = () => (navigator.clipboard ? navigator.clipboard.writeText(data.url).then(() => toast(esc(copiedMsg)), fallback) : fallback());
  if (!navigator.share) return copy();
  try { await navigator.share(data); } catch (e) { if (e.name !== "AbortError") copy(); }
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

// ── M13 Reading of the Ledger (FLIP) ───────────────────────
// Record each [data-id] child's top, run applyNewOrder() to re-append them in
// their new order, then animate each row from its old position.
export function flip(list, applyNewOrder) {
  if (!list) { applyNewOrder(); return; }
  if (reduced()) { applyNewOrder(); return; }
  const tops = new Map([...list.children].map(el => [el.dataset.id, el.getBoundingClientRect().top]));
  applyNewOrder();
  [...list.children].forEach((el, i) => {
    const old = tops.get(el.dataset.id);
    const dy = old == null ? 0 : old - el.getBoundingClientRect().top;
    if (!dy) return;
    el.style.transition = "none";
    el.style.transform = `translateY(${dy}px)`;
    void el.offsetWidth;
    el.style.transition = `transform 700ms var(--ease-settle) ${i * 40}ms`;
    el.style.transform = "";
    el.addEventListener("transitionend", () => { el.style.transition = ""; }, { once: true });
  });
}

// ── M21 rake the leaves + M29 jump in the pile ─────────────
export function rake(pile, line, milestones, jumps = []) {
  if (!pile || !line) return;
  const rand = mulberry32(31);
  const shapes = ["leaf-maple", "leaf-oak", "leaf-birch"];
  // A heap, not a row: leaves stack highest mid-pile (M34 puts it at the tree's foot).
  pile.innerHTML = Array.from({ length: 22 }, (_, i) => {
    const u = (i + rand()) / 22;
    return `<svg class="pile-leaf" viewBox="0 0 24 24" style="left:${(u * 90).toFixed(1)}%;` +
      `bottom:${Math.round(Math.sin(Math.PI * u) * 26 * (.45 + rand() * .55))}px;--r:${Math.round(rand() * 360)}deg;color:var(--leaf-${1 + (i % 4)})">` +
      `<use href="${SPRITE}#${shapes[i % 3]}"/></svg>`;
  }).join("");
  const leafEls = [...pile.children];
  let count = 0, idle = 0, frame = 0, last = null, quip = "";
  const update = () => {
    const hit = [...milestones].reverse().find(m => count >= m.at);
    const note = quip || (hit && hit.at > 1 ? hit.note : "");
    line.innerHTML = `Leaves raked: <b class="num">${n(count)}</b> · Steps credited: 0 · The Judge checked.` +
      (note ? ` <span class="rake-note">${rich(note)}</span>` : "");
  };
  const settle = () => leafEls.forEach(l => {
    l.classList.remove("kicked");
    ["--kx", "--ky", "--kr"].forEach(p => l.style.removeProperty(p));
  });
  const kick = (leaf, away, strength = 1) => {
    const k = (10 + Math.random() * 16) * strength;
    leaf.classList.add("kicked");
    leaf.style.setProperty("--kx", `${(away < 0 ? -k : k).toFixed(0)}px`);
    leaf.style.setProperty("--ky", `${(-(6 + Math.random() * 16) * strength).toFixed(0)}px`);
    leaf.style.setProperty("--kr", `${((Math.random() * 80 - 40) * strength).toFixed(0)}deg`);
  };
  const later = ms => { clearTimeout(idle); idle = setTimeout(settle, ms); };
  // One layout read per frame: measure every leaf first, then write.
  const apply = () => {
    frame = 0;
    const hits = leafEls.filter(l => !l.classList.contains("kicked"))
      .map(l => { const r = l.getBoundingClientRect(); return [l, r.left + r.width / 2 - last.clientX, r.top + r.height / 2 - last.clientY]; })
      .filter(([, dx, dy]) => Math.hypot(dx, dy) <= 48);
    hits.forEach(([leaf, dx]) => kick(leaf, dx));
    if (hits.length) { count += hits.length; quip = ""; update(); }
    later(1200);
  };
  pile.addEventListener("pointermove", e => {
    if (reduced()) return;
    last = e;
    frame ||= requestAnimationFrame(apply);
  });
  pile.addEventListener("click", e => {
    quip = jumps.length ? jumps[Math.floor(Math.random() * jumps.length)] : "";
    if (!reduced()) {
      const box = pile.getBoundingClientRect();
      leafEls.forEach(l => kick(l, Math.random() - .5, 2.2));
      burst({ x: e.clientX || box.left + box.width / 2, y: box.top + box.height / 2, count: 34, power: .75 });
      later(1400);
    } else {
      count++;
    }
    update();
  });
}

// ── M33 a squirrel crosses, once per session ───────────────
export function squirrel(lines) {
  if (reduced() || document.hidden) return;
  try {
    if (sessionStorage.getItem("stridetober:squirrel")) return;
    sessionStorage.setItem("stridetober:squirrel", "1");
  } catch { return; }
  const b = document.createElement("button");
  b.type = "button";
  b.className = "squirrel";
  b.setAttribute("aria-label", "A squirrel is crossing. Tap to fine it.");
  b.innerHTML = `<span class="sq-body" aria-hidden="true"><span class="sq-acorn">🌰</span>🐿️</span>`;
  b.addEventListener("animationend", e => { if (e.target === b) b.remove(); });
  b.addEventListener("click", () => {
    const r = b.getBoundingClientRect();
    burst({ x: r.left + r.width / 2, y: r.top, count: 14, power: .5 });
    toast(esc(lines[Math.floor(Math.random() * lines.length)]));
    b.classList.add("fled");
    setTimeout(() => b.remove(), 320);
  });
  document.body.appendChild(b);
}

// ── M36 the wildlife: the woods wander through, and can be poked ──
// Emoji, not silhouettes — each one gets a shadow on the ground, a gait of its
// own and a startle when tapped. One crossing per spawn, two abroad at most,
// nothing at all when motion is reduced.
export const WILD = [
  { id: "squirrel", glyph: "🐿️", wt: 15, size: [26, 34], dur: [22, 34], gait: "dart" },
  { id: "rabbit",   glyph: "🐇", wt: 12, size: [28, 36], dur: [20, 32], gait: "hop" },
  { id: "deer",     glyph: "🦌", wt: 12, size: [42, 56], dur: [34, 52], gait: "amble" },
  { id: "dog",      glyph: "🐕", wt: 10, size: [34, 44], dur: [22, 34], gait: "trot" },
  { id: "turkey",   glyph: "🦃", wt: 8,  size: [34, 44], dur: [30, 46], gait: "trot" },
  { id: "raccoon",  glyph: "🦝", wt: 8,  size: [32, 42], dur: [30, 44], gait: "amble", night: true },
  { id: "beaver",   glyph: "🦫", wt: 5,  size: [30, 40], dur: [34, 50], gait: "amble" },
  { id: "skunk",    glyph: "🦨", wt: 5,  size: [30, 38], dur: [32, 46], gait: "amble", night: true },
  { id: "boar",     glyph: "🐗", wt: 4,  size: [38, 48], dur: [30, 44], gait: "trot" },
  { id: "turtle",   glyph: "🐢", wt: 2,  size: [28, 36], dur: [90, 130], gait: "amble", flip: true },
  { id: "bird",     glyph: "🐦", wt: 15, size: [22, 30], dur: [16, 26], gait: "soar", sky: true },
  { id: "duck",     glyph: "🦆", wt: 6,  size: [26, 34], dur: [20, 30], gait: "soar", sky: true },
  { id: "owl",      glyph: "🦉", wt: 5,  size: [26, 34], dur: [20, 30], gait: "soar", sky: true, night: true },
  { id: "bat",      glyph: "🦇", wt: 9,  size: [22, 30], dur: [14, 22], gait: "soar", sky: true, eve: true },
];
// A tap on any living thing: a small burst, a startle, and the Judge weighs in.
export function spook(el, lines, id) {
  const box = el.getBoundingClientRect();
  burst({ x: box.left + box.width / 2, y: box.top + box.height / 2, count: 14, power: .5 });
  const pool = lines?.[id] || lines?.default;
  if (pool?.length) toast(rich(pool[Math.floor(Math.random() * pool.length)]));
  el.classList.add("spooked");
}

export function wildlife(layer, lines) {
  if (!layer) return;
  const html = document.documentElement;
  const r = (a, b) => a + Math.random() * (b - a);

  // Startled mid-crossing: freeze where it stands, then bolt off the way it was headed.
  const bolt = el => {
    const back = el.classList.contains("rev");
    const m = new DOMMatrix(getComputedStyle(el).transform);
    const from = `translate3d(${m.m41.toFixed(1)}px,${m.m42.toFixed(1)}px,0)`;
    el.style.animation = "none";
    el.style.transform = from;
    el.classList.replace("spooked", "bolting");
    const box = el.getBoundingClientRect();
    const dx = back ? -(box.right + 80) : innerWidth + 80 - box.left;
    el.animate([{ transform: from }, { transform: `translate3d(${(m.m41 + dx).toFixed(0)}px,${(m.m42 - 8).toFixed(0)}px,0)` }],
      { duration: Math.max(500, Math.abs(dx) / .9), easing: "cubic-bezier(.3,0,.6,1)", fill: "forwards" })
      .onfinish = () => el.remove();
  };

  const spawn = () => {
    if (layer.childElementCount >= 2 || document.hidden || reduced()) return;
    const eve = html.hasAttribute("data-eve");
    const night = eve || /dusk|night/.test(html.dataset.daypart || "");
    const cast = WILD.filter(k => (!k.eve || eve) && (!k.night || night));
    let roll = Math.random() * cast.reduce((sum, k) => sum + k.wt, 0);
    const k = cast.find(c => (roll -= c.wt) < 0) || cast[0];
    const el = Object.assign(document.createElement("span"), {
      className: `roamer gait-${k.gait}${k.sky ? " sky" : ""}${k.flip ? " flip" : ""}${Math.random() < .5 ? " rev" : ""}`,
    });
    el.style.cssText = `--dur:${r(...k.dur).toFixed(1)}s;--size:${Math.round(r(...k.size))}px;` +
      (k.sky ? `top:${r(11, 30).toFixed(0)}%` : `bottom:calc(var(--tab-h) + ${r(6, 54).toFixed(0)}px)`);
    el.innerHTML = `<span class="roamer-turn"><span class="roamer-gait">${k.glyph}</span></span>`;
    el.addEventListener("animationend", e => { if (e.target === el) el.remove(); });
    el.addEventListener("click", () => {
      if (el.classList.contains("spooked") || el.classList.contains("bolting")) return;
      spook(el, lines, k.id);
      setTimeout(() => bolt(el), 360);
    });
    layer.append(el);
  };

  const tick = () => { spawn(); setTimeout(tick, r(24_000, 75_000)); };
  setTimeout(tick, r(7_000, 16_000));
}
