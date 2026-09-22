// M34 the tree + M35 its residents. Spec: docs/PLAN.md §4.4.
// A tree as tall as the page stands behind everything: its crown at the top, its trunk
// down the page, its roots under the ground line, the footer's leaf pile at its base.
// Every visit the leaves start green, turn, then fall the whole way to the ground, and
// the residents wander off now and then. plan() is pure geometry (tests/tree.test.js);
// tree() owns the DOM.
import { SPRITE, LEAF_PATHS, mulberry32, reduced } from "./fx.js";

const SHAPES = ["leaf-maple", "leaf-oak", "leaf-birch"];
const TURNS = ["gold", "gold", "orange", "orange", "red", "red", "rust"];
// The crown: overlapping circles as [dx, dy, radius] in units of R from its center.
const LOBES = [[0, 0, .6], [-.52, .14, .44], [.5, .12, .42], [-.24, -.4, .44], [.28, -.36, .42], [-.72, -.12, .3], [.04, .34, .4]];

const curve = ([x0, y0], [x1, y1], [x2, y2], n = 10) =>
  Array.from({ length: n + 1 }, (_, i) => {
    const t = i / n, u = 1 - t;
    return [u * u * x0 + 2 * u * t * x1 + t * t * x2, u * u * y0 + 2 * u * t * y1 + t * t * y2];
  });

// A centerline → a closed outline whose width tapers from w0 to w1.
export function taper(pts, w0, w1) {
  const a = [], b = [];
  pts.forEach(([x, y], i) => {
    const [px, py] = pts[Math.max(0, i - 1)], [qx, qy] = pts[Math.min(pts.length - 1, i + 1)];
    const k = (w0 + (w1 - w0) * i / (pts.length - 1)) / 2 / (Math.hypot(qx - px, qy - py) || 1);
    a.push(`${(x + (py - qy) * k).toFixed(1)} ${(y + (qx - px) * k).toFixed(1)}`);
    b.push(`${(x - (py - qy) * k).toFixed(1)} ${(y - (qx - px) * k).toFixed(1)}`);
  });
  return `M${a.join("L")}L${b.reverse().join("L")}Z`;
}

