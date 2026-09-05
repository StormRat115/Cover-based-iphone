import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { createHarness } from "./runtime-harness.mjs";

const BUILD = readFileSync("js/boot.js", "utf8").match(
  /const BUILD = ["']([^"']+)/,
)[1];
const entry = `js/game.js?v=${BUILD}`;
const gameplayState = (actor) =>
  JSON.stringify(actor, (key, value) =>
    key.startsWith("__") ? undefined : value,
  );

test("local module/HTML references exist and use a single cache version", () => {
  for (const file of readdirSync("js").filter((name) => name.endsWith(".js"))) {
    const source = readFileSync("js/" + file, "utf8");
    for (const match of source.matchAll(
      /["'](\.\/[^"']+\.js(?:\?v=[^"']+)?)["']/g,
    )) {
      const [path, query] = match[1].split("?");
      assert.ok(existsSync(resolve("js", path)), `${file}: ${path}`);
      assert.equal(query, "v=" + BUILD, `${file}: duplicate module URL`);
    }
    for (const match of source.matchAll(/["'](\.\/assets\/[^"']+)["']/g)) {
      assert.ok(existsSync(match[1].split("?")[0]), `${file}: missing asset`);
    }
  }
  for (const match of readFileSync("index.html", "utf8").matchAll(
    /(?:src|href)="((?:js|css)\/[^"?]+)(?:\?[^" ]+)?"/g,
  )) {
    assert.ok(existsSync(match[1]), match[1]);
  }
});

test("world/screen round trips stay accurate as camera moves and viewport changes", async () => {
  const h = createHarness();
  const geometry = await h.importModule(`js/geometry.js?v=${BUILD}`);
  for (const [width, height] of [
    [390, 844],
    [844, 390],
    [1440, 900],
  ]) {
    for (const [cameraX, cameraY] of [
      [0, 0],
      [630, -275],
      [-1100, 825],
    ]) {
      const world = {
        cameraX,
        cameraY,
        scaleX: 0.25,
        scaleY: 0.125,
        offsetY: -40,
      };
      for (const [x, y] of [
        [0, 120],
        [350, -800],
        [-900, 1500],
      ]) {
        const screen = geometry.worldToScreen(x, y, world, width, height);
        const back = geometry.screenToWorld(...screen, world, width, height);
        assert.ok(Math.abs(back.x - x) < 1e-8 && Math.abs(back.y - y) < 1e-8);
      }
    }
  }
});

test("optimized cover checks match the original 35-sample rule", async () => {
  const h = createHarness();
  const { sampledLineIntersectsRect } = await h.importModule(
    `js/geometry.js?v=${BUILD}`,
  );
  function original(a, b, r) {
    for (let i = 1; i < 36; i++) {
      const t = i / 36,
        x = a.x + (b.x - a.x) * t,
        y = a.y + (b.y - a.y) * t;
      if (
        x > r.x - r.w / 2 &&
        x < r.x + r.w / 2 &&
        y > r.y - r.h / 2 &&
        y < r.y + r.h / 2
      )
        return true;
    }
    return false;
  }
  const rect = { x: 0, y: 0, w: 120, h: 34 };
  const point = () => ({
    x: h.random() * 4600 - 2300,
    y: h.random() * 3800 - 1900,
  });
  const cases = [];
  for (let i = 0; i < 20000; i++)
    cases.push([
      point(),
      point(),
      { ...point(), w: 10 + h.random() * 400, h: 10 + h.random() * 150 },
    ]);
  for (const a of [
    { x: 0, y: 0 },
    { x: -60, y: -17 },
    { x: 60, y: 17 },
    { x: -100, y: 0 },
    { x: 0, y: 100 },
  ]) {
    for (const b of [
      { x: 0, y: 0 },
      { x: -60, y: -17 },
      { x: 60, y: 17 },
      { x: 100, y: 0 },
      { x: 0, y: -100 },
    ])
      cases.push([a, b, rect]);
  }
  for (const args of cases)
    assert.equal(
      sampledLineIntersectsRect(...args),
      original(...args),
      JSON.stringify(args),
    );
  const { isLineBlocked, createCover } = await h.importModule(
    `js/cover.js?v=${BUILD}`,
  );
  const covers = createCover();
  for (let i = 0; i < 500; i++) {
    const a = point(),
      b = point();
    const expected = covers.some((c) =>
      (c.segments || [{ dx: 0, dy: 0, w: c.w, h: c.h }]).some((s) =>
        original(a, b, {
          x: c.x + (s.dx || 0),
          y: c.y + (s.dy || 0),
          w: s.w,
          h: s.h,
        }),
      ),
    );
    assert.equal(isLineBlocked(a, b, covers), expected);
  }
});

