/* Tasteful suppression tracers, dirt kicks, and hit sparks. Mobile-capped. */

export const COMBAT_VFX = {
  maxLive: 22,
  maxSparks: 10,
  maxDust: 10,
  maxStreaks: 8,
  sparkLife: 0.12,
  dustLife: 0.28,
  streakLife: 0.16,
  pinDustChance: 0.55,
  coverSparkChance: 1,
  armorSparkChance: 0.85,
};

var fx = [];

export function resetCombatVfx() {
  fx.length = 0;
}

export function activeCombatVfx() {
  return fx;
}

function livingCount(kind) {
  var n = 0;
  for (var i = 0; i < fx.length; i++) if (fx[i].kind === kind) n++;
  return n;
}

function pushFx(entry) {
  if (fx.length >= COMBAT_VFX.maxLive) fx.shift();
  fx.push(entry);
  return entry;
}

function canSpawn(kind, cap) {
  return livingCount(kind) < cap && fx.length < COMBAT_VFX.maxLive;
}

export function spawnHitSpark(x, y, kind) {
  if (!canSpawn("spark", COMBAT_VFX.maxSparks)) return null;
  return pushFx({
    kind: "spark",
    x: x,
    y: y,
    t: 0,
    life: COMBAT_VFX.sparkLife,
    tone: kind === "armor" ? "armor" : "cover",
    ang: Math.random() * Math.PI,
  });
}

export function spawnDustKick(x, y, scale) {
  if (!canSpawn("dust", COMBAT_VFX.maxDust)) return null;
  return pushFx({
    kind: "dust",
    x: x + (Math.random() - 0.5) * 18,
    y: y + (Math.random() - 0.5) * 14,
    t: 0,
    life: COMBAT_VFX.dustLife,
    r: 5 + Math.random() * 5,
    scale: scale || 1,
  });
}

export function spawnSuppressStreak(from, to) {
  if (!from || !to || !canSpawn("streak", COMBAT_VFX.maxStreaks)) return null;
  return pushFx({
    kind: "streak",
    x: from.x,
    y: from.y,
    tx: to.x,
    ty: to.y,
    t: 0,
    life: COMBAT_VFX.streakLife,
  });
}

export function notifyShotImpact(from, to, opts) {
  opts = opts || {};
  if (!to) return 0;
  var n = 0;
  if (opts.hitCover && Math.random() <= COMBAT_VFX.coverSparkChance) {
    if (spawnHitSpark(to.x, to.y, "cover")) n++;
    if (spawnDustKick(to.x, to.y, 0.85)) n++;
  }
  if (opts.hitArmor && Math.random() <= COMBAT_VFX.armorSparkChance) {
    if (spawnHitSpark(to.x, to.y - 8, "armor")) n++;
  }
  return n;
}

export function notifySuppressionPin(origin, impact, victims) {
  var n = 0;
  if (origin && impact) {
    if (spawnSuppressStreak(origin, impact)) n++;
    if (spawnDustKick(impact.x, impact.y, 0.9)) n++;
  }
  (victims || []).forEach(function (v) {
    if (!v || v.dead || (v.suppressTimer || 0) <= 0) return;
    if (Math.random() > COMBAT_VFX.pinDustChance) return;
    if (spawnDustKick(v.x, v.y + 6, 1.05)) n++;
  });
  return n;
}

export function spawnWreckDetonation(x, y) {
  var n = 0;
  pushFx({
    kind: "boom",
    x: x,
    y: y,
    t: 0,
    life: 0.42,
  });
  n++;
  for (var i = 0; i < 5; i++) {
    var ang = (i / 5) * Math.PI * 2;
    if (spawnHitSpark(x + Math.cos(ang) * 22, y + Math.sin(ang) * 16, "cover"))
      n++;
    if (spawnDustKick(x + Math.cos(ang) * 28, y + Math.sin(ang) * 20, 1.2)) n++;
  }
  return n;
}

export function updateCombatVfx(dt) {
  for (var i = fx.length - 1; i >= 0; i--) {
    fx[i].t += dt;
    if (fx[i].t >= fx[i].life) fx.splice(i, 1);
  }
  return fx.length;
}

export function drawCombatVfx(ctx, iso) {
  if (!ctx || !iso) return 0;
  var drawn = 0;
  fx.forEach(function (p) {
    var u = Math.min(1, p.t / p.life);
    var q = iso(p.x, p.y);
    ctx.save();
    if (p.kind === "spark") {
      var flash = p.tone === "armor" ? "#ffe7a4" : "#f0c36a";
      ctx.globalAlpha = 1 - u;
      ctx.strokeStyle = flash;
      ctx.lineWidth = 1.4;
      ctx.shadowColor = flash;
      ctx.shadowBlur = 5;
      var len = 5 + (1 - u) * 6;
      ctx.beginPath();
      ctx.moveTo(q[0] - Math.cos(p.ang) * len, q[1] - Math.sin(p.ang) * len);
      ctx.lineTo(q[0] + Math.cos(p.ang) * len, q[1] + Math.sin(p.ang) * len);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(
        q[0] - Math.cos(p.ang + 1.2) * (len * 0.55),
        q[1] - Math.sin(p.ang + 1.2) * (len * 0.55),
      );
      ctx.lineTo(
        q[0] + Math.cos(p.ang + 1.2) * (len * 0.55),
        q[1] + Math.sin(p.ang + 1.2) * (len * 0.55),
      );
      ctx.stroke();
    } else if (p.kind === "dust") {
      ctx.globalAlpha = 0.42 * (1 - u);
      ctx.fillStyle = "#6b5c48";
      ctx.beginPath();
      ctx.ellipse(
        q[0],
        q[1] + 4,
        (p.r + u * 10) * (p.scale || 1),
        (p.r * 0.45 + u * 4) * (p.scale || 1),
        0,
        0,
        Math.PI * 2,
      );
      ctx.fill();
    } else if (p.kind === "streak") {
      var b = iso(p.tx, p.ty);
      var progress = Math.min(1, p.t / 0.08);
      var x = q[0] + (b[0] - q[0]) * progress;
      var y = q[1] + (b[1] - q[1]) * progress;
      var dx = b[0] - q[0];
      var dy = b[1] - q[1];
      var len = Math.hypot(dx, dy) || 1;
      ctx.globalAlpha = Math.max(0.28, 1 - u);
      ctx.strokeStyle = "#f3d27a";
      ctx.lineWidth = 2.1;
      ctx.lineCap = "round";
      ctx.shadowColor = "#f3d27a";
      ctx.shadowBlur = 6;
      ctx.beginPath();
      ctx.moveTo(x - (dx / len) * 32, y - (dy / len) * 32);
      ctx.lineTo(x, y);
      ctx.stroke();
    } else if (p.kind === "boom") {
      ctx.globalAlpha = 0.85 * (1 - u);
      ctx.strokeStyle = "#ffb14a";
      ctx.lineWidth = 2.6;
      ctx.beginPath();
      ctx.arc(q[0], q[1], 10 + u * 38, 0, Math.PI * 2);
      ctx.stroke();
      ctx.strokeStyle = "#ffe7a8";
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.arc(q[0], q[1], 5 + u * 22, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();
    drawn++;
  });
  return drawn;
}

export function isVisiblyPinned(actor) {
  return !!(
    actor &&
    (actor.suppressTimer || 0) > 0 &&
    (actor.suppressStacks || 0) >= 1
  );
}
