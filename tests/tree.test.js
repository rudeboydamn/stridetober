// The background tree (M34/M35): its geometry must fit whatever page it is drawn on.
import { test } from "node:test";
import assert from "node:assert/strict";
import { plan } from "../public/src/lib/tree.js";

// A page as the browser measures it: gutters per tokens.css, the pile heaped at the right.
const page = (W, H) => {
  const gutter = W < 480 ? 16 : W < 768 ? 20 : W < 1024 ? 32 : Math.max(48, (W - (W >= 1440 ? 1200 : 1120)) / 2);
  const right = W - gutter - 24;
  return { W, H, ground: H - (W < 1024 ? 200 : 140), gutter, top: 64, cs: W < 768 ? 20 : 26, pile: { left: right - 200, right } };
};

test("the tree fits every page: crown up top, trunk to the ground, residents on the page", () => {
  for (const [W, H] of [[320, 1300], [375, 2958], [390, 7000], [768, 2400], [1024, 1500], [1280, 2643], [1920, 1100]]) {
    const g = plan(page(W, H)), at = `${W}×${H}`;
    assert.ok(g.leaves.length >= 140, `${at}: a thin crown (${g.leaves.length} leaves)`);
    assert.equal(g.leaves.filter(l => l.holdout).length, 1, `${at}: exactly one holdout leaf`);
    assert.ok(g.y0 < g.ground, `${at}: the trunk starts below the ground`);
    assert.ok(g.pileEdge < g.tx && g.tx <= W, `${at}: the trunk stands on the page, right of the pile`);
    for (const [who, [home]] of Object.entries(g.trips)) {
      assert.ok(home.x >= 0 && home.x <= W && home.y >= 64 && home.y <= H, `${at}: the ${who} lives off the page, at ${home.x},${home.y}`);
    }
  }
});

test("a longer page grows a longer trunk, never a new crown", () => {
  assert.deepEqual(plan(page(375, 2000)).leaves, plan(page(375, 5000)).leaves);
});
