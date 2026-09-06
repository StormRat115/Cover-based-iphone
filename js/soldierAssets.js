import { loadImage } from "./assets.js?v=20260906-95";
export const friendlyAtlasSource = new Image();
friendlyAtlasSource.src =
  "./assets/generated/soldier/player-ally-atlas.png?v=20260906-88";
export const soldierSource = new Image();
soldierSource.src =
  "./assets/EE4CA451-8D37-42A3-9F54-ED1930481CF9.png?v=20260906-88";
export const enemySource = new Image();
enemySource.src =
  "./assets/198C101B-E186-4852-A270-3F04D83451ED.png?v=20260906-88";
export const deathSource = new Image();
deathSource.src = "./assets/soldier_death_sheet.png?v=20260906-88";
export const vaultSheetSource = new Image();
vaultSheetSource.src =
  "./assets/generated/soldier/vault-sheet.png?v=20260906-88";

const ENEMY_MONSTER_SHEET_WIDTH = 1536,
  ENEMY_MONSTER_SHEET_HEIGHT = 1022,
  ENEMY_MONSTER_FRAME_WIDTH = 256,
  ENEMY_MONSTER_FRAME_HEIGHT = 146,
  ENEMY_MONSTER_FRAMES = 6;
const ENEMY_MONSTER_ROWS = {
  idle: 0,
  run: 1,
  lowCover: 2,
  tallCover: 3,
  shoot: 4,
  hit: 5,
  death: 6,
};
const ENEMY_MONSTER_FILES = {
  rifleman: "enemy-ashfang-rifleman-sheet.png",
  shotgunner: "enemy-mawbreaker-breacher-sheet.png",
  heavy: "enemy-ironhide-heavy-sheet.png",
  sniper: "enemy-paleeye-stalker-sheet.png",
};
const enemyMonsterSources = Object.fromEntries(
  Object.entries(ENEMY_MONSTER_FILES).map(function ([type, file]) {
    const image = new Image();
    image.src = "./assets/generated/enemies/" + file + "?v=20260906-88";
    return [type, image];
  }),
);

const SOURCE_W = 1448,
  SOURCE_H = 1086,
  CELL = 180,
  COLS = 8;
const DEATH_FRAMES = 6,
  DEATH_FPS = 8,
  DEATH_DURATION = (DEATH_FRAMES - 1) / DEATH_FPS,
  DEATH_SCALE = 0.62;
let runtimeAtlas = null,
  runtimeEnemyAtlas = null,
  runtimeVaultSheet = null;