test("one fixed-step loop starts once, pauses fully, and bounds catch-up", async () => {
  const h = createHarness();
  const { createGameLoop } = await h.importModule(`js/gameLoop.js?v=${BUILD}`);
  let updates = 0,
    draws = 0,
    active = true;
  const loop = createGameLoop({
    update: () => updates++,
    draw: () => draws++,
    isActive: () => active,
  });
  assert.equal(h.frames.length, 0);
  loop.start();
  loop.start();
  assert.equal(h.frames.length, 1);
  h.frame();
  h.advance(60);
  assert.equal(updates, 60);
  active = false;
  loop.invalidate();
  h.frame();
  const pausedDraws = draws;
  h.advance(120);
  assert.equal(updates, 60);
  assert.equal(draws, pausedDraws);
  active = true;
  loop.resetClock();
  h.frame(30000);
  assert.equal(updates, 60);
  h.frame(5000);
  assert.equal(updates, 66);
  assert.equal(h.frames.length, 1);
});

test("simulation speed stays consistent without duplicate high-refresh drawing", async () => {
  for (const fps of [30, 60, 120, 144]) {
    const h = createHarness();
    const { createGameLoop } = await h.importModule(
      `js/gameLoop.js?v=${BUILD}`,
    );
    let updates = 0,
      draws = 0;
    createGameLoop({
      update: () => updates++,
      draw: () => draws++,
      isActive: () => true,
    }).start();
    h.frame(0);
    h.advance(fps, 1000 / fps);
    assert.equal(updates, 60);
    assert.equal(draws, Math.min(fps, 60) + 1);
  }
});

test("actual game handles combat, pause, restart, tab hiding and waves", async () => {
  const h = createHarness();
  const game = await h.importModule(entry);
  assert.equal(h.frames.length, 0, "no simulation before PLAY");
  assert.equal(h.metrics.intervals, 0, "no independent combat/HUD timers");
  game.startGame();
  game.startGame();
  h.frame();
  assert.equal(h.frames.length, 1);
  assert.ok(h.nodes.has("combatHud") && h.nodes.has("squadHealthHud"));
  const player = h.window.__battlePlayer;
  h.nodes.get("autoPlay").emit("pointerdown");
  h.advance(600);
  assert.ok(Number.isFinite(player.x) && Number.isFinite(player.y));
  h.nodes.get("pause").emit("pointerdown");
  h.frame();
  const paused = JSON.stringify([
    player,
    h.window.__battleEnemies,
    h.window.__battleAllies,
  ]);
  const drawing = h.metrics.draws;
  h.advance(180);
  assert.equal(
    JSON.stringify([player, h.window.__battleEnemies, h.window.__battleAllies]),
    paused,
  );
  assert.equal(h.metrics.draws, drawing, "paused frames avoid redrawing");
  const oldAllies = h.window.__battleAllies;
  oldAllies[0].dead = true;
  oldAllies[0].hp = 0;
  player.recovering = true;
  h.nodes.get("pauseRestart").emit("pointerdown");
  assert.notEqual(h.window.__battleAllies, oldAllies);
  assert.ok(
    h.window.__battleAllies.every(
      (ally) => !ally.dead && !ally.downed && ally.hp === ally.maxHp,
    ),
  );
  assert.equal(player.recovering, false);
  assert.equal(h.window.__wave, 1);
  assert.equal(h.window.squadMode, "FOLLOW");
  assert.equal(h.window.__autoPlay, false);
  h.frame();
  for (const enemy of h.window.__battleEnemies) {
    enemy.dead = true;
    enemy.deathTimer = enemy.deathDuration;
  }
  h.advance(180);
  assert.equal(h.window.__wave, 2);
  h.document.hidden = true;
  h.document.emit("visibilitychange");
  h.frame();
  const hidden = gameplayState(player);
  h.advance(20, 1000);
  assert.equal(gameplayState(player), hidden);
  h.document.hidden = false;
  h.document.emit("visibilitychange");
  h.nodes.get("resumeButton").emit("pointerdown");
  h.frame(30000);
  assert.equal(gameplayState(player), hidden, "no catch-up on resume");
  h.advance(60);
  assert.equal(h.frames.length, 1);
  assert.equal(h.metrics.intervals, 0);
});

