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

test("transparent monster sheets map to their matching enemy roles", async () => {
  const h = createHarness();
  const sprites = await h.importModule(`js/soldierAssets.js?v=${BUILD}`);
  const expected = {
    rifleman: "enemy-ashfang-rifleman-sheet.png",
    shotgunner: "enemy-mawbreaker-breacher-sheet.png",
    heavy: "enemy-ironhide-heavy-sheet.png",
    sniper: "enemy-paleeye-stalker-sheet.png",
  };
  for (const [type, file] of Object.entries(expected)) {
    const sheet = sprites.getEnemyMonsterSheet(type),
      png = readFileSync(resolve("assets/generated/enemies", file));
    assert.equal(sheet.file, file);
    assert.equal(sheet.frameWidth, 256);
    assert.equal(sheet.frameHeight, 146);
    assert.equal(png[25], 6, `${file} must be an RGBA PNG`);
    const actor = {
      type,
      x: 0,
      y: 0,
      targetX: 0,
      targetY: 0,
      hp: 60,
      maxHp: 60,
      scale: 1,
      facingX: 1,
      facingY: 0,
      muzzle: 0,
      hit: 0,
      dead: false,
    };
    assert.equal(
      sprites.drawEnemyMonster(
        h.document.createElement("canvas").getContext("2d"),
        actor,
      ),
      true,
    );
  }
  assert.equal(sprites.getEnemyMonsterSheet("marksman"), null);

  const actor = {
    type: "rifleman",
    x: 0,
    y: 0,
    targetX: 0,
    targetY: 0,
    hp: 60,
    maxHp: 60,
    scale: 1,
    facingX: 1,
    facingY: 0,
    muzzle: 0.13,
    hit: 0,
    dead: false,
  };
  const context = h.document.createElement("canvas").getContext("2d");
  sprites.drawEnemyMonster(context, actor);
  const firstFrame = h.metrics.drawImages.at(-1)[1];
  h.frame(40);
  actor.muzzle = 0.09;
  sprites.drawEnemyMonster(context, actor);
  assert.equal(
    h.metrics.drawImages.at(-1)[1],
    firstFrame,
    "monster firing animation must not race through frames",
  );
  h.frame(100);
  actor.muzzle = 0;
  sprites.drawEnemyMonster(context, actor);
  assert.notEqual(h.metrics.drawImages.at(-1)[1], firstFrame);
});

test("waves enter off-screen from the northeast street with 6-12 reinforcements", async () => {
  const h = createHarness();
  const enemies = await h.importModule(`js/enemyCore.js?v=${BUILD}`);
  const geometry = await h.importModule(`js/geometry.js?v=${BUILD}`);
  const world = {
    cameraX: 0,
    cameraY: 0,
    scaleX: 0.25,
    scaleY: 0.125,
    offsetY: -40,
  };
  const points = enemies.createNortheastSpawnPoints(24, {
    world,
    width: 390,
    height: 844,
  });
  let rightEntries = 0;
  for (const point of points) {
    const screen = geometry.worldToScreen(point.x, point.y, world, 390, 844);
    assert.ok(
      screen[0] > 390 + 110 || screen[1] < -110,
      "every monster must begin beyond the visible screen",
    );
    if (screen[0] > 390) rightEntries++;
  }
  assert.ok(rightEntries >= points.length * 0.75);
  assert.equal(enemies.enemyCountForWave(1, () => 0), 13);
  assert.equal(enemies.enemyCountForWave(1, () => 0.999), 19);
  assert.equal(enemies.enemyCountForWave(5, () => 0), 20);
  assert.equal(enemies.enemyCountForWave(5, () => 0.999), 26);
  const lateWave = enemies.createBandits(6, {
    random: () => 0,
    extraCount: 12,
    spawnView: { world, width: 390, height: 844 },
  });
  assert.ok(
    lateWave.filter((enemy) => enemy.type === "sniper").length <=
      Math.ceil(lateWave.length / 9),
    "snipers should be a rare specialist spawn",
  );
  const surround = enemies.createSurroundSpawnPoints(20, {
    world,
    width: 390,
    height: 844,
  });
  assert.ok(surround.some((point) => point.screenY < -110));
  assert.ok(surround.some((point) => point.screenY > 844 + 110));
  assert.ok(
    surround.every(
      (point) => point.screenY < -110 || point.screenY > 844 + 110,
    ),
    "fort defense waves must begin off-screen above or below",
  );
});