const FRAME_BOXES = {
  idle: [
    [200, 0, 120, 165],
    [333, 0, 120, 165],
    [472, 0, 120, 165],
    [614, 0, 120, 165],
    [762, 0, 120, 165],
  ],
  run: [
    [174, 165, 150, 170],
    [320, 165, 150, 170],
    [466, 165, 150, 170],
    [612, 165, 150, 170],
    [758, 165, 150, 170],
    [904, 165, 150, 170],
    [1050, 165, 150, 170],
    [1196, 165, 152, 170],
  ],
  lowCover: [
    [174, 335, 150, 135],
    [324, 335, 150, 135],
    [474, 335, 150, 135],
    [624, 335, 150, 135],
    [774, 335, 150, 135],
    [924, 335, 150, 135],
    [1074, 335, 150, 135],
  ],
  tallCover: [
    [184, 470, 130, 160],
    [334, 470, 130, 160],
    [484, 470, 130, 160],
    [634, 470, 130, 160],
    [784, 470, 130, 160],
    [924, 470, 130, 160],
    [1064, 470, 130, 160],
  ],
  shoot: [
    [180, 630, 145, 155],
    [330, 630, 145, 155],
    [480, 630, 145, 155],
    [630, 630, 160, 155],
    [780, 630, 175, 155],
    [940, 630, 185, 155],
    [1100, 630, 240, 155],
  ],
  crouchShoot: [
    [180, 785, 165, 125],
    [340, 785, 180, 125],
    [520, 785, 165, 125],
    [680, 785, 205, 125],
    [855, 785, 205, 125],
    [1020, 785, 235, 125],
  ],
  standShoot: [
    [190, 910, 150, 176],
    [350, 910, 150, 176],
    [510, 910, 160, 176],
    [675, 910, 210, 176],
    [875, 910, 285, 176],
  ],
};
const ENEMY_FRAME_BOXES = {
  idle: [
    [170, 0, 160, 180],
    [320, 0, 160, 180],
    [475, 0, 155, 180],
    [625, 0, 155, 180],
    [780, 0, 160, 180],
  ],
  run: [
    [145, 180, 190, 185],
    [325, 180, 180, 185],
    [475, 180, 180, 185],
    [625, 180, 180, 185],
    [780, 180, 180, 185],
    [930, 180, 180, 185],
    [1080, 180, 180, 185],
    [1230, 180, 200, 185],
  ],
  lowCover: [
    [150, 365, 175, 130],
    [305, 365, 170, 130],
    [460, 365, 170, 130],
    [615, 365, 170, 130],
    [770, 365, 170, 130],
    [925, 365, 170, 130],
    [1080, 365, 175, 130],
  ],
  tallCover: [
    [160, 490, 150, 180],
    [315, 490, 150, 180],
    [470, 490, 155, 180],
    [625, 490, 155, 180],
    [780, 490, 155, 180],
    [935, 490, 155, 180],
    [1090, 490, 160, 180],
  ],
  shoot: [
    [170, 655, 160, 160],
    [325, 655, 160, 160],
    [480, 655, 160, 160],
    [635, 655, 160, 160],
    [790, 655, 160, 160],
    [945, 655, 160, 160],
    [1100, 655, 160, 160],
  ],
  crouchShoot: [
    [170, 810, 170, 120],
    [340, 810, 170, 120],
    [510, 810, 170, 120],
    [680, 810, 170, 120],
    [850, 810, 170, 120],
    [1020, 810, 170, 120],
  ],
  standShoot: [
    [170, 928, 170, 158],
    [340, 928, 170, 158],
    [510, 928, 170, 158],
    [680, 928, 170, 158],
    [850, 928, 170, 158],
  ],
};
const FRIENDLY_CELL = 160;
const FRIENDLY_COLS = 4;
const FRIENDLY_ROWS = {
  idle: 0,
  run: 1,
  tallCover: 2,
  lowCover: 3,
  standShoot: 4,
  crouchShoot: 5,
  death: 6,
  shoot: 4,
  vault: 1,
};
const FRIENDLY_FPS = {
  idle: 3.2,
  run: 9,
  tallCover: 3,
  lowCover: 3,
  standShoot: 10,
  crouchShoot: 10,
  shoot: 10,
  death: 7,
  vault: 10,
};
const VAULT_COLS = 4;
const VAULT_CELL = 168;
let runtimeFriendlyAtlas = null;
const ROWS = {
  idle: 0,
  run: 1,
  lowCover: 2,
  tallCover: 3,
  shoot: 4,
  crouchShoot: 5,
  standShoot: 6,
};
const FPS = {
  // Snappier cycles; short sheets still loop cleanly with reduced blend.
  idle: 3.5,
  run: 9,
  lowCover: 3.0,
  tallCover: 3.0,
  shoot: 11,
  crouchShoot: 10,
  standShoot: 10,
};
const LOOP_STATES = {
  idle: true,
  run: true,
  lowCover: true,
  tallCover: true,
  shoot: true,
  crouchShoot: true,
  standShoot: true,
};
const STATE_HOLD_MS = {
  idle: 170,
  run: 140,
  lowCover: 200,
  tallCover: 200,
  shoot: 110,
  crouchShoot: 110,
  standShoot: 110,
  vault: 70,
  death: 99999,
};
function nowMs() {
  return typeof performance !== "undefined" && performance.now
    ? performance.now()
    : Date.now();
}

/** Snap milky/soft atlas pixels to binary alpha and zero leftover RGB. */
export function hardenSheetAlpha(source, cut) {
  if (!source || !(source.naturalWidth || source.width)) return source;
  cut = cut == null ? 40 : cut;
  try {
    var c = document.createElement("canvas");
    c.width = source.naturalWidth || source.width;
    c.height = source.naturalHeight || source.height;
    if (!c.width || !c.height) return source;
    var g = c.getContext("2d", { willReadFrequently: true });
    if (!g || typeof g.getImageData !== "function") return source;
    g.clearRect(0, 0, c.width, c.height);
    g.drawImage(source, 0, 0);
    var img = g.getImageData(0, 0, c.width, c.height);
    if (!img || !img.data) return source;
    var d = img.data;
    for (var i = 0; i < d.length; i += 4) {
      if (d[i + 3] < cut) {
        d[i] = 0;
        d[i + 1] = 0;
        d[i + 2] = 0;
        d[i + 3] = 0;
      } else {
        // Lift dark body pixels so they read as solid figures on asphalt.
        d[i] = Math.min(255, Math.round(d[i] * 1.62 + 30));
        d[i + 1] = Math.min(255, Math.round(d[i + 1] * 1.62 + 30));
        d[i + 2] = Math.min(255, Math.round(d[i + 2] * 1.62 + 30));
        d[i + 3] = 255;
      }
    }
    g.putImageData(img, 0, 0);
    return c;
  } catch (err) {
    return source;
  }
}

