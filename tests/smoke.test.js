import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

test("scaffold: public/ is the deploy root", () => {
  assert.ok(existsSync("public/index.html"), "public/index.html missing");
});

test("scaffold: every data file imports cleanly", async () => {
  for (const m of ["challenge", "walkers", "weeks", "copy", "finds", "demo"]) {
    const mod = await import(`../public/data/${m}.js`);
    assert.ok(Object.keys(mod).length > 0, `public/data/${m}.js exports nothing`);
  }
});

test("scaffold: challenge dates are sane", async () => {
  const { CHALLENGE } = await import("../public/data/challenge.js");
  assert.equal(CHALLENGE.weeks.length, 4);
  assert.equal(CHALLENGE.weeks[3].end, "2026-10-31");
});

// index.html must modulepreload main.js's whole static import graph, or phones on
// slow networks fall back to a 3-level request waterfall (main → views → charts).
test("perf: every statically imported module is modulepreloaded, and nothing else", () => {
  const html = readFileSync("public/index.html", "utf8");
  const preloaded = new Set([...html.matchAll(/<link rel="modulepreload" href="([^"]+)">/g)].map(m => m[1]));
  const graph = new Set();
  const walk = file => {
    if (graph.has(file)) return;
    graph.add(file);
    const src = readFileSync("public" + file, "utf8");
    for (const [, spec] of src.matchAll(/^import\s[^"']*["']([^"']+)["'];?$/gm)) {
      walk(new URL(spec, "https://x" + file).pathname);
    }
  };
  walk("/src/main.js");
  for (const f of graph) assert.ok(preloaded.has(f), `index.html is missing <link rel="modulepreload" href="${f}">`);
  for (const f of preloaded) {
    assert.ok(graph.has(f), `${f} is preloaded but not statically imported — drop the link`);
    assert.ok(existsSync("public" + f), `${f} is preloaded but does not exist`);
  }
});