test("enemy magazines are consumed and reload, and blood memory stays bounded", async () => {
  const h = createHarness();
  const enemyCore = await h.importModule(`js/enemyCore.js?v=${BUILD}`);
  const enemy = enemyCore.createBandits(1)[0];
  const player = {
    x: 0,
    y: 0,
    hp: 200,
    dead: false,
    downed: false,
    exposed: true,
  };
  Object.assign(enemy, {
    x: 100,
    y: 0,
    targetX: 100,
    targetY: 0,
    spawnTimer: 0,
    fire: 0,
    combatState: "exposed",
    combatTimer: 100,
    shotsLeft: 999,
    repositionCooldown: 100,
    exposed: true,
    combatTarget: player,
    targetTimer: 100,
  });
  enemy.weapon.ammo = 1;
  let shots = 0;
  enemyCore.updateBandits([enemy], 1 / 60, player, [], () => shots++);
  assert.equal(shots, 1);
  assert.equal(enemy.weapon.ammo, 0);
  enemyCore.updateBandits([enemy], 1 / 60, player, [], () => shots++);
  assert.equal(enemy.weapon.reloading, true);
  enemy.fire = 100;
  for (let i = 0; i < 180; i++)
    enemyCore.updateBandits([enemy], 1 / 60, player, [], () => shots++);
  assert.equal(enemy.weapon.ammo, enemy.weapon.magazine);
  const blood = await h.importModule(`js/bloodEffects.js?v=${BUILD}`);
  for (let i = 0; i < 100; i++) {
    h.window.__battleEnemies = [{ x: i, y: i, dead: true }];
    blood.updateBlood(1);
  }
  assert.ok(blood.getBloodStains().length <= 240);
  blood.resetBlood();
  assert.equal(blood.getBloodStains().length, 0);
});

test("held fire and movement release on blur; form inputs remain usable", async () => {
  const h = createHarness();
  const input = await h.importModule(`js/input.js?v=${BUILD}`);
  let shots = 0;
  input.initKeyboard({ onFire: () => shots++ });
  input.initKeyboard();
  h.window.emit("keydown", { key: " ", repeat: false });
  assert.equal(shots, 1);
  assert.equal(input.isKeyboardFireHeld(), true);
  h.window.emit("keydown", { key: "w" });
  assert.equal(input.getKeyboardMove().y, -1);
  h.window.emit("blur");
  assert.equal(input.getKeyboardMove(), null);
  assert.equal(input.isKeyboardFireHeld(), false);
  h.window.emit("keydown", { key: "w", target: { tagName: "SELECT" } });
  assert.equal(input.getKeyboardMove(), null);
});

test("preloading waits for decode and rejects failed required art", async () => {
  const h = createHarness();
  const { loadImage } = await h.importModule(`js/assets.js?v=${BUILD}`);
  const image = new h.Image();
  image.src = "asset.png";
  assert.equal(loadImage(image), loadImage(image));
  assert.equal(await loadImage(image), image);
  const failed = new h.Image();
  failed.src = "missing.png";
  failed.naturalWidth = 0;
  const pending = loadImage(failed, { timeoutMs: 10, maxAttempts: 2 });
  const rejected = assert.rejects(pending, /Could not prepare missing.png/);
  h.advance(3, 10);
  await rejected;
  assert.equal(h.timers.size, 0);
});

test("boot cannot reach READY until every required image has decoded", async () => {
  const h = createHarness({ imagesReady: false });
  await h.importModule(`js/boot.js?v=${BUILD}`);
  for (let i = 0; i < 100; i++) await Promise.resolve();
  assert.notEqual(h.nodes.get("loadingStatus").textContent, "READY");
  assert.equal(h.nodes.get("startGame").classList.contains("ready"), false);
  for (const image of h.images) {
    image.complete = true;
    image.naturalWidth = 1448;
    image.naturalHeight = 1086;
    image.emit("load");
  }
  for (let i = 0; i < 200; i++) await Promise.resolve();
  assert.equal(
    h.nodes.get("loadingStatus").textContent,
    "READY",
    h.nodes.get("runtimeError").textContent,
  );
  assert.equal(h.nodes.get("startGame").classList.contains("ready"), true);
});

