import {
  facadeDoorPoints,
  doorExplodeSheet,
  doorBlownIdle,
  playableStreetHalfWidth,
} from "./wartornCity.js?v=20260908-132";
import { createHostileAt, doorHostileType } from "./enemyCore.js?v=20260908-132";
import { moveTowardTarget } from "./combatAI.js?v=20260908-132";

export const DOOR_EXPLODE_FRAMES = 8;
export const DOOR_EXPLODE_FRAME_W = 96;
export const DOOR_EXPLODE_FRAME_H = 128;
export const DOOR_EXPLODE_FPS = 12;
export const DOOR_EXPLODE_DURATION = DOOR_EXPLODE_FRAMES / DOOR_EXPLODE_FPS;
export const DOOR_SPAWN_LEAD = 0.33;

export const DOOR_SPAWN = {
  waveDelay: function (wave) {
    if (wave <= 1) return 8.5;
    if (wave <= 2) return 6.5;
    return 5;
  },
  interval: function (wave) {
    if (wave <= 1) return 16;
    if (wave <= 2) return 13;
    if (wave <= 3) return 11;
    return 9;
  },
  burst: function (wave, random) {
    random = random || Math.random;
    if (wave <= 1) return 1;
    if (wave <= 2) return random() > 0.65 ? 2 : 1;
    if (wave <= 3) return random() > 0.4 ? 2 : 1;
    return random() > 0.5 ? 3 : 2;
  },
  skipIfLive: function (wave) {
    return wave <= 1 ? 8 : 12;
  },
  maxLiveDoor: function (wave) {
    return wave <= 1 ? 2 : wave <= 3 ? 4 : 6;
  },
};

function ready(image) {
  return !!(image && image.complete && image.naturalWidth);
}

function punchedSheet() {
  var sheet = doorExplodeSheet;
  return (sheet && sheet.__punched) || sheet;
}

export function createFacadeDoorDirector() {
  return {
    timer: DOOR_SPAWN.waveDelay(1),
    wave: 1,
    lastDoorId: "",
    bursts: [],
    blown: [],
    spawned: 0,
  };
}

export function resetFacadeDoors(director, wave) {
  director = director || createFacadeDoorDirector();
  director.wave = wave || 1;
  director.timer = DOOR_SPAWN.waveDelay(director.wave);
  director.lastDoorId = "";
  director.bursts = [];
  director.blown = [];
  director.spawned = 0;
  return director;
}

function inPlay(e) {
  return !!(
    e &&
    !e.dead &&
    e.hp > 0 &&
    !e.pendingSegment &&
    (e.spawnTimer || 0) <= 0
  );
}

function livingCount(enemies) {
  var n = 0;
  (enemies || []).forEach(function (e) {
    if (inPlay(e)) n++;
  });
  return n;
}

function liveDoorCount(enemies) {
  var n = 0;
  (enemies || []).forEach(function (e) {
    if (inPlay(e) && e.fromDoor) n++;
  });
  return n;
}

function pickDoor(director, world, onScreen) {
  var doors = facadeDoorPoints();
  if (!doors.length) return null;
  var camY = world && world.cameraY != null ? world.cameraY : 0;
  var ranked = doors
    .filter(function (door) {
      return door.id !== director.lastDoorId;
    })
    .sort(function (a, b) {
      return Math.abs(a.y - camY) - Math.abs(b.y - camY);
    });
  var nearby = ranked.filter(function (door) {
    if (onScreen) return onScreen(door.doorX, door.doorY, 280);
    return Math.abs(door.y - camY) < 1400;
  });
  var pool = nearby.length ? nearby : ranked.slice(0, 4);
  return pool[0] || doors[0];
}

function startBurst(director, door, wave, random) {
  var count = DOOR_SPAWN.burst(wave, random);
  director.bursts.push({
    id: door.id,
    door: door,
    t: 0,
    duration: DOOR_EXPLODE_DURATION,
    spawned: false,
    count: count,
    done: false,
  });
  director.lastDoorId = door.id;
  director.timer = DOOR_SPAWN.interval(wave);
}

export function tryFacadeDoorBurst(director, opts) {
  opts = opts || {};
  var wave = opts.wave || director.wave || 1;
  var enemies = opts.enemies || [];
  if (!opts.force) {
    if (opts.waveState && opts.waveState !== "active") return null;
    if (livingCount(enemies) >= DOOR_SPAWN.skipIfLive(wave)) return null;
    if (liveDoorCount(enemies) >= DOOR_SPAWN.maxLiveDoor(wave)) return null;
  }
  var door = pickDoor(director, opts.world, opts.onScreen);
  if (!door) return null;
  startBurst(director, door, wave, opts.random);
  return door;
}

