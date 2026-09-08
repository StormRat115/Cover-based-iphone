import { isSightBlocked, getHitChance } from "./cover.js?v=20260908-125";
import { AudioBus } from "./audio.js?v=20260908-125";
import {
  pickTacticalCover,
  applyCoverChoice,
  moveTowardTarget,
  faceThreat,
  repathIfSlotContested,
} from "./combatAI.js?v=20260908-125";
import {
  mitigateDamage,
  combatAccuracy,
  attackDamage,
  creditKill,
} from "./combatStats.js?v=20260908-125";
import { occupiesCoverSlot } from "./coverSlots.js?v=20260908-125";
import {
  spraySuppression,
  suppressionAccuracyDelta,
} from "./suppression.js?v=20260908-125";
import { orderAccuracy } from "./squadDialog.js?v=20260908-125";
import {
  LEO_AGGRO,
  isLeo,
} from "./leoKit.js?v=20260908-125";

export {
  LEO_AGGRO,
  LEO_ART_STATUS,
  LEO_TEMP_FILTER,
  isLeo,
  leoSword,
  leoSidearmFromLoadout,
  leoShieldBonus,
  incomingDefense,
  isLeoBlocking,
  drawLeoGear,
} from "./leoKit.js?v=20260908-125";

function swingSword(a, e) {
  if (!e || a.dead || a.downed) return false;
  if ((a.meleeTimer || 0) > 0) return false;
  a.meleeTimer = LEO_AGGRO.swordCooldown;
  a.muzzle = 0.16;
  a.combatState = "melee";
  a.blocking = true;
  var raw = attackDamage(LEO_AGGRO.swordDamage, a.damageBonus);
  var dealt = mitigateDamage(raw, e.defense);
  e.hp = Math.max(0, e.hp - dealt);
  e.lastDamageTaken = dealt;
  e.hit = 0.22;
  e.timeSinceDamage = 0;
  if (e.hp <= 0) {
    e.hp = 0;
    e.dead = true;
    e.deathTimer = 0;
    creditKill(a);
  }
  return true;
}

function fireLeoSidearm(a, e, spawnProjectile, covers, accuracyModifier) {
  var gun = a.sidearm;
  if (!gun || a.dead || a.downed || a.reloading) return false;
  if (gun.ammo <= 0 || gun.fireCooldown > 0) {
    if (gun.ammo <= 0 && !a.reloading) {
      a.reloading = true;
      a.reloadTimer = gun.reload;
      if (AudioBus && AudioBus.playReload) AudioBus.playReload({ volume: 0.5 });
    }
    return false;
  }
  var chance = combatAccuracy(
    getHitChance(a, e, covers),
    gun.accuracy,
    a.accuracy,
    suppressionAccuracyDelta(a) + orderAccuracy(a) + (accuracyModifier || 0),
  );
  var hit = Math.random() * 100 < chance;
  gun.ammo--;
  gun.fireCooldown = gun.cooldown;
  if (AudioBus && AudioBus.playFire)
    AudioBus.playFire(gun, { volume: 0.42, priority: 2 });
  a.muzzle = 0.1;
  a.weaponSlot = "sidearm";
  if (spawnProjectile) spawnProjectile(a, e, "ally", hit ? 1 : 0);
  spraySuppression(
    a,
    e,
    (typeof window !== "undefined" && window.__battleEnemies) || [],
    true,
  );
  if (hit) {
    var dealt = mitigateDamage(attackDamage(gun.damage, a.damageBonus), e.defense);
    e.hp = Math.max(0, e.hp - dealt);
    e.lastDamageTaken = dealt;
    e.hit = 0.16;
    if (e.hp <= 0) {
      e.dead = true;
      e.deathTimer = 0;
      creditKill(a);
    }
  }
  if (gun.ammo <= 0) {
    a.reloading = true;
    a.reloadTimer = gun.reload;
    if (AudioBus && AudioBus.playReload) AudioBus.playReload({ volume: 0.5 });
  }
  return true;
}

export function tickLeoTimers(a, dt) {
  if (!isLeo(a)) return;
  a.meleeTimer = Math.max(0, (a.meleeTimer || 0) - dt);
  if (a.sidearm && a.sidearm.fireCooldown > 0)
    a.sidearm.fireCooldown = Math.max(0, a.sidearm.fireCooldown - dt);
}