export function isLiveFriendly(actor, team) {
  return !!(
    actor &&
    team !== "enemy" &&
    !zeroHealth(actor) &&
    !actor.downed
  );
}
function buildAtlas(source, boxes) {
  var c = document.createElement("canvas");
  c.width = COLS * CELL;
  c.height = 7 * CELL;
  var g = c.getContext("2d");
  if (!g) throw new Error("2D canvas unavailable");
  var sx = source.naturalWidth / SOURCE_W,
    sy = source.naturalHeight / SOURCE_H;
  Object.keys(ROWS).forEach(function (state) {
    var row = ROWS[state],
      frames = boxes[state];
    frames.forEach(function (b, col) {
      var x = b[0] * sx,
        y = b[1] * sy,
        w = b[2] * sx,
        h = b[3] * sy,
        maxW = 172,
        maxH = 172,
        fit = Math.min(1, maxW / w, maxH / h),
        dw = w * fit,
        dh = h * fit,
        dx = col * CELL + (CELL - dw) / 2,
        dy = row * CELL + CELL - dh;
      g.clearRect(col * CELL, row * CELL, CELL, CELL);
      g.drawImage(source, x, y, w, h, dx, dy, dw, dh);
    });
  });
  return c;
}
export function preloadSoldierAssets(onProgress) {
  onProgress = onProgress || function () {};
  onProgress(0.1, "LOADING CHARACTER ANIMATION ATLASES");
  return Promise.all([
    loadImage(friendlyAtlasSource),
    loadImage(soldierSource),
    loadImage(enemySource),
    loadImage(deathSource),
    loadImage(vaultSheetSource),
    ...Object.values(enemyMonsterSources).map(function (image) {
      return loadImage(image);
    }),
  ]).then(function (imgs) {
    onProgress(0.68, "BUILDING CHARACTER ANIMATIONS");
    if (imgs.some((image) => !image))
      throw new Error("Character images are not ready");
    runtimeFriendlyAtlas = hardenSheetAlpha(friendlyAtlasSource) || friendlyAtlasSource;
    runtimeVaultSheet = hardenSheetAlpha(vaultSheetSource) || vaultSheetSource;
    // Legacy crop atlas kept as fallback; enemies still use monster atlas path.
    const soldierAtlas = buildAtlas(soldierSource, FRAME_BOXES);
    const monsterAtlas = buildAtlas(enemySource, ENEMY_FRAME_BOXES);
    runtimeAtlas = runtimeFriendlyAtlas || soldierAtlas;
    runtimeEnemyAtlas = monsterAtlas;
    onProgress(1, "SOLDIERS + MONSTERS READY");
    return { soldierAtlas: runtimeAtlas, monsterAtlas };
  });
}
function vaultSheet() {
  return runtimeVaultSheet || vaultSheetSource;
}

