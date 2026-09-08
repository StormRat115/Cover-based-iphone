import { isSightBlocked, getHitChance } from "./cover.js?v=20260908-136";
import { AudioBus } from "./audio.js?v=20260908-136";
import {
  moveTowardTarget,
  faceThreat,
} from "./combatAI.js?v=20260908-136";
import {
  mitigateDamage,
  combatAccuracy,
  attackDamage,
  creditKill,
} from "./combatStats.js?v=20260908-136";
import {
  spraySuppression,
  suppressionAccuracyDelta,
} from "./suppression.js?v=20260908-136";
import { orderAccuracy } from "./squadDialog.js?v=20260908-136";
import {
  LEO_AGGRO,
  isLeo,
} from "./leoKit.js?v=20260908-136";
import { coupleEngaged, updateEngagedFight } from "./engaged.js?v=20260908-136";
import { applyIncomingHostileDamage } from "./enemyVariants.js?v=20260908-136";
import { hasPerfectHit } from "./squadAbilities.js?v=20260908-136";

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
} from "./leoKit.js?v=20260908-136";

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
  var chance = hasPerfectHit(a)
    ? 100
    : combatAccuracy(
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
    var dealt = applyIncomingHostileDamage(
      e,
      attackDamage(gun.damage, a.damageBonus),
      a,
      { melee: false },
    );
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
  mode = mode;
  friendlies = friendlies;
  a.cover = null;
  a.exposed = true;
  a.blocking = d <= knobs.engageDistance;
  faceThreat(a, e);
  a.weaponSlot = d <= knobs.meleeRange ? "melee" : "sidearm";

  if (d <= knobs.meleeRange) {
    coupleEngaged(a, e);
    updateEngagedFight(a, dt, [e]);
    return true;
  }

  a.combatState = "seeking";
  a.targetX = e.x;
  a.targetY = e.y;
  moveTowardTarget(a, dt, knobs.closeSpeed);
  if (d <= knobs.sidearmRange && !isSightBlocked(a, e, covers))
    fireLeoSidearm(a, e, spawnProjectile, covers, -8);
  return true;
}