test("monsters prioritize living Marines over the player and squad", async () => {
  const h = createHarness();
  const enemyCore = await h.importModule(`js/enemyCore.js?v=${BUILD}`);
  const marine = {
    name: "Marine 1",
    x: 500,
    y: 0,
    hp: 90,
    dead: false,
    downed: false,
    exposed: true,
  };
  h.window.__battleMarines = [marine];
  h.window.__battleAllies = [
    { name: "Rook", x: 60, y: 0, hp: 100, dead: false, downed: false },
  ];
  const player = { x: 30, y: 0, hp: 100, dead: false, downed: false };
  const enemy = enemyCore.createBandits(1)[0];
  Object.assign(enemy, {
    x: 0,
    y: 0,
    spawnTimer: 0,
    targetTimer: 0,
    repositionCooldown: 10,
    fire: 10,
  });
  enemyCore.updateBandits([enemy], 1 / 60, player, [], null);
  assert.equal(enemy.combatTarget, marine);
});

test("rifle and sniper balance favors faster assault fire and deliberate precision", async () => {
  const h = createHarness();
  const { WEAPONS } = await h.importModule(`js/weapons.js?v=${BUILD}`);
  assert.ok(WEAPONS.rifle.cooldown <= 0.24);
  assert.ok(WEAPONS.sniper.damage >= 96);
  assert.ok(WEAPONS.sniper.cooldown >= 2.6);
  assert.ok(WEAPONS.sniper.reload >= 3);
});

test("snipers paint valid targets with a red aiming laser", async () => {
  const h = createHarness();
  const { drawSniperLasers } = await h.importModule(`js/enemy.js?v=${BUILD}`);
  const target = { x: 10, y: 20, hp: 100, dead: false, downed: false };
  const sniper = {
    type: "sniper",
    x: 100,
    y: -50,
    hp: 55,
    dead: false,
    downed: false,
    exposed: true,
    spawnTimer: 0,
    weapon: { reloading: false },
    combatTarget: target,
  };
  const context = h.document.createElement("canvas").getContext("2d");
  assert.equal(drawSniperLasers(context, [sniper], (x, y) => [x, y], 100), 1);
  assert.ok(
    h.metrics.strokes.some((stroke) => stroke.strokeStyle === "#ff3948"),
  );
});

