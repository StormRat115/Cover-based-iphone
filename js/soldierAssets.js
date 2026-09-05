import { loadImage } from "./assets.js?v=20260905-62";
export const soldierSource = new Image();
soldierSource.src =
  "./assets/EE4CA451-8D37-42A3-9F54-ED1930481CF9.png?v=20260905-60";
export const enemySource = new Image();
enemySource.src =
  "./assets/198C101B-E186-4852-A270-3F04D83451ED.png?v=20260905-60";
export const deathSource = new Image();
deathSource.src = "./assets/soldier_death_sheet.png?v=20260905-60";

const SOURCE_W = 1448,
  SOURCE_H = 1086,
  CELL = 180,
  COLS = 8;
const DEATH_FRAMES = 6,
  DEATH_FPS = 8,
  DEATH_DURATION = (DEATH_FRAMES - 1) / DEATH_FPS,
  DEATH_SCALE = 0.62;
let runtimeAtlas = null,
  runtimeEnemyAtlas = null;
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
  idle: 3,
  run: 10,
  lowCover: 3,
  tallCover: 3,
  shoot: 14,
  crouchShoot: 13,
  standShoot: 13,
};
function nowMs() {
  return typeof performance !== "undefined" && performance.now
    ? performance.now()
    : Date.now();
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
    loadImage(soldierSource),
    loadImage(enemySource),
    loadImage(deathSource),
  ]).then(function (imgs) {
    onProgress(0.68, "BUILDING CHARACTER ANIMATIONS");
    if (imgs.some((image) => !image))
      throw new Error("Character images are not ready");
    // Publish both atlases together only after every source has decoded and both
    // canvases have been built. A partial atlas set cannot start the mission.
    const soldierAtlas = buildAtlas(soldierSource, FRAME_BOXES);
    const monsterAtlas = buildAtlas(enemySource, ENEMY_FRAME_BOXES);
    runtimeAtlas = soldierAtlas;
    runtimeEnemyAtlas = monsterAtlas;
    onProgress(1, "SOLDIERS + MONSTERS READY");
    return { soldierAtlas, monsterAtlas };
  });
}
function moving(actor) {
  if (!actor) return false;
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
function zeroHealth(actor) {
  return !!(actor && (actor.hp <= 0 || actor.dead));
}
export function getSoldierState(actor) {
  if (!actor) return "idle";
  if (zeroHealth(actor)) return "death";
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
function frameFor(actor, state, boxes) {
  var frames = boxes[state] || boxes.idle,
    row = ROWS[state] || 0,
    now = nowMs();
  if (actor.__lastSoldierState !== state) {
    actor.__lastSoldierState = state;
    actor.__soldierStateStart = now;
  }
  var elapsed = Math.max(0, (now - (actor.__soldierStateStart || now)) / 1000),
    fps = FPS[state] || 4,
    col = Math.min(
      frames.length - 1,
      Math.floor(elapsed * fps) % frames.length,
    );
  return {
    x: col * CELL,
    y: row * CELL,
    w: CELL,
    h: CELL,
    state: state,
    col: col,
  };
}
function deathFrame(actor) {
  var now = nowMs();
  if (actor.__lastSoldierState !== "death") {
    actor.__lastSoldierState = "death";
    actor.__soldierStateStart = now;
  }
  var elapsed = Math.max(0, (now - (actor.__soldierStateStart || now)) / 1000),
    frame = Math.min(DEATH_FRAMES - 1, Math.floor(elapsed * DEATH_FPS));
  return { frame: frame, elapsed: elapsed };
}
function teamFilter(team) {
  if (team === "ally")
    return "sepia(.35) saturate(1.35) hue-rotate(155deg) brightness(1.05)";
  return "none";
}
function drawDeath(ctx, actor, options, scale, flip) {
  if (!deathSource.complete || !deathSource.naturalWidth) return false;
  var d = deathFrame(actor),
    sw = deathSource.naturalWidth / DEATH_FRAMES,
    sh = deathSource.naturalHeight,
    deathScale = scale * DEATH_SCALE,
    dw = sw * deathScale,
    dh = sh * deathScale;
  ctx.save();
  ctx.scale(flip, 1);
  ctx.filter = teamFilter(options.team || "player");
  ctx.imageSmoothingEnabled = true;
  ctx.drawImage(deathSource, d.frame * sw, 0, sw, sh, -dw * 0.5, -dh, dw, dh);
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
    bob = state === "run" ? Math.sin(nowMs() * 0.018) * 0.65 : 0,
    enemyCorpse = false;
  ctx.save();
  ctx.translate(options.x || 0, (options.y || 0) + bob);
  ctx.globalAlpha = options.alpha == null ? 1 : options.alpha;
  if (state === "death") {
    if (isEnemy) {
      state = "lowCover";
      enemyCorpse = true;
    } else if (drawDeath(ctx, actor, options, scale, flip)) {
      ctx.restore();
      return;
    } else state = "lowCover";
  }
  var r = frameFor(actor, state, boxes),
    dw = r.w * scale,
    dh = r.h * scale;
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
  ctx.filter = teamFilter(team);
  ctx.imageSmoothingEnabled = true;
  if (atlas) {
    ctx.drawImage(atlas, r.x, r.y, r.w, r.h, -dw * 0.5, -dh, dw, dh);
  } else {
    ctx.filter = "none";
    ctx.fillStyle = isEnemy
      ? "#7a4a38"
      : team === "ally"
        ? "#477da8"
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
    frameCounts: {
      idle: 5,
      run: 8,
      lowCover: 7,
      tallCover: 7,
      shoot: 7,
      crouchShoot: 6,
      standShoot: 5,
      death: DEATH_FRAMES,
    },
  };
}
