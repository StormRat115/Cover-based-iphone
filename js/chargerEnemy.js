import { loadImage } from "./assets.js?v=20260906-95";
import { mitigateDamage, attackDamage } from "./combatStats.js?v=20260906-95";
import { faceThreat } from "./combatAI.js?v=20260906-95";

export const CHARGER_SHEET = {
  file: "enemy-charger-melee-sheet.png",
  manifest: "enemy-charger-melee.json",
  name: "Rushblade Charger",
  width: 640,
  height: 800,
  columns: 4,
  rows: 5,
  frameWidth: 160,
  frameHeight: 160,
  frames: 4,
  animations: {
    idle: { row: 0, frames: 4, fps: 4 },
    run: { row: 1, frames: 4, fps: 10 },
    charge: { row: 2, frames: 4, fps: 12 },
    melee: { row: 3, frames: 4, fps: 12 },
    death: { row: 4, frames: 4, fps: 8 },
  },
};

const chargerSource = new Image();
chargerSource.src =
  "./assets/generated/enemies/" + CHARGER_SHEET.file + "?v=20260906-88";

export function getChargerSheet() {
  return Object.assign({ source: chargerSource }, CHARGER_SHEET);
}

export function preloadChargerAssets(onProgress) {
  onProgress = onProgress || function () {};
  onProgress(0.2, "LOADING CHARGER");
  return loadImage(chargerSource).then(function (img) {
    onProgress(1, "CHARGER READY");
    if (!img) throw new Error("Charger sheet is not ready");
    return getChargerSheet();
  });
}

export function chargerWeapon() {
  return {
    id: "melee",
    name: "RUSHBLADE",
    short: "MELEE",
    damage: 28,
    range: 72,
    cooldown: 0.74,
    magazine: 99,
    reload: 0.2,
    accuracy: 10,
    spread: 0,
    pellets: 1,
    role: "breach",
    pressure: 9,
    ammo: 99,
    fireCooldown: 0,
    reloading: false,
  };
}

function valid(t) {
  return !!(t && !t.dead && !t.downed && t.hp > 0);
}

function roster() {
  var list = [];
  if (typeof window === "undefined") return list;
  (window.__battleMarines || []).forEach(function (m) {
    if (valid(m)) list.push(m);
  });
  (window.__battleAllies || []).forEach(function (a) {
    if (valid(a)) list.push(a);
  });
  if (valid(window.__battlePlayer)) list.push(window.__battlePlayer);
  var v = window.__supportVehicle;
  if (valid(v)) list.push(v);
  return list;
}

export function chooseChargeTarget(e) {
  var best = null,
    bestScore = -Infinity;
  roster().forEach(function (t) {
    var d = Math.hypot(t.x - e.x, t.y - e.y);
    var score = Math.max(0, 1600 - d);
    if (t.isMarine) score += 80;
    if (t === e.combatTarget) score += 24;
    if (d < 260) score += 90;
    if (score > bestScore) {
      bestScore = score;
      best = t;
    }
  });
  return best;
}

function slam(target, raw) {
  if (!valid(target)) return;
  var dealt = mitigateDamage(Math.max(6, raw), target.defense);
  target.hp = Math.max(0, target.hp - dealt);
  target.lastDamageTaken = dealt;
  target.hit = 0.28;
  target.timeSinceDamage = 0;
  if (target.hp > 0) return;
  target.hp = 0;
  if (target.permanentDeath) {
    target.dead = true;
    target.downed = false;
    target.deathTimer = 0;
    return;
  }
  if (target.triggerDowned) target.triggerDowned();
  else {
    target.downed = true;
    target.downTimer = 0;
  }
}

export function chargeToward(actor, dest, dt, speed) {
  var dx = dest.x - actor.x,
    dy = dest.y - actor.y,
    d = Math.hypot(dx, dy) || 1;
  actor.facingX = dx / d;
  actor.facingY = dy / d;
  var step = Math.min(d, speed * dt);
  actor.x += (dx / d) * step;
  actor.y += (dy / d) * step;
  actor.targetX = dest.x;
  actor.targetY = dest.y;
  return d <= 18;
}

export function updateChargers(enemies, dt, player, covers, spawnProjectile) {
  covers = covers;
  spawnProjectile = spawnProjectile;
  enemies.forEach(function (e) {
    if (e.type !== "charger" || e.dead) return;
    if (e.spawnTimer > 0) return;
    e.meleeCharge = true;
    e.cover = null;
    e.exposed = true;
    e.meleeTimer = Math.max(0, (e.meleeTimer || 0) - dt);
    e.chargeLock = Math.max(0, (e.chargeLock || 0) - dt);
    e.targetTimer = Math.max(0, (e.targetTimer || 0) - dt);
    if (!valid(e.combatTarget) || e.targetTimer <= 0) {
      e.combatTarget = chooseChargeTarget(e) || player;
      e.targetTimer = 0.55;
    }
    var threat = e.combatTarget || player;
    if (!valid(threat)) return;
    faceThreat(e, threat);
    var dist = Math.hypot(threat.x - e.x, threat.y - e.y);
    if (dist > 68) {
      if (dist < 520 || e.charging) {
        e.charging = true;
        e.combatState = "charge";
        e.chargeLock = 0.8;
        chargeToward(e, threat, dt, (e.speed || 255) * 1.55);
      } else {
        e.charging = false;
        e.combatState = "seeking";
        chargeToward(e, threat, dt, e.speed || 255);
      }
      dist = Math.hypot(threat.x - e.x, threat.y - e.y);
      if (dist > 68) return;
    }
    e.charging = false;
    e.combatState = "melee";
    if (e.meleeTimer <= 0) {
      e.meleeTimer = e.weapon.cooldown;
      e.muzzle = 0.16;
      slam(threat, attackDamage(e.weapon.damage, e.damageBonus || 0));
    }
  });
}

function nowMs() {
  return typeof performance !== "undefined" && performance.now
    ? performance.now()
    : Date.now();
}

function chargerState(actor) {
  if (actor.dead || actor.hp <= 0) return "death";
  if ((actor.meleeTimer || 0) > (actor.weapon.cooldown || 0.74) * 0.55) return "melee";
  if (actor.charging || actor.combatState === "charge") return "charge";
  if (Math.hypot((actor.targetX || actor.x) - actor.x, (actor.targetY || actor.y) - actor.y) > 10)
    return "run";
  return "idle";
}

export function drawCharger(ctx, actor, options) {
  var sheet = getChargerSheet();
  var source = sheet.source;
  if (!source || !source.complete || !source.naturalWidth) return false;
  options = options || {};
  var state = chargerState(actor);
  var anim = sheet.animations[state] || sheet.animations.idle;
  var now = nowMs();
  if (actor.__chargerState !== state) {
    actor.__chargerState = state;
    actor.__chargerStart = now;
  }
  var elapsed = Math.max(0, (now - (actor.__chargerStart || now)) / 1000);
  var frame;
  if (state === "death") {
    var progress = Math.min(0.999, (actor.deathTimer || 0) / Math.max(0.01, actor.deathDuration || 0.8));
    frame = Math.min(anim.frames - 1, Math.floor(progress * anim.frames));
  } else {
    frame = Math.floor(elapsed * anim.fps) % anim.frames;
  }
  var fw = sheet.frameWidth,
    fh = sheet.frameHeight,
    scale = (options.scale == null ? 0.5 : options.scale * 1.65) * (actor.scale || 1),
    dw = fw * scale,
    dh = fh * scale,
    flip = (actor.facingX || 0) < 0 ? -1 : 1;
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