function vaultFrame(actor) {
  var u = actor && actor.vaulting ? Math.min(0.999, (actor.vaultT || 0) / 0.46) : 0;
  var col = u < 0.22 ? 0 : u < 0.5 ? 1 : u < 0.78 ? 2 : 3;
  var sheet = vaultSheet();
  var cellW =
    sheet.naturalWidth > 0
      ? Math.round(sheet.naturalWidth / VAULT_COLS)
      : sheet.width
        ? Math.round(sheet.width / VAULT_COLS)
        : VAULT_CELL;
  var cellH =
    sheet.naturalHeight > 0
      ? sheet.naturalHeight
      : sheet.height || VAULT_CELL;
  return { col: col, nextCol: col, blend: 0, row: 0, w: cellW, h: cellH, state: "vault" };
}
function moving(actor) {
  if (!actor) return false;
  if (actor.vaulting || actor.state === "vault") return true;
  if (actor.state === "walk" || actor.state === "run") return true;
  if (typeof actor.targetX === "number" && typeof actor.targetY === "number")
    return Math.hypot(actor.targetX - actor.x, actor.targetY - actor.y) > 8;
  return false;
}
function shooting(actor) {
  return !!(
    actor &&
    ((actor.muzzle && actor.muzzle > 0) ||
      (actor.shootTimer && actor.shootTimer > 0) ||
      actor.state === "shoot")
  );
}
function lowCover(actor) {
  return !!(actor && actor.cover && actor.cover.type === "low");
}
function peekingFromCover(actor) {
  return !!(
    actor &&
    actor.cover &&
    (actor.exposed ||
      actor.combatState === "exposed" ||
      actor.combatState === "peeking" ||
      (actor.peek && actor.peek > 0))
  );
}
export function coverPlantOffset(actor) {
  if (!actor || !actor.cover || actor.dead || actor.downed)
    return { x: 0, y: 0, squat: 0 };
  var c = actor.cover,
    dx = c.x - actor.x,
    dy = c.y - actor.y,
    dist = Math.hypot(dx, dy),
    reach = Math.max(c.w, c.h) * 0.7 + 46;
  if (dist > reach) return { x: 0, y: 0, squat: 0 };
  var len = dist || 1,
    sx = (dx - dy) / len,
    sy = (dx + dy) / len,
    peeking = peekingFromCover(actor),
    low = lowCover(actor),
    pull = peeking ? -6 : 8,
    squat = low ? (peeking ? 2 : 7) : peeking ? 0 : 3;
  return {
    x: sx * pull,
    y: sy * pull * 0.42 + squat,
    squat: squat,
  };
}
function zeroHealth(actor) {
  return !!(actor && (actor.hp <= 0 || actor.dead));
}
function desiredSoldierState(actor) {
  if (!actor) return "idle";
  if (zeroHealth(actor)) return "death";
  if (actor.vaulting || actor.state === "vault") return "vault";
  if (actor.downed) return "lowCover";
  if (shooting(actor)) {
    if (lowCover(actor)) return "crouchShoot";
    if (actor.cover) return "shoot";
    return "standShoot";
  }
  if (actor.cover) return lowCover(actor) ? "lowCover" : "tallCover";
  if (moving(actor)) return "run";
  return "idle";
}
export function getSoldierState(actor) {
  var desired = desiredSoldierState(actor),
    now = nowMs();
  if (!actor) return desired;
  if (!actor.__visualAnimState) {
    actor.__visualAnimState = desired;
    actor.__soldierStateStart = now;
    actor.__animLockUntil = now + (STATE_HOLD_MS[desired] || 180);
    return desired;
  }
  if (desired === actor.__visualAnimState) {
    // Refresh shoot locks while still firing so the cycle does not snap early.
    if (desired === "shoot" || desired === "crouchShoot" || desired === "standShoot")
      actor.__animLockUntil = Math.max(
        actor.__animLockUntil || 0,
        now + (STATE_HOLD_MS[desired] || 140),
      );
    return actor.__visualAnimState;
  }
  var urgent =
    desired === "death" ||
    desired === "vault" ||
    desired === "shoot" ||
    desired === "crouchShoot" ||
    desired === "standShoot" ||
    actor.__visualAnimState === "death";
  if (urgent || now >= (actor.__animLockUntil || 0)) {
    actor.__visualAnimState = desired;
    actor.__soldierStateStart = now;
    actor.__animLockUntil = now + (STATE_HOLD_MS[desired] || 180);
  }
  return actor.__visualAnimState;
}
function stableFacing(actor, state) {
  if (!actor) return 1;
  var now = nowMs(),
    fx = Number(actor.facingX) || 0,
    fy = Number(actor.facingY) || 0,
    screenDir = fx - fy,
    mag = Math.abs(screenDir),
    desired = screenDir < 0 ? -1 : 1,
    isShot =
      state === "shoot" || state === "crouchShoot" || state === "standShoot";
  if (actor.__visualFacing !== -1 && actor.__visualFacing !== 1)
    actor.__visualFacing = mag > 0.12 ? desired : 1;
  if (state === "death") return actor.__visualFacing;
  if (mag < 0.22) return actor.__visualFacing;
  if (isShot) {
    if (
      now >= (actor.__faceLockUntil || 0) &&
      desired !== actor.__visualFacing &&
      mag > 0.34
    )
      actor.__visualFacing = desired;
    actor.__faceLockUntil = now + 420;
    actor.__faceCandidate = desired;
    actor.__faceCandidateAt = now;
    return actor.__visualFacing;
  }
  if (now < (actor.__faceLockUntil || 0)) return actor.__visualFacing;
  if (desired === actor.__visualFacing) {
    actor.__faceCandidate = desired;
    actor.__faceCandidateAt = now;
    return actor.__visualFacing;
  }
  if (mag < 0.42) return actor.__visualFacing;
  if (actor.__faceCandidate !== desired) {
    actor.__faceCandidate = desired;
    actor.__faceCandidateAt = now;
    return actor.__visualFacing;
  }
  if (mag > 0.9 || now - (actor.__faceCandidateAt || now) > 190) {
    actor.__visualFacing = desired;
    actor.__faceLockUntil = now + 260;
  }
  return actor.__visualFacing;
}

/** Snap-ish frames: only a tiny ~15% crossfade near the end of each frame. */

