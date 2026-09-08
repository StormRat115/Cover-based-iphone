import {
  mitigateDamage,
  attackDamage,
  creditKill,
} from "./combatStats.js?v=20260908-134";
import { incomingDefense } from "./leoKit.js?v=20260908-134";

// Weak backup knife for rifle/sidearm units. Melee-focused kits stay in
// leoKit (Leo sword) and chargerEnemy (rushblade).
export const MELEE = {
  knifeDamage: 8,
  knifeRange: 48,
  knifeCooldown: 0.85,
  focusBonus: 1,
};

export function isMeleeFocused(actor) {
  if (!actor) return false;
  if (actor.knight || actor.role === "knight" || actor.name === "Leo")
    return true;
  if (actor.type === "charger" || actor.meleeCharge || actor.role === "melee")
    return true;
  if (actor.meleePrefer) return true;
  var w = actor.weapon;
  if (
    w &&
    (w.role === "melee" ||
      w.id === "sword" ||
      w.id === "rushblade" ||
      w.id === "melee")
  )
    return true;
  return false;
}

export function ignoresCover(actor) {
  return isMeleeFocused(actor);
}

export function knifeWeapon() {
  return {
    id: "knife",
    name: "COMBAT KNIFE",
    short: "KNIFE",
    damage: MELEE.knifeDamage,
    range: MELEE.knifeRange,
    cooldown: MELEE.knifeCooldown,
    magazine: 1,
    reload: 0.1,
    accuracy: 99,
    spread: 0,
    pellets: 1,
    role: "melee",
    pressure: 2,
    ammo: 1,
    reserve: Infinity,
    infinite: true,
    recoil: 0,
    fireCooldown: 0,
    reloading: false,
    melee: true,
    meleeFocus: false,
  };
}

export function ensureMeleeWeapon(actor) {
  if (!actor) return null;
  if (actor.melee) return actor.melee;
  if (actor.weapon && (actor.weapon.role === "melee" || actor.weapon.melee)) {
    actor.melee = actor.weapon;
    return actor.melee;
  }
  actor.melee = knifeWeapon();
  return actor.melee;
}

export function meleeRangeOf(actor) {
  var w = actor && (actor.melee || (actor.weapon && actor.weapon.role === "melee" ? actor.weapon : null));
  if (w && w.range) return w.range;
  return isMeleeFocused(actor) ? 82 : MELEE.knifeRange;
}

export function inMeleeRange(a, b) {
  if (!a || !b) return false;
  var reach = Math.max(meleeRangeOf(a), meleeRangeOf(b));
  return Math.hypot(a.x - b.x, a.y - b.y) <= reach;
}

function downOrKill(target, attacker) {
  if (!target || target.hp > 0) return;
  target.hp = 0;
  if (target.permanentDeath) {
    target.dead = true;
    target.downed = false;
    target.deathTimer = 0;
    if (attacker) creditKill(attacker);
    return;
  }
  if (target.triggerDowned) target.triggerDowned();
  else if (target.isPlayer || target.name) {
    target.downed = true;
    target.downTimer = 0;
  } else {
    target.dead = true;
    target.deathTimer = 0;
  }
  if (attacker && (target.dead || target.downed)) creditKill(attacker);
}

// Melee always hits. No hit-chance roll.
export function swingMelee(attacker, target) {
  if (!attacker || !target) return false;
  if (attacker.dead || attacker.downed || target.dead || target.downed)
    return false;
  if (target.hp <= 0) return false;
  var weapon = ensureMeleeWeapon(attacker);
  var cd = (weapon && weapon.cooldown) || MELEE.knifeCooldown;
  if ((attacker.meleeTimer || 0) > 0) return false;
  if (weapon && weapon.fireCooldown > 0) return false;
  attacker.meleeTimer = cd;
  if (weapon) weapon.fireCooldown = cd;
  attacker.muzzle = 0.14;
  attacker.combatState = "melee";
  attacker.lastAttackMelee = true;
  var raw = attackDamage(weapon.damage, attacker.damageBonus);
  var dealt = mitigateDamage(raw, incomingDefense(target));
  target.hp = Math.max(0, target.hp - dealt);
  target.lastDamageTaken = dealt;
  target.hit = 0.22;
  target.timeSinceDamage = 0;
  downOrKill(target, attacker);
  return true;
}

export function tickMeleeTimer(actor, dt) {
  if (!actor) return;
  actor.meleeTimer = Math.max(0, (actor.meleeTimer || 0) - dt);
  if (actor.melee && actor.melee.fireCooldown > 0)
    actor.melee.fireCooldown = Math.max(0, actor.melee.fireCooldown - dt);
}
