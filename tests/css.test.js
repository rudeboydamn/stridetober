// Stylesheet guards (docs/PLAN.md §1.4, §3.2): balanced braces in every file,
// and WCAG contrast for every token pair the design relies on, in both themes.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";

const DIR = "public/styles";

test("every stylesheet has balanced braces", () => {
  for (const f of readdirSync(DIR).filter(f => f.endsWith(".css"))) {
    const css = readFileSync(`${DIR}/${f}`, "utf8").replace(/\/\*[\s\S]*?\*\//g, "").replace(/"[^"]*"/g, "");
    let depth = 0;
    for (const ch of css) {
      if (ch === "{") depth++;
      if (ch === "}") depth--;
      assert.ok(depth >= 0, `${f}: a } closes nothing`);
    }
    assert.equal(depth, 0, `${f}: ${depth} unclosed {`);
  }
});

const tokens = readFileSync(`${DIR}/tokens.css`, "utf8");
const raw = name => {
  const m = tokens.match(new RegExp(`--${name}:\\s*(#[0-9A-Fa-f]{6})`));
  assert.ok(m, `tokens.css has no --${name}`);
  return m[1];
};
const lum = hex => {
  const [r, g, b] = hex.slice(1).match(/../g).map(x => parseInt(x, 16) / 255)
    .map(v => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const contrast = (a, b) => {
  const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
};
const WALKERS = ["cranberry", "goldenrod", "moss", "spruce", "denim", "fig", "cinnamon", "rosehip"];

for (const theme of ["light", "dark"]) {
  const t = name => raw(`${theme}-${name}`);

  test(`${theme}: text tokens reach 4.5:1 on every surface`, () => {
    const texts = ["ink", "ink-2", "ink-3", "accent-ink", "down", "up", "gold-ink", "eve"];
    for (const surface of ["bg", "surface", "surface-2"]) {
      for (const text of texts) {
        const c = contrast(t(text), t(surface));
        assert.ok(c >= 4.5, `${theme} --${text} on --${surface} is ${c.toFixed(2)}:1`);
      }
    }
  });

  test(`${theme}: text on filled controls reaches 4.5:1`, () => {
    for (const [fg, bg] of [["on-accent", "accent"], ["on-ribbon", "ribbon"]]) {
      const c = contrast(t(fg), t(bg));
      assert.ok(c >= 4.5, `${theme} --${fg} on --${bg} is ${c.toFixed(2)}:1`);
    }
  });

  test(`${theme}: graphics (walker fills, control borders) reach 3:1 against the page`, () => {
    for (const name of ["line-strong", ...WALKERS.map(w => `walker-${w}`)]) {
      const c = contrast(t(name), t("bg"));
      assert.ok(c >= 3, `${theme} --${name} vs --bg is ${c.toFixed(2)}:1`);
    }
  });
}

test("wax seal: text reaches 4.5:1; the seal or its dark-theme ring reaches 3:1", () => {
  assert.ok(contrast(raw("on-seal"), raw("seal")) >= 4.5);
  assert.ok(contrast(raw("seal"), raw("light-bg")) >= 3);
  assert.ok(contrast(raw("dark-seal-ring"), raw("dark-bg")) >= 3);
});

// Fraunces is served at one weight (600, opsz 72) to keep it at ~40KB instead of
// ~140KB. Asking for 700 would make the browser fetch nothing better and fake it.
test("display font is only ever requested at weight 600", () => {
  for (const f of readdirSync(DIR).filter(f => f.endsWith(".css"))) {
    const css = readFileSync(`${DIR}/${f}`, "utf8");
    for (const [decl, weight] of css.matchAll(/font:\s*(?:italic\s+)?(\d{3})\s[^;]*var\(--font-display\)/g)) {
      assert.equal(weight, "600", `${f}: "${decl}" asks Fraunces for ${weight}`);
    }
  }
});