function frameForFriendly(actor, state) {
  var rowKey = state === "shoot" ? "standShoot" : state;
  if (FRIENDLY_ROWS[rowKey] == null) rowKey = "idle";
  var row = FRIENDLY_ROWS[rowKey];
  var now = nowMs();
  if (actor.__lastSoldierState !== state) {
    actor.__lastSoldierState = state;
    actor.__soldierStateStart = now;
  }
  var elapsed = Math.max(0, (now - (actor.__soldierStateStart || now)) / 1000);
  var fps = FRIENDLY_FPS[rowKey] || 4;
  if (rowKey === "run" && actor) {
    var spd = 0;
    if (typeof actor.vx === "number" && typeof actor.vy === "number")
      spd = Math.hypot(actor.vx, actor.vy);
    fps = Math.max(6, Math.min(11, fps * (0.75 + 0.4 * Math.min(1, spd / 90 || spd || 0.5))));
  }
  var count = FRIENDLY_COLS;
  var phase = elapsed * fps;
  var col, next, blend;
  if (rowKey === "death") {
    phase = Math.min(count - 1.001, phase);
    col = Math.min(count - 1, Math.floor(phase));
    next = Math.min(count - 1, col + 1);
    blend = softenBlend(phase - col);
  } else {
    col = Math.floor(phase) % count;
    next = (col + 1) % count;
    // Light snap — opaque sheets look milky if blend stays mid-frame long.
    var frac = phase - Math.floor(phase);
    blend = frac < 0.18 ? 0 : frac > 0.82 ? 1 : softenBlend((frac - 0.18) / 0.64);
  }
  return {
    col: col,
    nextCol: next,
    blend: blend,
    row: row,
    w: FRIENDLY_CELL,
    h: FRIENDLY_CELL,
    state: rowKey,
  };
}

function softenBlend(blend) {
  var b = Math.max(0, Math.min(1, blend || 0));
  if (b < 0.85) return 0;
  return (b - 0.85) / 0.15;
}
function frameFor(actor, state, boxes) {
  var frames = boxes[state] || boxes.idle,
    row = ROWS[state] || 0,
    now = nowMs(),
    count = frames.length;
  if (actor.__lastSoldierState !== state) {
    actor.__lastSoldierState = state;
    actor.__soldierStateStart = now;
  }
  var elapsed = Math.max(0, (now - (actor.__soldierStateStart || now)) / 1000),
    fps = FPS[state] || 4;
  // Slightly pace run cycles to travel speed so feet do not skate.
  if (state === "run" && actor) {
    var spd = 0;
    if (typeof actor.vx === "number" && typeof actor.vy === "number")
      spd = Math.hypot(actor.vx, actor.vy);
    else if (
      typeof actor.targetX === "number" &&
      typeof actor.targetY === "number"
    )
      spd = Math.min(
        1,
        Math.hypot(actor.targetX - actor.x, actor.targetY - actor.y) / 140,
      );
    fps = Math.max(6, Math.min(11, fps * (0.75 + 0.4 * Math.min(1, spd / 90 || spd))));
  }
  var phase = elapsed * fps,
    col = Math.floor(phase) % count,
    next = (col + 1) % count,
    blend = softenBlend(phase - Math.floor(phase));
  if (!LOOP_STATES[state]) {
    col = Math.min(count - 1, Math.floor(phase));
    next = Math.min(count - 1, col + 1);
    blend = col === next ? 0 : softenBlend(Math.min(1, phase - col));
  }
  return {
    x: col * CELL,
    y: row * CELL,
    nextX: next * CELL,
    nextY: row * CELL,
    w: CELL,
    h: CELL,
    state: state,
    col: col,
    nextCol: next,
    blend: blend,
  };
}
function deathFrame(actor) {
  var now = nowMs();
  if (actor.__lastSoldierState !== "death") {
    actor.__lastSoldierState = "death";
    actor.__soldierStateStart = now;
  }
  var elapsed = Math.max(0, (now - (actor.__soldierStateStart || now)) / 1000),
    phase = Math.min(DEATH_FRAMES - 1.001, elapsed * DEATH_FPS),
    frame = Math.min(DEATH_FRAMES - 1, Math.floor(phase)),
    next = Math.min(DEATH_FRAMES - 1, frame + 1),
    blend = softenBlend(phase - frame);
  return { frame: frame, next: next, blend: blend, elapsed: elapsed };
}
function teamFilter(team) {
  if (team === "ally")
    return "sepia(.35) saturate(1.35) hue-rotate(155deg) brightness(1.05)";
  if (team === "marine")
    return "sepia(.28) saturate(1.2) hue-rotate(55deg) brightness(.94)";
  return "none";
}

