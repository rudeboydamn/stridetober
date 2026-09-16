// Formatting helpers. Spec: docs/PLAN.md §7.3.
import { parseLocal } from "./time.js";

const NF = new Intl.NumberFormat("en-US");

// Full digits, always. "NO rounding up" is canon — only chart ticks abbreviate.
export const n = x => NF.format(Math.round(x || 0));

export function tick(x) {
  if (x >= 10_000) return Math.round(x / 1000) + "k";
  if (x >= 1000) return String(Math.round(x / 100) / 10) + "k";
  return String(Math.round(x));
}

export function ord(x) {
  const t = x % 100, u = x % 10;
  const suffix = t >= 11 && t <= 13 ? "th" : u === 1 ? "st" : u === 2 ? "nd" : u === 3 ? "rd" : "th";
  return x + suffix;
}

const ESC = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
// MANDATORY before any data-file string reaches innerHTML.
export const esc = s => (s == null ? "" : String(s).replace(/[&<>"']/g, c => ESC[c]));

export const plural = (x, one, many) => (x === 1 ? one : many);

export const pick = (arr, i) => arr[((i % arr.length) + arr.length) % arr.length];

const asDate = d => (d instanceof Date ? d : parseLocal(d));
const MONTH_DAY = { month: "short", day: "numeric" };

export const fmtDay = d => asDate(d).toLocaleDateString("en-US", MONTH_DAY);

export function fmtRange(a, b) {
  const x = asDate(a), y = asDate(b);
  return x.getMonth() === y.getMonth() ? `${fmtDay(x)} – ${y.getDate()}` : `${fmtDay(x)} – ${fmtDay(y)}`;
}

export function fresh(ts, now) {
  const ms = now - asDate(ts);
  if (ms < 90_000) return "just now";
  if (ms < 3_600_000) return `${Math.round(ms / 60_000)}m ago`;
  if (ms < 86_400_000) return `${Math.round(ms / 3_600_000)}h ago`;
  if (ms < 172_800_000) return "yesterday";
  return fmtDay(asDate(ts));
}

export const fill = (template, vars = {}) =>
  String(template).replace(/\{(\w+)\}/g, (m, k) => (k in vars ? String(vars[k]) : m));

// Copy-pool text → safe HTML: escape, *emphasis* → <em>, then escaped {vars}.
export const rich = (text, vars = {}) =>
  esc(text)
    .replace(/\*([^*]+)\*/g, "<em>$1</em>")
    .replace(/\{(\w+)\}/g, (m, k) => (k in vars ? esc(vars[k]) : m));