test("Marines use 20 defense and aggressively advance into firing cover", async () => {
  const h = createHarness();
  const marineModule = await h.importModule(`js/marines.js?v=${BUILD}`);
  const coverModule = await h.importModule(`js/cover.js?v=${BUILD}`);
  const marines = marineModule.createMarines(),
    enemy = {
      x: 1350,
      y: -250,
      hp: 5000,
      maxHp: 5000,
      defense: 20,
      dead: false,
      hit: 0,
    },
    player = { x: 0, y: 0, hp: 100, dead: false, downed: false },
    startingDistance = Math.hypot(
      marines[0].x - enemy.x,
      marines[0].y - enemy.y,
    );
  assert.ok(
    marines.every(
      (marine) => marine.defense === 20 && marine.aggressiveAdvance,
    ),
  );
  const covers = coverModule.createCover();
  for (let i = 0; i < 120; i++)
    marineModule.updateMarines(
      marines,
      1 / 60,
      player,
      covers,
      [enemy],
      null,
      [],
    );
  assert.ok(marines.some((marine) => marine.cover));
  assert.ok(
    Math.hypot(marines[0].x - enemy.x, marines[0].y - enemy.y) <
      startingDistance,
  );
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

test("cover pieces use explicit square/rect/T/U/L segments that match their art", async () => {
  const h = createHarness();
  const city = await h.importModule(`js/cityMap.js?v=${BUILD}`);
  const coverModule = await h.importModule(`js/cover.js?v=${BUILD}`);
  const sprites = await h.importModule(`js/soldierAssets.js?v=${BUILD}`);
  const shapes = new Set();
  for (const cover of city.createCityCoverLayout(() => 0.31)) {
    assert.ok(
      city.COVER_SHAPES.includes(cover.shape),
      cover.id + " needs an explicit cover shape",
    );
    assert.ok(cover.theme, cover.id + " needs a fitted theme");
    assert.ok(cover.segments && cover.segments.length >= 1);
    shapes.add(cover.shape);
    const minSeg = { square: 1, rect: 1, T: 2, U: 3, L: 2 };
    assert.ok(
      cover.segments.length >= minSeg[cover.shape],
      cover.id + " needs the interior segments of a " + cover.shape,
    );
    if (!cover.setPiece)
      assert.equal(cover.segments.length, minSeg[cover.shape]);
    const pieces = coverModule.coverPieces(cover);
    assert.equal(pieces.length, cover.segments.length);
    const threat = { x: cover.x, y: cover.y + 400 };
    const slot = coverModule.getCoverSlot(cover, { coverSlotIndex: 0 }, threat);
    assert.equal(slot.side, "top");
    const wall = slot.segment;
    const gap = Math.abs(slot.y - (wall.y - wall.h / 2));
    assert.ok(gap <= 20, "units must plant against the facing cover edge");
  }
  assert.deepEqual([...shapes].sort(), ["L", "T", "U", "rect", "square"]);
  const layout = city.createCityCoverLayout(() => 0.31);
  assert.ok(
    layout.some((cover) => cover.setPiece && cover.segments.length > 2),
    "street should include larger combined set pieces",
  );

  const low = {
    type: "low",
    x: 40,
    y: 0,
    w: 84,
    h: 84,
    shape: "square",
  };
  const planted = sprites.coverPlantOffset({
    x: 40,
    y: 60,
    cover: low,
    exposed: false,
  });
  assert.ok(planted.y > 0, "low cover pose should squat onto the silhouette");
  const peeking = sprites.coverPlantOffset({
    x: 40,
    y: 60,
    cover: low,
    exposed: true,
  });
  assert.ok(peeking.x !== planted.x || peeking.y < planted.y);
});

test("street asphalt is solid slabs plus sharp grain, not a stretched tile", () => {
  const source = readFileSync("js/game.js", "utf8");
  assert.equal(source.includes("stretch one texture"), false);
  assert.equal(source.includes("groundTile"), false);
  assert.equal(source.includes("roadSegments"), false);
  assert.match(source, /getAsphaltGrain/);
  assert.match(source, /imageSmoothingEnabled = false/);
});

test("mission cover layouts are unique, reproducible, and keep spawn lanes clear", async () => {
  const h = createHarness();
  const city = await h.importModule(`js/cityMap.js?v=${BUILD}`);
  const seeded = (seed) => () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  const first = city.createCityCoverLayout(seeded(17));
  const repeat = city.createCityCoverLayout(seeded(17));
  const different = city.createCityCoverLayout(seeded(91));
  assert.deepEqual(first, repeat, "a supplied seed should reproduce a layout");
  assert.notDeepEqual(
    first,
    different,
    "different missions need different layouts",
  );
  assert.ok(first.length >= 52 && first.length <= 58);
  assert.ok(first.some((cover) => cover.y < -5000));
  assert.ok(first.some((cover) => cover.id === "fort-front"));
  for (const cover of first) {
    assert.ok(
      Math.hypot(cover.x, cover.y - 190) >=
        330 + Math.max(cover.w, cover.h) / 2,
      "squad spawn must stay clear",
    );
  }
  for (let i = 0; i < first.length; i++) {
    for (let j = i + 1; j < first.length; j++) {
      const a = first[i];
      const b = first[j];
      assert.ok(
        Math.abs(a.x - b.x) >= (a.w + b.w) / 2 + 90 ||
          Math.abs(a.y - b.y) >= (a.h + b.h) / 2 + 72,
        "procedural cover must not overlap",
      );
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
  assert.ok(
    h.window.__battleEnemies.length >= 13 &&
      h.window.__battleEnemies.length <= 19,
  );
  assert.ok(
    h.window.__battleEnemies.every(
      (enemy) => enemy.spawnScreenX > 390 || enemy.spawnScreenY < 0,
    ),
  );
  const player = h.window.__battlePlayer;
  assert.equal(h.window.__battleMarines.length, 5);
  assert.ok(
    h.window.__battleMarines.every(
      (marine) =>
        marine.permanentDeath &&
        marine.defense === 20 &&
        marine.aggressiveAdvance &&
        marine.regenRate === 0 &&
        marine.canBeRevived === false &&
        marine.canRevive === false,
    ),
  );
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
  const oldMarines = h.window.__battleMarines;
  oldAllies[0].dead = true;
  oldAllies[0].hp = 0;
  player.recovering = true;
  h.nodes.get("pauseRestart").emit("pointerdown");
  assert.notEqual(h.window.__battleAllies, oldAllies);
  assert.notEqual(h.window.__battleMarines, oldMarines);
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
  const marine = h.window.__battleMarines[0];
  marine.hp = 0;
  h.frame(1000 / 30);
  assert.equal(marine.dead, true);
  assert.equal(marine.downed, false);
  h.window.__streetMission.captured = true;
  for (const enemy of h.window.__battleEnemies) {
    enemy.dead = true;
    enemy.deathTimer = enemy.deathDuration;
  }
  h.advance(180);
  assert.equal(h.window.__wave, 2);
  assert.ok(
    h.window.__battleEnemies.some((enemy) => enemy.spawnLane === "top") &&
      h.window.__battleEnemies.some((enemy) => enemy.spawnLane === "bottom"),
    "post-capture waves should surround the fort from both screen edges",
  );
  assert.equal(marine.dead, true, "KIA Marines must not respawn between waves");
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

test("the fort captures after 30 seconds and deploys a 200 HP support turret", async () => {
  const h = createHarness();
  const missionModule = await h.importModule(`js/streetMission.js?v=${BUILD}`);
  const vehicleModule = await h.importModule(`js/supportVehicle.js?v=${BUILD}`);
  const mission = missionModule.createStreetMission();
  const player = {
    x: mission.objective.x,
    y: mission.objective.y,
    hp: 100,
    dead: false,
    downed: false,
  };
  missionModule.updateStreetMission(mission, 29.9, player, []);
  assert.equal(mission.captured, false);
  missionModule.updateStreetMission(mission, 0.1, player, []);
  assert.equal(mission.captured, true);
  assert.equal(mission.justCaptured, true);
  const vehicle = vehicleModule.createSupportVehicle(mission.objective);
  assert.equal(vehicle.hp, 200);
  assert.equal(vehicle.defense, 20);
  assert.ok(vehicle.weapon.range >= 2700);
  assert.ok(vehicle.weapon.cooldown <= 0.075);
  assert.ok(vehicle.weapon.damage <= 3);
  const enemy = {
    x: vehicle.x + 180,
    y: vehicle.y,
    hp: 100,
    maxHp: 100,
    defense: 0,
    dead: false,
    downed: false,
    hit: 0,
  };
  let turretShots = 0;
  for (let i = 0; i < 180; i++)
    vehicleModule.updateSupportVehicle(
      vehicle,
      1 / 60,
      [enemy],
      [],
      () => turretShots++,
    );
  assert.ok(turretShots >= 30, "the fort turret should sustain a high fire rate");
  assert.ok(enemy.hp < enemy.maxHp, "the support turret should damage hostiles");
});

test("squad and Marines independently advance cover-to-cover toward the street objective", async () => {
  const h = createHarness();
  const alliesModule = await h.importModule(`js/allyCore2.js?v=${BUILD}`);
  const marineModule = await h.importModule(`js/marines.js?v=${BUILD}`);
  const coverModule = await h.importModule(`js/cover.js?v=${BUILD}`);
  const missionModule = await h.importModule(`js/streetMission.js?v=${BUILD}`);
  h.window.__streetMission = missionModule.createStreetMission();
  const player = { x: 0, y: 120, hp: 100, dead: false, downed: false };
  const covers = coverModule.createCover(() => 0.42);
  const allies = alliesModule.createAllies();
  const marines = marineModule.createMarines();
  const allyStart = allies[0].y;
  const marineStart = marines[0].y;
  for (let i = 0; i < 360; i++) {
    alliesModule.updateAllies(allies, 1 / 60, player, covers, [], null, "FOLLOW", marines);
    marineModule.updateMarines(marines, 1 / 60, player, covers, [], null, allies);
  }
  assert.ok(allies.some((ally) => ally.y < allyStart - 100));
  assert.ok(marines.some((marine) => marine.y < marineStart - 100));
  assert.ok(allies.some((ally) => ally.cover));
  assert.ok(marines.some((marine) => marine.cover));
});

test("friendly AI pauses the objective push for contact and resumes after the wipe", async () => {
  const h = createHarness();
  const game = await h.importModule(entry);
  game.startGame();
  const player = h.window.__battlePlayer;
  const mission = h.window.__streetMission;
  const enemies = h.window.__battleEnemies;
  enemies.forEach((enemy, index) => {
    enemy.dead = index !== 0;
    enemy.deathTimer = enemy.deathDuration;
  });
  Object.assign(enemies[0], {
    x: player.x + 420,
    y: player.y,
    spawnTimer: 0,
    dead: false,
    hp: 5000,
    maxHp: 5000,
    exposed: true,
  });
  h.nodes.get("autoPlay").emit("pointerdown");
  h.frame();
  h.advance(15);
  assert.equal(player.objectiveAdvancePaused, true);
  assert.ok(
    h.window.__battleAllies.every((ally) => ally.objectiveAdvancePaused),
  );
  assert.ok(
    h.window.__battleMarines.every((marine) => marine.objectiveAdvancePaused),
  );

  enemies[0].dead = true;
  enemies[0].hp = 0;
  enemies[0].deathTimer = enemies[0].deathDuration;
  const before = Math.hypot(
    player.x - mission.objective.x,
    player.y - mission.objective.y,
  );
  h.advance(90);
  const after = Math.hypot(
    player.x - mission.objective.x,
    player.y - mission.objective.y,
  );
  assert.equal(player.objectiveAdvancePaused, false);
  assert.ok(
    h.window.__battleAllies.every((ally) => !ally.objectiveAdvancePaused),
  );
  assert.ok(
    h.window.__battleMarines.every((marine) => !marine.objectiveAdvancePaused),
  );
  assert.ok(after < before, "the objective push should resume after contact is clear");
});

test("friendly combat awareness prioritizes threats and coordinates squad fire", async () => {
  const h = createHarness();
  const game = await h.importModule(entry);
  game.startGame();
  const player = h.window.__battlePlayer;
  const enemies = h.window.__battleEnemies;
  enemies.forEach((enemy, index) => {
    enemy.dead = index > 1;
    enemy.deathTimer = enemy.deathDuration;
  });
  Object.assign(enemies[0], {
    type: "rifleman",
    x: player.x + 220,
    y: player.y,
    hp: 500,
    maxHp: 500,
    spawnTimer: 0,
    dead: false,
    exposed: true,
    combatTarget: null,
  });
  Object.assign(enemies[1], {
    type: "sniper",
    x: player.x + 580,
    y: player.y,
    hp: 500,
    maxHp: 500,
    spawnTimer: 0,
    dead: false,
    exposed: true,
    combatTarget: player,
  });
  h.nodes.get("autoPlay").emit("pointerdown");
  h.frame();
  h.advance(2);
  assert.equal(player.aimTarget, enemies[1], "player AI should suppress the high-threat sniper");
  assert.equal(player.objectiveAdvancePaused, true);

  const assigned = new Set(
    h.window.__battleAllies.map((ally) => ally.combatTarget).filter(Boolean),
  );
  assert.ok(assigned.size >= 2, "the squad should avoid wasteful full-team overfocus");
});

test("covered squad members reload early and avoid unsafe revives", async () => {
  const h = createHarness();
  const alliesModule = await h.importModule(`js/allyCore2.js?v=${BUILD}`);
  const allies = alliesModule.createAllies();
  const cover = {
    id: "test-cover",
    x: 0,
    y: 0,
    w: 180,
    h: 40,
    type: "wide",
  };
  const actor = allies[0];
  Object.assign(actor, {
    x: 0,
    y: 48,
    cover,
    coverAnchorX: 0,
    coverAnchorY: 48,
    combatState: "covered",
    exposed: false,
  });
  actor.weapon.ammo = 1;
  allies[1].downed = true;
  allies[1].x = 420;
  allies[1].y = 0;
  const enemy = {
    type: "shotgunner",
    x: 0,
    y: -500,
    hp: 500,
    maxHp: 500,
    defense: 0,
    dead: false,
    downed: false,
    exposed: true,
    spawnTimer: 0,
    combatTarget: actor,
  };
  const beforeRevive = allies[1].reviveTimer;
  alliesModule.updateAllies(
    allies,
    1 / 60,
    { x: 0, y: 120, hp: 100, dead: false, downed: false, aimTarget: null },
    [cover],
    [enemy],
    null,
    "FOLLOW",
    [],
  );
  assert.equal(actor.reloading, true, "low magazines should be refreshed from cover");
  assert.equal(allies[1].reviveTimer, beforeRevive, "danger-close revives should wait");
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
<<<<<<< HEAD
    16,
    "soldier/vault/monster/charger sources plus cover atlases and wartorn plates",
=======
    15,
    "nine character sources, three cover atlases, and three wartorn plates",
>>>>>>> 3d78fcb (Use clean transparent ruin plates for side dressing)
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

test("solid cover blocks walks and vaults over jumpable pieces", async () => {
  const h = createHarness();
  const col = await h.importModule(`js/coverCollision.js?v=${BUILD}`);
  const low = {
    id: "bags",
    x: 0,
    y: 0,
    w: 160,
    h: 36,
    type: "low",
    theme: "sandbags",
    shape: "rect",
    segments: [{ dx: 0, dy: 0, w: 160, h: 36 }],
  };
  const tall = {
    id: "wall",
    x: 0,
    y: 0,
    w: 160,
    h: 36,
    type: "wide",
    theme: "jersey",
    shape: "rect",
    segments: [{ dx: 0, dy: 0, w: 160, h: 36 }],
  };
  assert.equal(col.isCoverJumpable(low), true);
  assert.equal(col.isCoverJumpable(tall), false);
  assert.ok(col.overlapsSolid(0, 0, [tall], { pad: 11 }));
  const walker = { x: -130, y: 0, vaulting: false, state: "walk" };
  const blocked = col.resolveSolidMove(walker, 20, 0, [tall], {
    allowVault: false,
    target: { x: 80, y: 0 },
  });
  assert.ok(blocked.x < -70, "units must stop or slide, not walk through tall cover");
  assert.equal(blocked.vaulted, false);
  const jumper = { x: 0, y: 48, vaulting: false, state: "walk" };
  const hop = col.resolveSolidMove(jumper, 0, 12, [low], {
    target: { x: 0, y: -60 },
  });
  assert.equal(jumper.vaulting, true);
  assert.equal(hop.vaulted, true);
  const sprites = await h.importModule(`js/soldierAssets.js?v=${BUILD}`);
  assert.equal(sprites.getSoldierState(jumper), "vault");
  col.updateVault(jumper, 0.2);
  assert.equal(jumper.vaulting, true);
  assert.ok(jumper.y < 48, "vault should carry the soldier across the piece");
});

test("living friendlies stay fully opaque every animation frame", async () => {
  const h = createHarness();
  const sprites = await h.importModule(`js/soldierAssets.js?v=${BUILD}`);
  await sprites.preloadSoldierAssets();
  const actor = {
    x: 0,
    y: 0,
    hp: 100,
    maxHp: 100,
    state: "walk",
    targetX: 80,
    targetY: 40,
    facingX: 1,
    facingY: 0,
    dead: false,
    downed: false,
  };
  const ctx = h.document.createElement("canvas").getContext("2d");
  for (let i = 0; i < 36; i++) {
    h.frame(40);
    const before = h.metrics.drawImages.length;
    sprites.drawSoldier(ctx, actor, { team: "player", alpha: 1 });
    assert.ok(
      h.metrics.drawImages.length > before,
      "alive soldiers must draw a sprite every frame",
    );
    sprites.drawSoldier(ctx, actor, { team: "ally", alpha: 1 });
  }
});

test("team XP formula levels and grants one skill point per level", async () => {
  const h = createHarness();
  const xp = await h.importModule(`js/teamProgress.js?v=${BUILD}`);
  assert.equal(xp.killXp("rifleman", 1), 18);
  assert.equal(xp.killXp("charger", 2), 34);
  assert.equal(xp.waveXp(1), 70);
  assert.equal(xp.xpForLevel(1), 110);
  assert.equal(xp.totalXpForLevel(2), 110);
  assert.equal(xp.levelFromXp(0), 1);
  assert.equal(xp.levelFromXp(109), 1);
  assert.equal(xp.levelFromXp(110), 2);
  assert.equal(xp.skillPointsFromLevel(1), 0);
  assert.equal(xp.skillPointsFromLevel(4), 3);
  const state = xp.grantXp(110);
  assert.equal(state.level, 2);
  assert.equal(state.unspent, 1);
});

test("wave segments release packs instead of dumping the roster", async () => {
  const h = createHarness();
  const waves = await h.importModule(`js/waveSegments.js?v=${BUILD}`);
  const roster = Array.from({ length: 9 }, (_, i) => ({
    spawnTimer: 0.2,
    pendingSegment: false,
    dead: false,
    deathTimer: 0,
    deathDuration: 0.8,
  }));
  const director = waves.segmentWave(roster, {
    packSize: 3,
    interval: 8,
    firstDelay: 0.5,
  });
  assert.equal(director.packs, 3);
  assert.equal(roster.filter((e) => e.pendingSegment).length, 6);
  assert.ok(roster.slice(0, 3).every((e) => e.spawnTimer >= 0.5));
  waves.updateWaveSegments(director, 8, roster);
  assert.equal(director.released, 2);
  assert.equal(roster.filter((e) => e.pendingSegment).length, 3);
  roster.forEach((e) => {
    e.dead = true;
    e.deathTimer = 1;
    e.pendingSegment = false;
  });
  assert.equal(waves.waveFullyCleared(roster, director), true);
});

test("armor modifiers trade defense, hit chance, and movement speed", async () => {
  const h = createHarness();
  const armor = await h.importModule(`js/armor.js?v=${BUILD}`);
  const light = armor.applyArmorMods(
    { defense: 50, accuracy: 6, speed: 250 },
    "light",
  );
  const heavy = armor.applyArmorMods(
    { defense: 50, accuracy: 6, speed: 250 },
    "heavy",
  );
  const fortress = armor.applyArmorMods(
    { defense: 50, accuracy: 6, speed: 250 },
    "fortress",
  );
  assert.ok(light.speed > 250 && light.defense < 50 && light.accuracy > 6);
  assert.ok(heavy.defense > 50 && heavy.speed < 250 && heavy.accuracy < 6);
  assert.ok(fortress.defense > heavy.defense && fortress.speed < heavy.speed);
  const desc = armor.describeArmorStats("assault");
  assert.equal(desc.defenseDelta, -10);
  assert.equal(desc.hitDelta, 3);
  assert.equal(desc.speedDelta, 25);
});

test("charger uses its own sheet and charges through cover to melee", async () => {
  const h = createHarness();
  const charger = await h.importModule(`js/chargerEnemy.js?v=${BUILD}`);
  const enemies = await h.importModule(`js/enemyCore.js?v=${BUILD}`);
  const sheet = charger.getChargerSheet();
  assert.equal(sheet.file, "enemy-charger-melee-sheet.png");
  assert.equal(sheet.frameWidth, 160);
  assert.equal(sheet.frameHeight, 160);
  assert.equal(sheet.columns, 4);
  assert.equal(sheet.rows, 5);
  assert.equal(sheet.animations.idle.fps, 4);
  assert.equal(sheet.animations.run.fps, 10);
  assert.equal(sheet.animations.charge.fps, 12);
  assert.equal(sheet.animations.melee.fps, 12);
  assert.equal(sheet.animations.death.fps, 8);
  const png = readFileSync(resolve("assets/generated/enemies", sheet.file));
  assert.equal(png[25], 6, "charger sheet must be an RGBA PNG");
  assert.ok(png.length > 100000, "Rushblade atlas should be the Phone Art sheet");
  const manifest = JSON.parse(
    readFileSync(resolve("assets/generated/enemies/enemy-charger-melee.json"), "utf8"),
  );
  assert.equal(manifest.file, sheet.file);
  assert.deepEqual(manifest.states, ["idle", "run", "charge", "melee", "death"]);
  const roster = enemies.createBandits(1, { extraCount: 6, random: () => 0 });
  assert.ok(roster.some((e) => e.type === "charger"));
  const gore = roster.find((e) => e.type === "charger");
  gore.x = 0;
  gore.y = 0;
  gore.spawnTimer = 0;
  const marine = {
    x: 240,
    y: 0,
    hp: 90,
    maxHp: 90,
    defense: 20,
    dead: false,
    downed: false,
    isMarine: true,
    permanentDeath: true,
  };
  h.window.__battleMarines = [marine];
  h.window.__battleAllies = [];
  h.window.__battlePlayer = { x: 400, y: 400, hp: 100, dead: false, downed: false };
  charger.updateChargers([gore], 0.2, h.window.__battlePlayer, [], null);
  assert.equal(gore.combatTarget, marine);
  assert.ok(gore.x > 0, "charger should close distance");
  assert.ok(gore.charging || gore.combatState === "melee" || gore.combatState === "charge");
  charger.updateChargers([gore], 0.8, h.window.__battlePlayer, [], null);
  assert.ok(marine.hp < 90 || gore.combatState === "melee" || gore.meleeTimer > 0);
  const ctx = h.document.createElement("canvas").getContext("2d");
  assert.equal(charger.drawCharger(ctx, gore, { scale: 0.4 }), true);
});

test("skill tree grenade and marine mods are applied from spent nodes", async () => {
  const h = createHarness();
  const skills = await h.importModule(`js/skillTree.js?v=${BUILD}`);
  const base = skills.computeSkillMods({});
  assert.equal(base.grenades, false);
  assert.equal(base.marineSpawn, false);
  const owned = skills.computeSkillMods({
    "grenade.unlock": 1,
    "grenade.ally": 1,
    "grenade.frag": 1,
    "marine.hp": 1,
    "marine.accuracy": 1,
    "marine.reinforce": 1,
  });
  assert.equal(owned.grenades, true);
  assert.equal(owned.allyGrenades, true);
  assert.ok(owned.grenadeDamage > base.grenadeDamage);
  assert.equal(owned.marineSpawn, true);
  assert.equal(owned.marineSpawnInterval, 60);
  assert.equal(skills.isNodeUnlocked("grenade.ally", { "grenade.unlock": 1 }), true);
  assert.equal(skills.isNodeUnlocked("grenade.ally", {}), false);
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
        ...h.window.__battleMarines,
        ...h.window.__battleEnemies,
      ]) {
        assert.ok(
          Number.isFinite(actor.x) &&
            Number.isFinite(actor.y) &&
            Number.isFinite(actor.hp),
        );
        if (actor.enteredWorld !== false)
          assert.ok(
            actor.x >= -2300 &&
              actor.x <= 2300 &&
              actor.y >= -6600 &&
              actor.y <= 1900,
          );
      }
    }
    assert.equal(h.frames.length, 1);
  }
});

test("wartorn city plates load and dress the street sides", async () => {
  const h = createHarness();
  const city = await h.importModule(`js/wartornCity.js?v=${BUILD}`);
  assert.ok(city.playableStreetHalfWidth() >= 900);
  const dressing = city.createWartornDressing();
  assert.ok(dressing.buildings.length >= 12);
  assert.ok(dressing.rubble.length >= 12);
  assert.ok(
    dressing.buildings.every((item) => Math.abs(item.x) > dressing.road),
    "ruins stay off the playable street",
  );
  const ctx = h.document.createElement("canvas").getContext("2d");
  city.drawWartornAtmosphere(ctx, 390, 844);
  city.drawWartornDressing(
    ctx,
    (x, y) => [x * 0.25, y * 0.125],
    { minX: -2300, maxX: 2300, minY: -6600, maxY: 1900 },
    390,
    844,
    () => true,
  );
  await city.preloadWartornAssets();
});

test("unit collision blocks overlap and unsticks jammed pairs", async () => {
  const h = createHarness();
  const col = await h.importModule(`js/unitCollision.js?v=${BUILD}`);
  const cover = await h.importModule(`js/coverCollision.js?v=${BUILD}`);
  const a = { x: 0, y: 0, hp: 40, speed: 200, scale: 1 };
  const b = { x: 40, y: 0, hp: 40, speed: 180, scale: 1 };
  const blocked = col.resolveUnitMove(a, 20, 0, [a, b]);
  assert.ok(blocked.blocked, "units cannot walk through each other");
  assert.ok(blocked.x < 20);
  const beside = col.resolveUnitMove(a, 0, 30, [a, b]);
  assert.equal(beside.blocked, false, "units can stand beside each other");
  a.x = 0;
  a.y = 0;
  b.x = 1;
  b.y = 0;
  for (let i = 0; i < 12; i++) {
    if (!a.passThrough && !b.passThrough) {
      a.x = 0;
      b.x = 1;
    }
    col.unstickOverlappingUnits([a, b], 0.05);
  }
  assert.ok(
    Math.hypot(a.x - b.x, a.y - b.y) >= col.UNIT_RADIUS,
    "stuck pairs must separate",
  );
  assert.ok(
    a.passThrough > 0 || b.passThrough > 0,
    "one unit should briefly pass through after a jam",
  );
  const jumper = { x: 0, y: 0, hp: 40, vaulting: true };
  const hop = col.composeSolidAndUnitMove(
    { x: 12, y: 0, blocked: true, vaulted: true },
    jumper,
    [jumper, b],
  );
  assert.equal(hop.vaulted, true);
  assert.equal(cover.isCoverJumpable({ type: "low", theme: "sandbags" }), true);
});

test("wave enemies mix cover-users and exposed shooters", async () => {
  const h = createHarness();
  const stance = await h.importModule(`js/enemyStance.js?v=${BUILD}`);
  const enemies = await h.importModule(`js/enemyCore.js?v=${BUILD}`);
  const wave = enemies.createBandits(2, {
    random: () => 0.4,
    extraCount: 8,
    spawnView: { width: 390, height: 844, world: {} },
  });
  const coverUsers = wave.filter((e) => stance.seeksCover(e));
  const exposed = wave.filter((e) => e.coverBehavior === "exposed");
  assert.ok(coverUsers.length >= 2, "some hostiles should seek cover");
  assert.ok(exposed.length >= 1, "some hostiles should stand in the open");
  assert.ok(wave.every((e) => e.coverBehavior));
  const open = {
    x: 0,
    y: 0,
    coverBehavior: "exposed",
    weapon: { role: "assault" },
  };
  stance.applyExposedHold(open, { x: 400, y: 0 });
  assert.equal(open.cover, null);
  assert.equal(open.exposed, true);
  assert.ok(open.targetX < 400);
});

test("squad dialog is rate-limited and draws near speakers", async () => {
  const h = createHarness();
  const dialog = await h.importModule(`js/squadDialog.js?v=${BUILD}`);
  dialog.resetSquadDialog();
  const marine = {
    x: 10,
    y: 20,
    hp: 90,
    isMarine: true,
    dead: false,
    downed: false,
    calloutTimer: 0,
    dialogLock: 0,
  };
  const ally = {
    x: 40,
    y: 20,
    hp: 80,
    dead: false,
    downed: false,
    calloutTimer: 0,
    dialogLock: 0,
  };
  assert.equal(dialog.speak(marine, "Hold the curb."), true);
  assert.equal(dialog.speak(ally, "Covering."), false);
  dialog.resetSquadDialog();
  marine.calloutTimer = 0;
  marine.dialogLock = 0;
  const ctx = h.document.createElement("canvas").getContext("2d");
  dialog.speak(marine, "Contact front.");
  dialog.drawDialogBubbles(ctx, (x, y) => [x, y], [marine, ally]);
  assert.match(readFileSync("css/game.css", "utf8"), /#pause \{[\s\S]*right:/);
});