export function getEnemyMonsterSheet(type) {
  const source = enemyMonsterSources[type];
  if (!source) return null;
  return {
    type: type,
    file: ENEMY_MONSTER_FILES[type],
    source: source,
    width: ENEMY_MONSTER_SHEET_WIDTH,
    height: ENEMY_MONSTER_SHEET_HEIGHT,
    frameWidth: ENEMY_MONSTER_FRAME_WIDTH,
    frameHeight: ENEMY_MONSTER_FRAME_HEIGHT,
    frames: ENEMY_MONSTER_FRAMES,
    rows: ENEMY_MONSTER_ROWS,
  };
}

function enemyMonsterState(actor, now) {
  if (zeroHealth(actor)) return "death";
  var hit = Math.max(0, actor.hit || 0),
    muzzle = Math.max(0, actor.muzzle || 0);
  if (hit > (actor.__monsterLastHit || 0) + 0.025)
    actor.__monsterHitUntil = now + 460;
  if (muzzle > (actor.__monsterLastMuzzle || 0) + 0.025)
    actor.__monsterShootUntil = now + 520;
  actor.__monsterLastHit = hit;
  actor.__monsterLastMuzzle = muzzle;
  var desired =
      now < (actor.__monsterHitUntil || 0)
        ? "hit"
        : now < (actor.__monsterShootUntil || 0)
          ? "shoot"
          : actor.cover
            ? lowCover(actor)
              ? "lowCover"
              : "tallCover"
            : moving(actor)
              ? "run"
              : "idle",
    urgent = desired === "hit" || desired === "shoot";
  if (!actor.__monsterVisualState) {
    actor.__monsterVisualState = desired;
    actor.__monsterStateStart = now;
    actor.__monsterStateLockUntil = now + 240;
  } else if (
    actor.__monsterVisualState !== desired &&
    (urgent || now >= (actor.__monsterStateLockUntil || 0))
  ) {
    actor.__monsterVisualState = desired;
    actor.__monsterStateStart = now;
    actor.__monsterStateLockUntil = now + (urgent ? 220 : 280);
  }
  return actor.__monsterVisualState;
}

function enemyMonsterFrame(actor, state, now) {
  var count = ENEMY_MONSTER_FRAMES;
  if (state === "death") {
    const duration = Math.max(0.01, actor.deathDuration || 0.8),
      progress = Math.min(0.999, Math.max(0, (actor.deathTimer || 0) / duration)),
      phase = progress * (count - 1),
      frame = Math.min(count - 1, Math.floor(phase)),
      next = Math.min(count - 1, frame + 1),
      blend = phase - frame;
    return {
      frame: frame,
      next: next,
      blend: softenBlend(blend),
    };
  }
  var stateStart = Number.isFinite(actor.__monsterStateStart)
      ? actor.__monsterStateStart
      : now,
    elapsed = Math.max(0, (now - stateStart) / 1000),
    fps =
      state === "run"
        ? 7.5
        : state === "shoot"
          ? 9
          : state === "hit"
            ? 8
            : state === "lowCover" || state === "tallCover"
              ? 3.0
              : 3.2,
    phase = elapsed * fps;
  if (state === "hit") {
    var hf = Math.min(count - 1, Math.floor(phase)),
      hn = Math.min(count - 1, hf + 1),
      hb = Math.min(1, phase - hf);
    return { frame: hf, next: hn, blend: softenBlend(hb) };
  }
  var frame = Math.floor(phase) % count,
    next = (frame + 1) % count,
    blend = phase - Math.floor(phase);
  return { frame: frame, next: next, blend: softenBlend(blend) };
}

function drawBlendedSheetFrame(
  ctx,
  source,
  frame,
  next,
  blend,
  row,
  frameW,
  frameH,
  dx,
  dy,
  dw,
  dh,
  baseAlpha,
  inset,
) {
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  var pad = Math.max(0, inset || 0),
    sx0 = frame * frameW + pad,
    sy0 = row * frameH + pad,
    sw = Math.max(1, frameW - pad * 2),
    sh = Math.max(1, frameH - pad * 2),
    a0 = baseAlpha * (1 - blend),
    a1 = baseAlpha * blend;
  if (a0 <= 0.02 && (a1 <= 0.02 || next === frame)) {
    ctx.globalAlpha = baseAlpha;
    ctx.drawImage(source, sx0, sy0, sw, sh, dx, dy, dw, dh);
  } else {
    if (a0 > 0.02) {
      ctx.globalAlpha = a0;
      ctx.drawImage(source, sx0, sy0, sw, sh, dx, dy, dw, dh);
    }
    if (a1 > 0.02 && next !== frame) {
      ctx.globalAlpha = a1;
      ctx.drawImage(
        source,
        next * frameW + pad,
        sy0,
        sw,
        sh,
        dx,
        dy,
        dw,
        dh,
      );
    }
  }
  ctx.globalAlpha = 1;
}

