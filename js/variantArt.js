import { loadImage } from "./assets.js?v=20260908-133";

// Kit-locked Phone Art sheets from chore/enemy-variants-ripper-shield-medic.
// Isolated from combat imports so boot can preload without the VM graph.

export const VARIANT_SHEETS = {
  ripper: {
    file: "enemy-ripper-sheet.png",
    columns: 4,
    rows: 4,
    frameWidth: 160,
    frameHeight: 160,
    animations: {
      idle: { row: 0, frames: 4, fps: 6 },
      run: { row: 1, frames: 4, fps: 12 },
      meleeSwing: { row: 2, frames: 4, fps: 12 },
      death: { row: 3, frames: 4, fps: 8 },
    },
  },
  shield: {
    file: "enemy-shielded-thrall-sheet.png",
    columns: 4,
    rows: 5,
    frameWidth: 160,
    frameHeight: 160,
    animations: {
      idle: { row: 0, frames: 4, fps: 4 },
      run: { row: 1, frames: 4, fps: 10 },
      shieldBlock: { row: 2, frames: 4, fps: 6 },
      meleeSwing: { row: 3, frames: 4, fps: 12 },
      death: { row: 4, frames: 4, fps: 8 },
    },
  },
  medic: {
    file: "enemy-medic-thrall-sheet.png",
    columns: 4,
    rows: 4,
    frameWidth: 160,
    frameHeight: 160,
    animations: {
      idle: { row: 0, frames: 4, fps: 4 },
      run: { row: 1, frames: 4, fps: 10 },
      heal: { row: 2, frames: 4, fps: 8 },
      death: { row: 3, frames: 4, fps: 8 },
    },
  },
};

const variantSources = {};
Object.keys(VARIANT_SHEETS).forEach(function (type) {
  var image = new Image();
  image.src =
    "./assets/generated/enemies/" + VARIANT_SHEETS[type].file + "?v=20260908-133";
  variantSources[type] = image;
});

export function preloadVariantAssets(onProgress) {
  onProgress = onProgress || function () {};
  onProgress(0.2, "LOADING VARIANT THRALLS");
  return Promise.all(
    Object.keys(variantSources).map(function (type) {
      return loadImage(variantSources[type]);
    }),
  ).then(function (imgs) {
    onProgress(1, "VARIANT THRALLS READY");
    if (
      imgs.some(function (img) {
        return !img;
      })
    )
      throw new Error("Variant thrall sheets are not ready");
    return variantSources;
  });
}

function nowMs() {
  return typeof performance !== "undefined" && performance.now
    ? performance.now()
    : Date.now();
}

function variantAnimState(e) {
  if (e.dead || e.hp <= 0) return "death";
  if (e.type === "medic" && (e.healing || (e.healFlash || 0) > 0)) return "heal";
  if ((e.meleeTimer || 0) > 0.12 || e.combatState === "melee") return "meleeSwing";
  if (e.type === "shield" && e.shieldUp && !e.charging) {
    var movingShield =
      Math.hypot((e.targetX || e.x) - e.x, (e.targetY || e.y) - e.y) > 10;
    return movingShield ? "run" : "shieldBlock";
  }
  if (Math.hypot((e.targetX || e.x) - e.x, (e.targetY || e.y) - e.y) > 10)
    return "run";
  if (e.charging || e.combatState === "charge") return "run";
  return "idle";
}

export function drawOfficialVariant(ctx, e, options) {
  var spec = VARIANT_SHEETS[e.type];
  var source = variantSources[e.type];
  if (!spec || !source || !source.complete || !source.naturalWidth) return false;
  options = options || {};
  var state = variantAnimState(e);
  var anim = spec.animations[state] || spec.animations.idle;
  var now = nowMs();
  if (e.__variantState !== state) {
    e.__variantState = state;
    e.__variantStart = now;
  }
  var elapsed = Math.max(0, (now - (e.__variantStart || now)) / 1000);
  var frame;
  if (state === "death") {
    var progress = Math.min(
      0.999,
      (e.deathTimer || 0) / Math.max(0.01, e.deathDuration || 0.8),
    );
    frame = Math.min(anim.frames - 1, Math.floor(progress * anim.frames));
  } else {
    frame = Math.floor(elapsed * anim.fps) % anim.frames;
  }
  var fw = spec.frameWidth,
    fh = spec.frameHeight,
    scale = (options.scale == null ? 0.5 : options.scale * 1.65) * (e.scale || 1),
    dw = fw * scale,
    dh = fh * scale,
    flip = (e.facingX || 0) < 0 ? -1 : 1;
  ctx.save();
  ctx.translate(options.x || 0, options.y || 0);
  ctx.fillStyle = "#0007";
  ctx.beginPath();
  ctx.ellipse(0, 3, dw * 0.22, dh * 0.05, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.scale(flip, 1);
  ctx.drawImage(
    source,
    frame * fw,
    anim.row * fh,
    fw,
    fh,
    -dw * 0.5,
    -dh * 0.88,
    dw,
    dh,
  );
  ctx.restore();
  return true;
}
