import { weaponCopy } from "./weapons.js?v=20260908-130";
import { orderDefense } from "./squadDialog.js?v=20260908-130";

// Tunable knight brain. StormRat can replace this with per-squadmate AI later.
export const LEO_AGGRO = {
  meleeRange: 82,
  engageDistance: 520,
  abandonCover: 300,
  sidearmRange: 780,
  closeSpeed: 1.24,
  coverCloseSpeed: 1.16,
  shieldDefense: 80,
  swordDamage: 46,
  swordCooldown: 0.55,
  holdPeek: 0.7,
  reposition: 0.42,
  desiredCoverRange: 170,
};

// Official Phone Art kit-locked v4 from chore/leo-heavy-knight (523fd40).
export const LEO_ART_STATUS = "official";
export const LEO_TEMP_FILTER =
  "sepia(.28) saturate(.62) hue-rotate(196deg) brightness(.84) contrast(1.18)";

export function isLeo(actor) {
  return !!(actor && (actor.knight || actor.role === "knight" || actor.name === "Leo"));
}

export function leoSword() {
  return {
    id: "sword",
    name: "KNIGHT SWORD",
    short: "SWORD",
    damage: LEO_AGGRO.swordDamage,
    range: LEO_AGGRO.meleeRange,
    cooldown: LEO_AGGRO.swordCooldown,
    magazine: 1,
    reload: 0.12,
    accuracy: 14,
    spread: 0,
    pellets: 1,
    role: "melee",
    pressure: 8,
    ammo: 1,
    reserve: Infinity,
    infinite: true,
    recoil: 0,
    fireCooldown: 0,
    reloading: false,
  };
}

export function leoSidearmFromLoadout(entry) {
  var id = "pistol";
  if (typeof entry === "string" && entry) id = entry;
  else if (entry && typeof entry === "object")
    id = entry.sidearm || entry.weapon || "pistol";
  var w = weaponCopy(id);
  if (!w || w.role !== "backup") w = weaponCopy("pistol");
  w.infinite = true;
  w.reserve = Infinity;
  return w;
}

export function leoShieldBonus(actor) {
  if (!isLeo(actor)) return 0;
  if (actor.blocking || actor.combatState === "melee") return LEO_AGGRO.shieldDefense;
  return 0;
}

export function incomingDefense(actor) {
  return ((actor && actor.defense) || 0) + orderDefense(actor) + leoShieldBonus(actor);
}

export function isLeoBlocking(actor) {
  return isLeo(actor) && !!(actor.blocking || actor.combatState === "melee");
}

export function drawLeoGear(ctx, a) {
  if (!ctx || !isLeo(a)) return false;
  var swing =
    a.combatState === "melee" || (a.meleeTimer || 0) > LEO_AGGRO.swordCooldown * 0.35;
  var raise = a.blocking || a.combatState === "melee" ? 1 : 0.55;
  ctx.save();
  ctx.lineJoin = "round";
  ctx.lineCap = "round";

  ctx.save();
  ctx.translate(-10 * raise, -16);
  ctx.rotate(-0.18);
  ctx.beginPath();
  ctx.moveTo(0, -16);
  ctx.lineTo(11, -6);
  ctx.lineTo(9, 11);
  ctx.lineTo(0, 17);
  ctx.lineTo(-9, 11);
  ctx.lineTo(-11, -6);
  ctx.closePath();
  ctx.fillStyle = "#3d4c58";
  ctx.fill();
  ctx.strokeStyle = "#c9d6df";
  ctx.lineWidth = 1.6;
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(0, -10);
  ctx.lineTo(0, 12);
  ctx.moveTo(-6, 0);
  ctx.lineTo(6, 0);
  ctx.strokeStyle = "#8fa4b3";
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.restore();

  ctx.save();
  ctx.translate(11, -8);
  ctx.rotate(swing ? -0.95 : -0.28);
  ctx.fillStyle = "#6b5648";
  ctx.fillRect(-1.4, -22, 2.8, 20);
  ctx.fillStyle = "#d7dde4";
  ctx.beginPath();
  ctx.moveTo(0, -34);
  ctx.lineTo(3.2, -20);
  ctx.lineTo(0, -18);
  ctx.lineTo(-3.2, -20);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = "#c4a46a";
  ctx.fillRect(-4.2, -3, 8.4, 2.4);
  ctx.fillStyle = "#4a3a2a";
  ctx.fillRect(-1.2, -2, 2.4, 8);
  ctx.restore();

  ctx.fillStyle = "#5c6770";
  ctx.fillRect(-8, -28, 16, 5);
  ctx.fillRect(-10, -24, 5, 8);
  ctx.fillRect(5, -24, 5, 8);
  ctx.restore();
  return true;
}