// Page pixels throughout. W×H: the whole document. ground: the leaf pile's bottom edge.
// gutter: the space right of the content column. top: the header's height.
// pile: the pile's left/right edges. cs: a resident's size.
export function plan({ W, H, ground, gutter, top, pile, cs, eve = false }) {
  const phone = W < 768;
  const R = phone ? Math.min(150, W * .4) : W >= 1600 ? 230 : 190;
  const tx = Math.round(W - Math.max(16, gutter / 2));
  const cx = tx - R * (phone ? .45 : .35);
  const cy = phone ? top + 24 + R * .84 : top + R * .32;
  const lobes = LOBES.map(([dx, dy, k]) => [cx + dx * R, cy + dy * R, k * R]);
  const bottom = Math.max(...lobes.map(([, y, r]) => y + r));

  // The crown is seeded by width alone: a longer page grows a longer trunk, not a new crown.
  let rand = mulberry32(1031 + W);
  const r = (a, b) => a + rand() * (b - a);
  const inside = (x, y) => lobes.some(([lx, ly, lr]) => (x - lx) ** 2 + (y - ly) ** 2 <= lr * lr);
  const leaves = [], want = phone ? 150 : 240, [s0, s1] = phone ? [17, 26] : [20, 32];
  for (let n = 0; leaves.length < want && n < want * 30; n++) {
    const x = r(cx - R, cx + R), y = r(cy - R, cy + R);
    if (!inside(x, y)) continue;
    const rim = Math.hypot(x - cx, y - cy) / R;
    leaves.push({
      x, y, s: r(s0, s1), rot: r(0, 360), shape: Math.floor(rand() * 3),
      from: rand() < .6 ? "green" : "sage", to: TURNS[Math.floor(rand() * TURNS.length)],
      d: Math.max(.8, 1.4 + (1 - rim) * 3.2 + (y - cy) / R * 1.4 + r(0, 2.4)), t: r(1.6, 2.6),   // rim and top turn first
    });
  }
  // One leaf, the highest one below the header, never turns and never falls. The Judge respects it.
  leaves.filter(l => l.y > top + 12).reduce((a, b) => (b.y < a.y ? b : a)).holdout = true;

  rand = mulberry32(2026 + W);
  const [wT, wB, A] = phone ? [16, 30, 4] : [24, 48, 8];
  const y0 = cy + R * .1, span = Math.max(1, ground - y0);
  const along = y => Math.min(1, Math.max(0, (y - y0) / span));
  const trunkX = y => tx + A * Math.sin((y - y0) / 900 * 2 * Math.PI) * Math.sin(Math.PI * along(y));
  const width = y => wT + (wB - wT) * along(y);
  const spine = [];
  for (let y = y0; y < ground; y += 24) spine.push([trunkX(y), y]);
  spine.push([tx, ground]);

  const f = wB * .8;                                         // the base flares into the ground
  const wood = [taper(spine, wT, wB),
    `M${tx - wB / 2} ${ground - 48}C${tx - wB / 2} ${ground - 14} ${tx - f} ${ground - 5} ${tx - f - 12} ${ground}` +
    `H${tx + f + 12}C${tx + f} ${ground - 5} ${tx + wB / 2} ${ground - 14} ${tx + wB / 2} ${ground - 48}Z`];
  const fork = [trunkX(cy + R * .55), cy + R * .55];          // limbs fork low in the crown, out to its lobes
  for (const i of [1, 2, 3, 4, 5]) {
    const [lx, ly] = lobes[i];
    wood.push(taper(curve(fork, [(fork[0] + lx) / 2 + r(-12, 12), (fork[1] + ly) / 2 + R * .1], [lx, ly]), wT * .75, 2));
  }
  const grain = [-.24, .2].map(k => spine.map(([x, y], i) => `${i ? "L" : "M"}${(x + k * width(y)).toFixed(1)} ${y.toFixed(1)}`).join("")).join("");

  const yh = bottom + (phone ? 34 : 44);                     // the owl's hollow, just under the crown
  const holes = [[trunkX(yh), yh, width(yh) * .3, width(yh) * .46]];
  const knots = [];
  for (let y = yh + 300; y < ground - 220; y += r(420, 760)) knots.push([trunkX(y) + r(-3, 3), y, r(2.5, 4), r(5, 8)]);
  const perches = [];                                        // bare stubs, only where the right gutter has room
  for (let y = yh + 520; y < ground - 380; y += r(760, 1100)) {
    const x = trunkX(y) + width(y) * .4, reach = Math.min(42, W - x - 12);
    if (reach < 30) continue;
    wood.push(taper(curve([x, y], [x + reach / 2, y - 6], [x + reach, y - 28]), 8, 2.5));
    perches.push([x + reach - 2, y - 28]);
  }

  const deep = Math.max(30, H - ground - 6), reach = phone ? 150 : 230;
  for (const [dir, spread, depth, w] of [[-1, .95, .5, 9], [-1, .55, .95, 11], [-.2, .15, 1, 12], [1, .45, .85, 11], [1, .9, .55, 9]]) {
    const root = curve([tx + dir * 8, ground - 4], [tx + dir * spread * reach * .35, ground + depth * deep * .2],
      [tx + dir * spread * reach, ground + depth * deep], 12);
    const [mx, my] = root[6];                                // one rootlet off each root
    wood.push(taper(root, w, 1.2), taper(curve([mx, my], [mx + dir * 14, my + 18], [mx + dir * r(20, 40), my + r(26, 44)], 6), 4, 1));
  }
  const burrow = [tx - 40, ground + Math.min(44, deep * .45)];
  holes.push([...burrow, 10, 6.5]);

  // Residents, as waypoints {x, y, r: rotation, f: 1 facing left (emoji default) or -1}.
  // Each trip starts at home; the way back is the same path, facing the other way.
  const h = cs / 2, at = (x, y, rot = 0, face = 1) => ({ x: Math.round(x), y: Math.round(y), r: rot, f: face });
  const fly = ([x, y]) => [at(x, y), at(x - 26, y - 22), at(-cs * 2, y - 200)];
  const nest = phone ? [lobes[3][0], lobes[3][1] - lobes[3][2] + 2] : [lobes[5][0] - lobes[5][2] + 6, lobes[5][1]];
  const trips = { bird: fly([nest[0], nest[1] - h]), owl: fly([trunkX(yh), yh]) };
  if (eve) trips.bird[0].r = 180;                           // on the Eve a bat hangs there instead
  if (perches[0]) trips.bird2 = fly([perches[0][0], perches[0][1] - h]);
  const ys = yh + cs * 2.6, down = [];
  for (let y = ys; y < ground - cs * 2; y += 80) down.push(at(trunkX(y), y, -90));
  trips.squirrel = [...down, at(tx, ground - cs, -90), at(tx - cs, ground - h), at(Math.max(pile.left + cs, pile.right - cs * 1.5), ground - h)];
  const yc = ground - cs * 5;
  trips.caterpillar = [at(trunkX(yc), yc, 90), at(trunkX(yc - 70), yc - 70, 90)];
  trips.hedgehog = [at(pile.left + (pile.right - pile.left) * .32, ground - h * .8), at(-cs * 2, ground - h * .8)];
  trips.mouse = [at(burrow[0], burrow[1] - 2, 90), at(burrow[0], ground - h, 90), at(burrow[0] - 4, ground - h),
    at(Math.max(cs, pile.left - cs * 2), ground - h)];

  return { W, H, tx, y0, ground, leaves, wood, grain, holes, knots, trips, pileEdge: Math.round(tx - f - 14) };
}

