// Hand-rolled SVG charts as strings. Spec: docs/PLAN.md §3.5 (charts) and §7.5.
// Pure builders — no DOM. Every chart is role="img" with an aria-label and a
// <details> data table. viewBox shrinks under 768px so labels render ~1:1
// (the Big Steppas chartDims lesson: a 620-unit box on a 375px screen makes
// 10px labels look 5px).
import { n, tick, esc } from "./format.js";

let uid = 0;

export function chartDims(vw = 1024) {
  const narrow = vw < 768;
  return narrow
    ? { w: 396, h: 200, padL: 36, padR: 10, padT: 14, padB: 26, narrow: true }
    : { w: 620, h: 260, padL: 46, padR: 14, padT: 16, padB: 30, narrow: false };
}

const gridYs = (d, yMax, ticks = 4) =>
  Array.from({ length: ticks + 1 }, (_, i) => {
    const v = (yMax / ticks) * i;
    const y = d.padT + (d.h - d.padT - d.padB) * (1 - i / ticks);
    return { v, y };
  });

const gridlines = (d, yMax, ticks = 4) =>
  gridYs(d, yMax, ticks).map(({ v, y }) => `
    <line class="chart-grid" x1="${d.padL}" x2="${d.w - d.padR}" y1="${y}" y2="${y}"/>
    <text class="chart-axis" x="${d.padL - 6}" y="${y + 4}" text-anchor="end">${tick(v)}</text>`).join("");

const dataTable = (head, rows) => `
  <details class="chart-data"><summary>See the numbers</summary>
    <table><thead><tr>${head.map(h => `<th scope="col">${esc(h)}</th>`).join("")}</tr></thead>
    <tbody>${rows.map(r => `<tr>${r.map((c, i) => i ? `<td class="num">${esc(c)}</td>` : `<th scope="row">${esc(c)}</th>`).join("")}</tr>`).join("")}</tbody></table>
  </details>`;

// Cumulative steps per walker across posted weeks.
export function climbChart(standings, weeks, vw) {
  const d = chartDims(vw);
  const innerW = d.w - d.padL - d.padR, innerH = d.h - d.padT - d.padB;
  const series = standings.map(r => {
    let cum = 0;
    return { walker: r.walker, pts: weeks.map(w => (cum += typeof w.steps?.[r.walker.id] === "number" ? w.steps[r.walker.id] : 0)) };
  });
  const yMax = Math.max(1, ...series.flatMap(s => s.pts));
  const x = i => d.padL + innerW * (weeks.length > 1 ? i / (weeks.length - 1) : 0.5);
  const y = v => d.padT + innerH * (1 - v / yMax);

  const lines = series.map((s, i) => {
    const c = `var(--walker-${s.walker.color})`;
    const pts = s.pts.map((v, k) => `${x(k).toFixed(1)},${y(v).toFixed(1)}`);
    const dash = i >= 8 ? ` stroke-dasharray="7 4"` : "";
    return `<polyline class="chart-line" points="${pts.join(" ")}" style="stroke:${c}"${dash}/>` +
      s.pts.map((v, k) => `<circle class="chart-pt" cx="${x(k).toFixed(1)}" cy="${y(v).toFixed(1)}" r="4.5" style="fill:${c}"/>`).join("");
  }).join("");

  const xLabels = weeks.map((w, k) =>
    `<text class="chart-axis" x="${x(k).toFixed(1)}" y="${d.h - 8}" text-anchor="middle">W${w.week}</text>`).join("");

  const legend = series.map(s =>
    `<li><span class="dot" style="--c:var(--walker-${s.walker.color})"></span>${esc(s.walker.short)}</li>`).join("");

  const lead = standings[0];
  const label = `Steps climbed week by week. ${lead ? `${lead.walker.name} leads with ${n(lead.total)}.` : "Nobody yet."}`;
  const table = dataTable(["Walker", ...weeks.map(w => `W${w.week} cumulative`)],
    series.map(s => [s.walker.short, ...s.pts.map(v => n(v))]));

  return `<div class="chart"><svg viewBox="0 0 ${d.w} ${d.h}" role="img" aria-label="${esc(label)}">` +
    `${gridlines(d, yMax)}${lines}${xLabels}</svg>` +
    `<ul class="legend">${legend}</ul>${table}</div>`;
}