export function updateLeoKnight(
  a,
  dt,
  e,
  d,
  covers,
  friendlies,
  spawnProjectile,
  mode,
) {
  if (!isLeo(a) || !e) return false;
  var knobs = LEO_AGGRO;
  faceThreat(a, e);
  a.weaponSlot = d <= knobs.meleeRange ? "melee" : "sidearm";

  var holdBack = mode === "HOLD" && d > knobs.abandonCover;
  var inMelee = d <= knobs.meleeRange;

  if (inMelee) {
    a.cover = null;
    a.exposed = true;
    a.blocking = true;
    a.combatState = "melee";
    a.targetX = e.x;
    a.targetY = e.y;
    if (d > 36) moveTowardTarget(a, dt, knobs.closeSpeed);
    swingSword(a, e);
    return true;
  }

  if (holdBack) {
    a.blocking = occupiesCoverSlot(a, 58);
    a.exposed = !a.blocking;
    if ((!a.cover || !occupiesCoverSlot(a, 58)) && a.repositionCooldown <= 0) {
      var holdChoice = pickTacticalCover(a, e, covers, friendlies, {
        maxTravel: 1200,
        minThreat: 80,
        maxThreat: knobs.sidearmRange,
        desiredRange: Math.min(knobs.sidearmRange * 0.62, 640),
        flankSide: a.flankSide,
        flankWeight: 120,
        slotPriority: true,
        allowUnprotected: true,
        threats: [e],
      });
      if (holdChoice) {
        applyCoverChoice(a, holdChoice);
        a.repositionCooldown = knobs.reposition;
      }
    }
    if (a.cover && !occupiesCoverSlot(a, 18)) {
      a.combatState = "seeking";
      a.exposed = true;
      moveTowardTarget(a, dt, 1.1);
    } else {
      a.combatState = "covered";
      if (d <= knobs.sidearmRange && !isSightBlocked(a, e, covers))
        fireLeoSidearm(a, e, spawnProjectile, covers, 0);
    }
    return true;
  }

  a.blocking = d <= knobs.engageDistance;
  a.exposed = true;
  a.combatState = "seeking";

  var headingToSlot = !!(
    a.cover &&
    !occupiesCoverSlot(a, 58) &&
    Number.isFinite(a.coverAnchorX)
  );
  if (!headingToSlot && d > knobs.abandonCover && a.repositionCooldown <= 0) {
    var closeChoice = pickTacticalCover(a, e, covers, friendlies, {
      maxTravel: 900,
      minThreat: 40,
      maxThreat: knobs.engageDistance,
      desiredRange: knobs.desiredCoverRange,
      flankSide: a.flankSide,
      flankWeight: 90,
      slotPriority: true,
      allowUnprotected: true,
      advance: true,
      threats: [e],
    });
    if (closeChoice) {
      var slot = closeChoice.slot || closeChoice;
      var closer =
        Math.hypot(
          (slot.x || closeChoice.cover.x) - e.x,
          (slot.y || closeChoice.cover.y) - e.y,
        ) <
        d - 70;
      if (closer) {
        applyCoverChoice(a, closeChoice);
        a.repositionCooldown = knobs.reposition;
        headingToSlot = true;
      }
    }
  }

  if (a.cover && !occupiesCoverSlot(a, 22)) {
    repathIfSlotContested(a, e, covers, friendlies, {
      slotPriority: true,
      allowUnprotected: true,
      advance: true,
      desiredRange: knobs.desiredCoverRange,
      threats: [e],
    });
    if (d <= knobs.sidearmRange && !isSightBlocked(a, e, covers))
      fireLeoSidearm(a, e, spawnProjectile, covers, -8);
    moveTowardTarget(a, dt, knobs.coverCloseSpeed);
    if (occupiesCoverSlot(a, 18)) {
      a.x = a.coverAnchorX;
      a.y = a.coverAnchorY;
    }
    return true;
  }

  if (a.cover && occupiesCoverSlot(a, 58) && d > knobs.abandonCover * 1.15) {
    if (d <= knobs.sidearmRange && !isSightBlocked(a, e, covers))
      fireLeoSidearm(a, e, spawnProjectile, covers, 0);
    if (d > knobs.engageDistance) return true;
  }

  a.cover = null;
  a.targetX = e.x;
  a.targetY = e.y;
  moveTowardTarget(a, dt, knobs.closeSpeed);
  if (d <= knobs.sidearmRange && !isSightBlocked(a, e, covers))
    fireLeoSidearm(a, e, spawnProjectile, covers, -10);
  return true;
}