const pose = p => `rotate(${p.r}deg) scaleX(${p.f})`;
const pick = list => list[Math.floor(Math.random() * list.length)];
const rr = (a, b) => a + Math.random() * (b - a);

export function tree(layer, pile, head) {
  if (!layer || !pile) return { gust() {} };
  const html = document.documentElement;
  const born = performance.now(), since = () => (performance.now() - born) / 1000;
  const life = Object.assign(document.createElement("div"), { className: "tree-life" });
  layer.append(life);
  const critters = new Map();
  let g = null, uses = [], fallen = new Set(), inAir = 0, cs = 20, lastW = 0, lastH = 0;

  const measure = () => {
    const box = layer.getBoundingClientRect(), p = pile.getBoundingClientRect();
    const W = layer.clientWidth;
    cs = W < 768 ? 20 : 26;
    return { W, H: layer.clientHeight, ground: Math.round(p.bottom - box.top), top: head?.offsetHeight || 64, cs,
      eve: html.hasAttribute("data-eve"),
      gutter: Math.round(W - (pile.parentElement.getBoundingClientRect().right - box.left)),
      pile: { left: p.left - box.left, right: p.right - box.left } };
  };

  function draw() {
    let m = measure();
    if (m.W !== lastW) fallen = new Set();                   // a new width grows a new crown
    g = plan(m);
    const mr = `${Math.round(m.W - m.gutter - g.pileEdge)}px`;   // heap the pile against the trunk
    if (pile.style.marginRight !== mr) { pile.style.marginRight = mr; m = measure(); g = plan(m); }
    [lastW, lastH] = [m.W, m.H];
    const f1 = v => v.toFixed(1), age = since();
    const ellipses = (list, cls) => list.map(([x, y, a, b]) => `<ellipse class="${cls}" cx="${f1(x)}" cy="${f1(y)}" rx="${f1(a)}" ry="${f1(b)}"/>`).join("");
    layer.querySelector(".tree-svg")?.remove();
    layer.insertAdjacentHTML("afterbegin", `<svg class="tree-svg" width="${g.W}" height="${g.H}" viewBox="0 0 ${g.W} ${g.H}" focusable="false">` +
      `<path class="tree-ground" d="M0 ${g.ground + .5}H${g.W}"/>` +
      g.wood.map(d => `<path class="tree-wood" d="${d}"/>`).join("") +
      `<path class="tree-grain" d="${g.grain}"/>${ellipses(g.knots, "tree-knot")}${ellipses(g.holes, "tree-hole")}` +
      // Crown leaves use local symbols: an external sprite's clones can keep a stale colour.
      `<defs>${LEAF_PATHS.map((d, k) => `<symbol id="tl-${k}" viewBox="0 0 24 24"><path d="${d}"/></symbol>`).join("")}</defs>` +
      `<g class="tree-crown" style="transform-origin:${f1(g.tx)}px ${f1(g.y0)}px">` +
      g.leaves.map((l, i) => `<use class="tl${l.holdout ? " holdout" : ""}" href="#tl-${l.shape}" x="${f1(l.x - l.s / 2)}" y="${f1(l.y - l.s / 2)}" ` +
        `width="${f1(l.s)}" height="${f1(l.s)}" transform="rotate(${l.rot.toFixed(0)} ${f1(l.x)} ${f1(l.y)})" ` +
        `style="--from:var(--tree-${l.from});--to:var(--tree-${l.to});--d:${(l.d - age).toFixed(2)}s;--t:${l.t.toFixed(2)}s` +
        `${fallen.has(i) ? ";visibility:hidden" : ""}"/>`).join("") + `</g></svg>`);
    uses = [...layer.querySelectorAll(".tl")];
    settle();
  }

  // ── M35 residents: at home until they wander off, then back the way they came ──
  const cast = eve => ({
    bird: { glyph: eve ? "🦇" : "🐦", fly: true, speed: 260, rest: [18, 45] },
    bird2: { glyph: "🐦", fly: true, speed: 240, rest: [25, 60] },
    owl: { glyph: "🦉", fly: true, speed: 200, rest: [30, 70], night: true },
    squirrel: { glyph: "🐿️", speed: 240, rest: [1.6, 2.4], acorn: true },
    caterpillar: { glyph: eve ? "🕷️" : "🐛", speed: 8, rest: [3, 8], small: true },
    hedgehog: { glyph: "🦔", speed: 42, rest: [15, 40] },
    mouse: { glyph: "🐁", speed: 160, rest: [2, 6], small: true },
  });

  function settle() {
    const roles = cast(html.hasAttribute("data-eve"));
    for (const [id, c] of critters) if (!g.trips[id]) { c.el.remove(); critters.delete(id); }
    for (const [id, pts] of Object.entries(g.trips)) {
      let c = critters.get(id);
      if (!c) {
        const el = Object.assign(document.createElement("span"), { className: `critter critter-${id}` });
        el.innerHTML = `<span class="critter-body">${roles[id].glyph}</span>`;
        life.append(el);
        critters.set(id, c = { id, el, ...roles[id] });
      }
      c.anim?.cancel();
      clearTimeout(c.timer);
      c.away = false;
      c.el.classList.remove("is-flying", "is-walking", "is-digging", "has-acorn");
      c.pts = pts;
      const s = c.small ? Math.round(cs * .8) : cs;
      Object.assign(c.el.style, { left: `${pts[0].x - s / 2}px`, top: `${pts[0].y - s / 2}px`, fontSize: `${s}px`, transform: pose(pts[0]) });
    }
  }

  function leg(c, pts, done) {
    const home = c.pts[0];
    let dist = 0;
    const acc = pts.map((p, i) => (dist += i ? Math.hypot(p.x - pts[i - 1].x, p.y - pts[i - 1].y) + (p.r !== pts[i - 1].r || p.f !== pts[i - 1].f ? 14 : 0) : 0));
    c.el.classList.add(c.fly ? "is-flying" : "is-walking");
    c.anim = c.el.animate(pts.map((p, i) => ({ offset: acc[i] / (dist || 1), transform: `translate(${p.x - home.x}px,${p.y - home.y}px) ${pose(p)}` })),
      { duration: Math.max(600, dist / c.speed * 1000), easing: "ease-in-out", fill: "forwards" });
    c.anim.onfinish = () => { c.el.classList.remove("is-flying", "is-walking"); done(); };
  }

  function wanderOff(c) {
    c.away = true;
    const back = [...c.pts].reverse().map(p => ({ ...p, f: -p.f }));
    back.push(c.pts[0]);                                     // turn around once home
    leg(c, c.pts, () => {
      if (c.acorn) c.el.classList.add("is-digging");
      c.timer = setTimeout(() => {
        c.el.classList.remove("is-digging");
        if (c.acorn) c.el.classList.add("has-acorn");        // the squirrel never comes back empty-handed
        leg(c, back, () => {
          c.anim.cancel();
          c.away = false;
          c.timer = setTimeout(() => c.el.classList.remove("has-acorn"), 5000);
        });
      }, rr(...c.rest) * 1000);
    });
  }

  // ── M34 falling: a turned leaf lets go and drifts the whole way down ──
  const ready = () => g.leaves.flatMap((l, i) => (!fallen.has(i) && !l.holdout && l.d + l.t < since() ? [i] : []));
  function drop(i, push = 0) {
    const l = g.leaves[i];
    fallen.add(i);
    uses[i].style.visibility = "hidden";
    const el = Object.assign(document.createElement("span"), { className: "tree-drop" });
    el.style.cssText = `left:${(l.x - l.s / 2).toFixed(1)}px;top:${(l.y - l.s / 2).toFixed(1)}px;width:${l.s.toFixed(1)}px;height:${l.s.toFixed(1)}px;` +
      `color:var(--tree-${l.to});--sway:${rr(3.2, 4.6).toFixed(2)}s;--flip:${rr(1.8, 2.6).toFixed(2)}s`;
    el.innerHTML = `<span class="leaf-sway"><span class="drop-rot" style="transform:rotate(${l.rot.toFixed(0)}deg)">` +
      `<svg class="leaf-flip" viewBox="0 0 24 24"><use href="${SPRITE}#${SHAPES[l.shape]}"/></svg></span></span>`;
    life.append(el);
    inAir++;
    const fall = g.ground - l.y - l.s * .3;
    const dx = Math.min(g.W - 8 - l.x, Math.max(8 - l.x, push + rr(-60, 30)));
    el.animate([{ transform: "none" }, { transform: `translate(${dx.toFixed(0)}px,${fall.toFixed(0)}px)` }],
      { duration: fall / rr(70, 100) * 1000, easing: "cubic-bezier(.45,0,.9,.9)", fill: "forwards" })
      .onfinish = () => { inAir--; el.classList.add("is-landed"); setTimeout(() => el.remove(), 15_000); };
  }

  const calm = () => document.hidden || reduced() || !g;
  const shed = () => setTimeout(() => {
    if (!calm() && inAir < 8 && fallen.size < g.leaves.length * .45) {
      const list = ready();
      if (list.length) drop(pick(list));
    }
    shed();
  }, rr(1600, 4200));
  const wander = () => setTimeout(() => {
    if (!calm()) {
      const night = /dusk|night/.test(html.dataset.daypart || "") || html.hasAttribute("data-eve");
      const all = [...critters.values()];
      const idle = all.filter(c => !c.away && (!c.night || night));
      if (idle.length && all.filter(c => c.away).length < 2) wanderOff(pick(idle));
    }
    wander();
  }, rr(7000, 18_000));

  draw();
  new ResizeObserver(() => {
    if (layer.clientWidth !== lastW || layer.clientHeight !== lastH) draw();
  }).observe(document.body);
  shed();
  wander();

  return {
    // M26 hook: a gust shakes the crown and strips a few turned leaves, blowing them right.
    gust() {
      if (calm()) return;
      const crown = layer.querySelector(".tree-crown");
      crown.classList.remove("shiver");
      void crown.getBoundingClientRect();
      crown.classList.add("shiver");
      ready().sort(() => Math.random() - .5).slice(0, 3 + Math.floor(Math.random() * 3))
        .forEach((i, k) => setTimeout(() => drop(i, rr(90, 180)), k * 160));
    },
  };
}