// Horizontal bars of cumulative totals.
export function totalsChart(standings, vw) {
  const d = chartDims(vw);
  const innerW = d.w - d.padL - d.padR;
  const rows = standings.filter(r => r.total > 0 || true); // everyone, even 0 — the bar is honest
  const yMax = Math.max(1, ...rows.map(r => r.total));
  const rowH = d.narrow ? 30 : 34;
  const h = d.padT + rows.length * rowH + d.padB;
  const x = v => d.padL + innerW * (v / yMax);

  const bars = rows.map((r, i) => {
    const y = d.padT + i * rowH, bh = rowH - 10;
    return `<g>
      <text class="chart-axis" x="${d.padL - 6}" y="${y + bh / 2 + 4}" text-anchor="end">${esc(r.walker.short)}</text>
      <rect class="chart-bar" x="${d.padL}" y="${y}" width="${Math.max(0, x(r.total) - d.padL).toFixed(1)}" height="${bh}" rx="4" style="--c:var(--walker-${r.walker.color})"/>
      <text class="chart-axis chart-val" x="${Math.min(x(r.total) + 6, d.w - d.padR)}" y="${y + bh / 2 + 4}">${n(r.total)}</text>
    </g>`;
  }).join("");

  const label = `Total steps so far. ${rows[0] ? `${rows[0].walker.name} leads with ${n(rows[0].total)}.` : "Nobody yet."}`;
  const table = dataTable(["Walker", "Total"], rows.map(r => [r.walker.name, n(r.total)]));

  return `<div class="chart"><svg viewBox="0 0 ${d.w} ${h}" role="img" aria-label="${esc(label)}">${bars}</svg>${table}</div>`;
}

// One walker's week: 7 bars, SUNDAY-first. Best day gets a gold outline + 🔥,
// quietest gets a hatch overlay + 😴 — never a color that could be a walker's.
const DOW = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
export function dailyChart(days, { color = "accent", derived = false } = {}) {
  uid++;
  const w = 396, h = 170, padL = 8, padR = 8, padT = 26, padB = 24;
  const innerW = w - padL - padR, innerH = h - padT - padB;
  const max = Math.max(1, ...days);
  const bw = innerW / 7, bwIn = Math.min(34, bw - 14);
  const y = v => padT + innerH * (1 - v / max);
  const hi = days.indexOf(Math.max(...days));
  const lo = days.indexOf(Math.min(...days));

  const bars = days.map((v, i) => {
    const x = padL + i * bw + (bw - bwIn) / 2, by = y(v), bh = Math.max(0, padT + innerH - by);
    const marks = i === hi ? `<text class="chart-mark" x="${x + bwIn / 2}" y="${by - 6}" text-anchor="middle">🔥</text>`
      : i === lo ? `<text class="chart-mark" x="${x + bwIn / 2}" y="${by - 6}" text-anchor="middle">😴</text>` : "";
    return `<g>
      <rect class="chart-bar" x="${x.toFixed(1)}" y="${by.toFixed(1)}" width="${bwIn}" height="${bh.toFixed(1)}" rx="4"
        style="--c:var(--walker-${color}, var(--accent))"${i === hi ? ' data-best' : ""}/>
      ${i === lo ? `<rect x="${x.toFixed(1)}" y="${by.toFixed(1)}" width="${bwIn}" height="${bh.toFixed(1)}" rx="4" fill="url(#hatch-${uid})"/>` : ""}
      ${marks}
      <text class="chart-axis" x="${x + bwIn / 2}" y="${h - 6}" text-anchor="middle">${DOW[i][0]}</text>
    </g>`;
  }).join("");

  const label = `Daily steps, Sunday to Saturday${derived ? " (estimated split)" : ""}. Best day ${DOW[hi]} at ${n(days[hi])}, quietest ${DOW[lo]} at ${n(days[lo])}.`;
  const table = dataTable(["Day", "Steps"], days.map((v, i) => [DOW[i], n(v) + (derived ? " ~" : "")]));

  return `<div class="chart"><svg viewBox="0 0 ${w} ${h}" role="img" aria-label="${esc(label)}">
    <defs><pattern id="hatch-${uid}" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
      <rect width="6" height="6" fill="var(--surface-2)"/><line x1="0" y1="0" x2="0" y2="6" stroke="var(--line-strong)" stroke-width="1.5"/>
    </pattern></defs>
    ${bars}</svg>${table}</div>`;
}