export function drawEnemyMonster(ctx, actor, options) {
  const sheet = getEnemyMonsterSheet(actor && actor.type),
    source = sheet && sheet.source;
  if (!source || !source.complete || !source.naturalWidth) return false;
  options = options || {};
  const now = nowMs(),
    state = enemyMonsterState(actor, now),
    anim = enemyMonsterFrame(actor, state, now),
    row = ENEMY_MONSTER_ROWS[state],
    baseScale = options.scale == null ? 0.38 : options.scale * 1.27,
    scale = baseScale * (actor.scale || 1),
    dw = ENEMY_MONSTER_FRAME_WIDTH * scale,
    dh = ENEMY_MONSTER_FRAME_HEIGHT * scale,
    flip = stableFacing(actor, state),
    baseAlpha = options.alpha == null ? 1 : options.alpha;
  var plant = coverPlantOffset(actor);
  ctx.save();
  ctx.translate(
    (options.x || 0) + plant.x,
    (options.y || 0) + plant.y - (actor && actor.vaultZ ? actor.vaultZ : 0),
  );
  ctx.globalAlpha = baseAlpha;
  ctx.fillStyle = "#0007";
  ctx.beginPath();
  ctx.ellipse(
    0,
    2,
    Math.max(8, dw * 0.22),
    Math.max(2, dh * 0.05),
    0,
    0,
    Math.PI * 2,
  );
  ctx.fill();
  ctx.scale(flip, 1);
  drawBlendedSheetFrame(
    ctx,
    source,
    anim.frame,
    anim.next,
    anim.blend,
    row,
    ENEMY_MONSTER_FRAME_WIDTH,
    ENEMY_MONSTER_FRAME_HEIGHT,
    -dw * 0.5,
    -dh + (state === "lowCover" ? 4 : state === "tallCover" ? 2 : 0),
    dw,
    dh,
    baseAlpha,
    5,
  );
  ctx.restore();
  return true;
}
function drawDeath(ctx, actor, options, scale, flip) {
  if (!deathSource.complete || !deathSource.naturalWidth) return false;
  var d = deathFrame(actor),
    sw = deathSource.naturalWidth / DEATH_FRAMES,
    sh = deathSource.naturalHeight,
    deathScale = scale * DEATH_SCALE,
    dw = sw * deathScale,
    dh = sh * deathScale,
    baseAlpha = options.alpha == null ? 1 : options.alpha;
  ctx.save();
  ctx.scale(flip, 1);
  ctx.filter = teamFilter(options.team || "player");
  drawBlendedSheetFrame(
    ctx,
    deathSource,
    d.frame,
    d.next,
    d.blend,
    0,
    sw,
    sh,
    -dw * 0.5,
    -dh,
    dw,
    dh,
    baseAlpha,
    5,
  );
  ctx.restore();
  return true;
}
export function drawSoldier(ctx, actor, options) {
  options = options || {};
  var team = options.team || "player",
    isEnemy = team === "enemy",
    boxes = isEnemy ? ENEMY_FRAME_BOXES : FRAME_BOXES,
    atlas = isEnemy ? runtimeEnemyAtlas : runtimeAtlas,
    state = options.state || getSoldierState(actor),
    baseScale = options.scale == null ? 0.28 : options.scale,
    scale = baseScale * (actor && actor.scale ? actor.scale : 1),
    flip = stableFacing(actor, state),
    bob = state === "run" ? Math.sin(nowMs() * 0.012) * 0.28 : 0,
    plant = coverPlantOffset(actor),
    enemyCorpse = false;
  var vaultLift = actor && actor.vaultZ ? actor.vaultZ : 0;
  ctx.save();
  ctx.translate(
    (options.x || 0) + plant.x,
    (options.y || 0) + bob + plant.y - vaultLift,
  );
  var liveFriendly = isLiveFriendly(actor, team);
  ctx.globalCompositeOperation = "source-over";
  ctx.filter = liveFriendly ? "none" : teamFilter(team);
  ctx.globalAlpha = liveFriendly ? 1 : options.alpha == null ? 1 : options.alpha;
  if (state === "death") {
    if (isEnemy) {
      state = "lowCover";
      enemyCorpse = true;
    } else if (!runtimeFriendlyAtlas && drawDeath(ctx, actor, options, scale, flip)) {
      ctx.restore();
      return;
    } else if (!runtimeFriendlyAtlas) state = "lowCover";
  }
  var vaultSrc = vaultSheet();
  var useVault =
      state === "vault" &&
      vaultSrc &&
      (vaultSrc.complete !== false) &&
      (vaultSrc.naturalWidth > 0 || vaultSrc.width > 0);
  var useFriendly = !isEnemy && runtimeFriendlyAtlas;
  if (useFriendly) scale *= 1.15;
  var r = useVault
      ? vaultFrame(actor)
      : useFriendly
        ? frameForFriendly(actor, state === "vault" ? "run" : state)
        : frameFor(actor, state === "vault" ? "run" : state, boxes);
  var cellW = useVault ? r.w : useFriendly ? FRIENDLY_CELL : CELL;
  var cellH = useVault ? r.h : useFriendly ? FRIENDLY_CELL : r.h;
  var dw = cellW * scale * (useVault ? 1.08 : 1);
  var dh = cellH * scale * (useVault ? 1.08 : 1);
  ctx.fillStyle = "#0007";
  ctx.beginPath();
  ctx.ellipse(
    0,
    2,
    Math.max(7, dw * 0.22),
    Math.max(2, dh * 0.05),
    0,
    0,
    Math.PI * 2,
  );
  ctx.fill();
  if (enemyCorpse) {
    ctx.translate(0, 4);
    ctx.scale(1, 0.62);
    ctx.globalAlpha *= 0.82;
  }
  ctx.scale(flip, 1);
  // Live friendlies: no filter, no blend crossfade, alpha forced to 1.
  // Verified: atlas alpha is already binary, but leftover RGB + vault mid-alpha
  // + cover overdraw made soldiers look milky. Harden + single opaque blit.
  ctx.filter = liveFriendly ? "none" : teamFilter(team);
  ctx.imageSmoothingEnabled = true;
  var drawAtlas = useVault
    ? vaultSrc
    : useFriendly
      ? runtimeFriendlyAtlas
      : atlas;
  if (drawAtlas) {
    var baseAlpha = liveFriendly ? 1 : options.alpha == null ? 1 : options.alpha;
    if (enemyCorpse) baseAlpha *= 0.82;
    if (liveFriendly) {
      ctx.globalAlpha = 1;
      ctx.filter = "none";
      ctx.globalCompositeOperation = "source-over";
      ctx.fillStyle =
        team === "ally" ? "#35566e" : team === "marine" ? "#4a5336" : "#58564e";
      ctx.beginPath();
      ctx.ellipse(0, -dh * 0.34, dw * 0.16, dh * 0.3, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.drawImage(
        drawAtlas,
        r.col * cellW,
        (useVault ? 0 : r.row) * cellH,
        cellW,
        cellH,
        -dw * 0.5,
        -dh +
          (state === "lowCover" || state === "crouchShoot"
            ? 5
            : state === "tallCover"
              ? 2
              : 0),
        dw,
        dh,
      );
    } else {
      drawBlendedSheetFrame(
        ctx,
        drawAtlas,
        r.col,
        r.nextCol,
        r.blend || 0,
        useVault ? 0 : useFriendly ? r.row : ROWS[r.state] || 0,
        cellW,
        cellH,
        -dw * 0.5,
        -dh +
          (state === "lowCover" || state === "crouchShoot"
            ? 5
            : state === "tallCover"
              ? 2
              : 0),
        dw,
        dh,
        baseAlpha,
      );
    }
  } else {
    ctx.filter = "none";
    ctx.fillStyle = isEnemy
      ? "#7a4a38"
      : team === "ally"
        ? "#477da8"
        : team === "marine"
          ? "#607247"
          : "#56646b";
    ctx.fillRect(-7, -26, 14, 24);
    ctx.fillStyle = isEnemy ? "#9b6a4e" : "#9b9d9a";
    ctx.beginPath();
    ctx.arc(0, -30, isEnemy ? 6 : 5, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}
export function getSoldierAtlasInfo() {
  return {
    sourceWidth: SOURCE_W,
    sourceHeight: SOURCE_H,
    cell: CELL,
    rows: ROWS,
    deathFrames: DEATH_FRAMES,
    deathDuration: DEATH_DURATION,
    deathScale: DEATH_SCALE,
    enemySource: "198C101B-E186-4852-A270-3F04D83451ED.png",
    enemyMonsterSheets: Object.assign({}, ENEMY_MONSTER_FILES),
    enemyMonsterFrame: {
      width: ENEMY_MONSTER_FRAME_WIDTH,
      height: ENEMY_MONSTER_FRAME_HEIGHT,
      columns: ENEMY_MONSTER_FRAMES,
      rows: ENEMY_MONSTER_ROWS,
    },
    frameCounts: {
      idle: 5,
      run: 8,
      lowCover: 7,
      tallCover: 7,
      shoot: 7,
      crouchShoot: 6,
      standShoot: 5,
      death: DEATH_FRAMES,
      vault: VAULT_COLS,
    },
    vaultSheet: "vault-sheet.png",
    vaultCell: VAULT_CELL,
  };
}
