import { performance } from "node:perf_hooks";
import { createHarness } from "../tests/runtime-harness.mjs";
import { readFileSync } from "node:fs";
const version = readFileSync("js/boot.js", "utf8").match(
  /const BUILD = ["']([^"']+)/,
)[1];
const revision = process.argv[2] || "a0dd8aa75f2b13c3ccc13509ffdb61d5a7b7d8c8";
const before = createHarness({ revision });
await before.importModule("js/game.js?v=20260905-58");
before.metrics.draws = 0;
before.frame();
const after = createHarness();
const game = await after.importModule(`js/game.js?v=${version}`);
game.startGame();
after.frame();
after.metrics.draws = 0;
after.frame();
console.log(
  JSON.stringify(
    {
      viewport: "390x844",
      metric:
        "Canvas drawing API calls for a stationary starting frame (stub canvas; not device FPS)",
      before: before.metrics.draws,
      after: after.metrics.draws,
      reductionPercent: Math.round(
        (1 - after.metrics.draws / before.metrics.draws) * 100,
      ),
    },
    null,
    2,
  ),
);
const oldCover = await before.importModule("js/cover.js?v=20260905-58");
const newCover = await after.importModule(`js/cover.js?v=${version}`);
const oldLayout = oldCover.createCover(),
  newLayout = newCover.createCover();
const point = () => ({
  x: after.random() * 4600 - 2300,
  y: after.random() * 3800 - 1900,
});
const lines = Array.from({ length: 10000 }, () => [point(), point()]);
function measure(fn, covers) {
  let hits = 0;
  const start = performance.now();
  for (const [a, b] of lines) hits += Number(fn(a, b, covers));
  return {
    hits,
    milliseconds: Math.round((performance.now() - start) * 10) / 10,
  };
}
// Warm both functions first; compare identical lines and hit totals.
measure(oldCover.isLineBlocked, oldLayout);
measure(newCover.isLineBlocked, newLayout);
const oldTime = measure(oldCover.isLineBlocked, oldLayout);
const newTime = measure(newCover.isLineBlocked, newLayout);
if (oldTime.hits !== newTime.hits) throw new Error("Cover behavior changed");
console.log(
  JSON.stringify(
    {
      metric: "10,000 cover queries (synthetic CPU benchmark)",
      before: oldTime,
      after: newTime,
    },
    null,
    2,
  ),
);