function spawnBurstHostiles(burst, opts) {
  var door = burst.door;
  var wave = opts.wave || 1;
  var random = opts.random || Math.random;
  var spawned = [];
  for (var i = 0; i < burst.count; i++) {
    var type = doorHostileType(wave, i, random);
    var enemy = createHostileAt(
      door.doorX + i * 12,
      door.doorY + (i - 1) * 18,
      type,
      {
        index: 20 + i,
        random: random,
        fromDoor: true,
        spawnTimer: 0.08 + i * 0.12,
        doorApproachX: door.approachX + (random() - 0.5) * 80,
        doorApproachY: door.approachY + (i - 1) * 36,
      },
    );
    spawned.push(enemy);
    if (opts.enemies) opts.enemies.push(enemy);
  }
  directorSpawned(opts.director, spawned.length);
  if (opts.rebuildLayers) opts.rebuildLayers();
  return spawned;
}

function directorSpawned(director, n) {
  if (director) director.spawned = (director.spawned || 0) + n;
}

export function updateDoorEgress(enemies, dt) {
  var road = playableStreetHalfWidth();
  (enemies || []).forEach(function (e) {
    if (!e || !e.doorEgress || e.dead || (e.spawnTimer || 0) > 0) return;
    e.targetX = e.doorApproachX;
    e.targetY = e.doorApproachY;
    e.combatState = "seeking";
    e.exposed = true;
    e.cover = null;
    moveTowardTarget(e, dt, 1.22);
    if (e.x > -road + 80) e.doorEgress = false;
  });
}

export function updateFacadeDoors(director, dt, opts) {
  opts = opts || {};
  if (!director) return director;
  director.wave = opts.wave || director.wave;
  if (opts.waveState === "active") director.timer -= dt;
  director.bursts.forEach(function (burst) {
    burst.t += dt;
    if (!burst.spawned && burst.t >= DOOR_SPAWN_LEAD) {
      burst.spawned = true;
      spawnBurstHostiles(burst, Object.assign({ director: director }, opts));
    }
    if (burst.t >= burst.duration) {
      burst.done = true;
      if (director.blown)
        director.blown.push({
          id: burst.door.id,
          door: burst.door,
        });
    }
  });
  director.bursts = director.bursts.filter(function (burst) {
    return !burst.done;
  });
  if (director.timer <= 0) tryFacadeDoorBurst(director, opts);
  updateDoorEgress(opts.enemies, dt);
  return director;
}

function explodeFrame(burst) {
  var t = Math.max(0, Math.min(0.999, burst.t / burst.duration));
  return (t * DOOR_EXPLODE_FRAMES) | 0;
}

function drawFallbackBurst(ctx, x, y, frame) {
  var flash = frame >= 2 && frame <= 5;
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = "#2a2420";
  ctx.fillRect(-11, -34, 22, 34);
  if (frame === 0) {
    ctx.fillStyle = "#4a3828";
    ctx.fillRect(-8, -30, 16, 30);
  } else if (flash) {
    ctx.globalAlpha = 0.85;
    ctx.fillStyle = frame === 4 ? "#ffd060" : "#f08a2a";
    ctx.beginPath();
    ctx.ellipse(0, -16, 14 + frame, 18, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#3a322c";
    ctx.fillRect(-18 + frame * 3, -22, 7, 5);
  } else {
    ctx.fillStyle = "#12100e";
    ctx.fillRect(-8, -30, 16, 30);
    ctx.globalAlpha = 0.28;
    ctx.fillStyle = "#6a6864";
    ctx.beginPath();
    ctx.ellipse(2, -28, 10, 14, 0.2, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

export function drawFacadeDoorBursts(ctx, iso, director, onScreen) {
  if (!ctx || !iso || !director) return 0;
  var sheet = punchedSheet();
  var drawn = 0;
  director.bursts.forEach(function (burst) {
    var door = burst.door;
    if (onScreen && !onScreen(door.doorX, door.doorY, 220)) return;
    var q = iso(door.doorX, door.doorY);
    var frame = explodeFrame(burst);
    if (ready(sheet)) {
      var fw = DOOR_EXPLODE_FRAME_W;
      var fh = DOOR_EXPLODE_FRAME_H;
      ctx.save();
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(sheet, frame * fw, 0, fw, fh, q[0] - 36, q[1] - 96, 72, 96);
      ctx.restore();
    } else drawFallbackBurst(ctx, q[0], q[1], frame);
    drawn++;
  });
  (director.blown || []).forEach(function (entry) {
    var door = entry.door;
    if (onScreen && !onScreen(door.doorX, door.doorY, 180)) return;
    var p = iso(door.doorX, door.doorY);
    if (ready(doorBlownIdle)) {
      ctx.save();
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(doorBlownIdle, p[0] - 36, p[1] - 96, 72, 96);
      ctx.restore();
      drawn++;
    }
  });
  return drawn;
}