test("player range ring follows weapon range and auto play fires bright yellow tracers", async () => {
  const h = createHarness();
  const game = await h.importModule(entry);
  game.startGame();
  const player = h.window.__battlePlayer;
  const enemies = h.window.__battleEnemies;
  enemies.forEach((enemy, index) => {
    enemy.dead = index !== 0;
    if (index === 0)
      Object.assign(enemy, {
        x: player.x + 300,
        y: player.y,
        spawnTimer: 0,
        cover: null,
        exposed: true,
      });
  });
  player.weapon.range = 1000;
  const ammo = player.weapon.ammo;
  h.nodes.get("autoPlay").emit("pointerdown");
  h.frame();
  h.advance(30);
  assert.ok(
    player.weapon.ammo < ammo,
    "auto play should fire repeatedly at a clear in-range target",
  );
  assert.ok(
    h.metrics.strokes.some(
      (stroke) =>
        stroke.strokeStyle === "#ffd400" &&
        stroke.lineWidth >= 4 &&
        stroke.shadowBlur >= 10,
    ),
    "player tracer should be bright yellow",
  );
  assert.ok(
    h.metrics.ellipses.some(
      (ellipse) =>
        Math.abs(ellipse[2] - 1000 * 0.25 * Math.SQRT2) < 0.001 &&
        Math.abs(ellipse[3] - 1000 * 0.125 * Math.SQRT2) < 0.001,
    ),
    "range ring should match equipped weapon range",
  );

  const coverRules = await h.importModule(`js/cover.js?v=${BUILD}`);
  const cover = h.window.__battleCovers[0];
  player.x = cover.x;
  player.y = cover.y + cover.h / 2 + 28;
  player.tx = player.x;
  player.ty = player.y;
  enemies[0].x = cover.x;
  enemies[0].y = cover.y - 300;
  enemies[0].dead = false;
  enemies[0].hp = enemies[0].maxHp;
  enemies[0].exposed = false;
  assert.equal(coverRules.isLineBlocked(player, enemies[0], [cover]), true);
  player.cover = cover;
  player.weapon.fireCooldown = 0;
  const coveredAmmo = player.weapon.ammo;
  h.advance(2);
  assert.ok(
    player.weapon.ammo < coveredAmmo,
    "auto play should peek and fire instead of idling behind its own cover",
  );
});

test("complete boot reaches menu and PLAY without duplicate atlas modules or timers", async () => {
  const h = createHarness();
  await h.importModule(`js/boot.js?v=${BUILD}`);
  // Flush the real dynamic-import/asset Promise chain, without a browser.
  for (let i = 0; i < 150; i++) await Promise.resolve();
  assert.equal(
    h.nodes.get("loadingStatus").textContent,
    "READY",
    h.nodes.get("runtimeError").textContent,
  );
  assert.equal(h.frames.length, 0);
  assert.equal(
    h.metrics.images,
    5,
    "three character sources plus two environment atlases",
  );
  assert.equal(h.metrics.intervals, 0);
  h.nodes.get("startGame").emit("click");
  assert.equal(h.frames.length, 0);
  h.nodes.get("menuPlay").emit("pointerdown");
  assert.equal(h.frames.length, 1);
  h.frame();
  const paths = [...h.modules.keys()].map((path) => path.split("?")[0]);
  assert.equal(
    new Set(paths).size,
    paths.length,
    "one module instance per file",
  );
  assert.ok(
    !paths.some((path) =>
      /bloodOverlay|autoplayTracers|playerAggression/.test(path),
    ),
  );
});

test("sustained simulated play stays finite at mobile and desktop sizes", async () => {
  for (const [width, height] of [
    [390, 844],
    [844, 390],
    [1440, 900],
  ]) {
    const h = createHarness({ width, height });
    const game = await h.importModule(entry);
    game.startGame();
    h.frame();
    h.nodes.get("autoPlay").emit("pointerdown");
    for (let i = 0; i < 1800; i++) {
      h.frame(1000 / 30);
      for (const actor of [
        h.window.__battlePlayer,
        ...h.window.__battleAllies,
        ...h.window.__battleEnemies,
      ]) {
        assert.ok(
          Number.isFinite(actor.x) &&
            Number.isFinite(actor.y) &&
            Number.isFinite(actor.hp),
        );
        assert.ok(
          actor.x >= -2300 &&
            actor.x <= 2300 &&
            actor.y >= -1900 &&
            actor.y <= 1900,
        );
      }
    }
    assert.equal(h.frames.length, 1);
  }
});
