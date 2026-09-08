import { moveTowardTarget, faceThreat } from "./combatAI.js?v=20260908-137";
import {
  mitigateDamage,
} from "./combatStats.js?v=20260908-137";
import { drawEnemyMonster, drawSoldier } from "./soldierAssets.js?v=20260908-137";
import { drawOfficialVariant } from "./variantArt.js?v=20260908-137";
import { inMeleeRange, meleeRangeOf } from "./melee.js?v=20260908-137";
import {
  coupleEngaged,
  clearEngaged,
  closeForMelee,
  updateEngagedFight,
  engagedTargetPenalty,
  preferShootTargets,
} from "./engaged.js?v=20260908-137";

// Ripper / Shield / Medic. Official Phone Art sheets live in
// assets/generated/enemies/ from chore/enemy-variants-ripper-shield-medic.
// Draw uses those kit-locked 160px cell sheets (charger-style blit).
// TEMP TINT fallback stays only if a sheet fails to decode.
//
// Engaged lock, always-hit melee, sword marks, and shooter deprioritize
// live in js/engaged.js + js/melee.js (BUILD 128+). This module owns
// spawn mix, shield frontal DR, medic heals, world labels, and specialist AI.

export const VARIANT_TYPES = ["ripper", "shield", "medic"];

export const VARIANT_SPAWN = {
  wave1None: true,
  // Wave 2: occasional shield, rare medic, no ripper flood.
  wave2ShieldEvery: 11,
  wave2MedicEvery: 13,
  // Wave 3: first rippers, still sparse.
  wave3RipperEvery: 8,
  wave3ShieldEvery: 11,
  wave3MedicEvery: 14,
  // Wave 4+: ripper more common; shield occasional; medic rare but visible.
  lateRipperEvery: 5,
  lateShieldEvery: 9,
  lateMedicEvery: 12,
  door: {
    shieldFromWave: 2,
    shieldChance: 0.18,
    ripperFromWave: 3,
    ripperChance: 0.22,
    medicFromWave: 3,
    medicChance: 0.14,
  },
};

export const SHIELD = {
  frontReduction: 0.86,
  frontDot: 0.18,
};

export const MEDIC = {
  healAmount: 16,
  healInterval: 1.1,
  healRange: 78,
  seekRange: 1600,
  interruptLockout: 1.8,
  woundedFrac: 0.92,
  meleeDamage: 8,
  meleeRange: 44,
  meleeCooldown: 1.05,
};

export const RIPPER = {
  meleeRange: 46,
  meleeDamage: 14,
  meleeCooldown: 0.48,
  dogpileBonus: 240,
};

export const VARIANT_KINDS = {
  ripper: {
    label: "RIPPER",
    hp: 42,
    speed: 318,
    scale: 0.86,
    defense: 12,
    accuracy: 0,
    damage: 2,
    meleeCharge: true,
    role: "melee",
    fallbackSheet: "shotgunner",
    tempTint: "hue-rotate(-22deg) saturate(1.55) brightness(1.08) contrast(1.08)",
    bar: "#e45a7a",
    officialFile: "enemy-ripper-sheet.png",
  },
  shield: {
    label: "SHIELD",
    hp: 118,
    speed: 172,
    scale: 1.16,
    defense: 55,
    accuracy: 0,
    damage: 3,
    meleeCharge: true,
    role: "melee",
    fallbackSheet: "heavy",
    tempTint: "hue-rotate(198deg) saturate(0.78) brightness(0.96) contrast(1.12)",
    bar: "#7eb4de",
    officialFile: "enemy-shielded-thrall-sheet.png",
  },
  medic: {
    label: "MEDIC",
    hp: 50,
    speed: 228,
    scale: 0.98,
    defense: 18,
    accuracy: 0,
    damage: 0,
    meleeCharge: false,
    role: "support",
    fallbackSheet: "rifleman",
    tempTint: "hue-rotate(102deg) saturate(1.4) brightness(1.06)",
    bar: "#4ecf7a",
    officialFile: "enemy-medic-thrall-sheet.png",
  },
};

export { engagedTargetPenalty };

export function preferUnengaged(candidates) {
  return preferShootTargets(candidates);
}

export function isVariantType(type) {
  return type === "ripper" || type === "shield" || type === "medic";
}

export function seedDemoVariants(roster, spawnAt) {
  try {
    if (typeof location === "undefined") return roster;
    if (!/demo-variants/.test(String(location.hash || ""))) return roster;
  } catch (_err) {
    return roster;
  }
  if (!spawnAt || !roster) return roster;
  ["ripper", "shield", "medic"].forEach(function (type, i) {
    var spawned = spawnAt(-50 + i * 100, 55, type, {
      spawnTimer: 0,
      index: 80 + i,
    });
    spawned.hp = spawned.maxHp = spawned.maxHp * 3;
    spawned.demoHold = 2.2;
    roster.push(spawned);
  });
  return roster;
}

export function variantStats(type) {
  return VARIANT_KINDS[type] || null;
}

export function variantWorldLabel(type) {
  var kind = VARIANT_KINDS[type];
  return kind ? kind.label : "";
}

export function variantBarColor(type) {
  var kind = VARIANT_KINDS[type];
  return kind ? kind.bar : "";
}

export function variantArtStatus(type) {
  var kind = VARIANT_KINDS[type];
  if (!kind) return "none";
  return kind.officialFile ? "official" : "temp-tint";
}

export function variantWeapon(type) {
  if (type === "ripper") {
    return {
      id: "claws",
      name: "RIPPER CLAWS",
      short: "CLAWS",
      damage: RIPPER.meleeDamage,
      range: RIPPER.meleeRange,
      cooldown: RIPPER.meleeCooldown,
      magazine: 99,
      reload: 0.2,
      accuracy: 10,
      spread: 0,
      pellets: 1,
      role: "melee",
      pressure: 8,
      ammo: 99,
      fireCooldown: 0,
      reloading: false,
      melee: true,
    };
  }
  if (type === "shield") {
    return {
      id: "shortblade",
      name: "SHORT BLADE",
      short: "BLADE",
      damage: 16,
      range: 52,
      cooldown: 0.9,
      magazine: 99,
      reload: 0.2,
      accuracy: 10,
      spread: 0,
      pellets: 1,
      role: "melee",
      pressure: 6,
      ammo: 99,
      fireCooldown: 0,
      reloading: false,
      melee: true,
    };
  }
  if (type === "medic") {
    return {
      id: "syringe",
      name: "FIELD SYRINGE",
      short: "MELEE",
      damage: MEDIC.meleeDamage,
      range: MEDIC.meleeRange,
      cooldown: MEDIC.meleeCooldown,
      magazine: 99,
      reload: 0.2,
      accuracy: 10,
      spread: 0,
      pellets: 1,
      role: "melee",
      pressure: 2,
      ammo: 99,
      fireCooldown: 0,
      reloading: false,
      melee: true,
      meleeFocus: false,
    };
  }
  return null;
}

export function pickVariantType(wave, index, random) {
  wave = Math.max(1, wave || 1);
  random = random || Math.random;
  if (wave <= 1) return null;
  if (wave === 2) {
    if (index % VARIANT_SPAWN.wave2ShieldEvery === 3 && random() > 0.5)
      return "shield";
    if (index % VARIANT_SPAWN.wave2MedicEvery === 6 && random() > 0.62)
      return "medic";
    return null;
  }
  if (wave === 3) {
    if (index % VARIANT_SPAWN.wave3RipperEvery === 3) return "ripper";
    if (index % VARIANT_SPAWN.wave3ShieldEvery === 5) return "shield";
    if (index % VARIANT_SPAWN.wave3MedicEvery === 9) return "medic";
    return null;
  }
  if (index % VARIANT_SPAWN.lateRipperEvery === 2) return "ripper";
  if (index % VARIANT_SPAWN.lateShieldEvery === 4) return "shield";
  if (index % VARIANT_SPAWN.lateMedicEvery === 8) return "medic";
  return null;
}

export function pickDoorVariant(wave, index, random) {
  wave = Math.max(1, wave || 1);
  random = random || Math.random;
  var door = VARIANT_SPAWN.door;
  if (wave < door.shieldFromWave) return null;
  if (index === 0 && wave >= door.shieldFromWave && random() < door.shieldChance)
    return "shield";
  if (index === 1 && wave >= door.ripperFromWave && random() < door.ripperChance)
    return "ripper";
  if (index === 2 && wave >= door.medicFromWave && random() < door.medicChance)
    return "medic";
  if (wave >= 5 && index === 0 && random() < 0.16) return "ripper";
  return null;
}

function living(actor) {
  return !!(actor && !actor.dead && !actor.downed && actor.hp > 0);
}

export function isMeleeAttack(attacker, opts) {
  if (opts && opts.melee) return true;
  if (!attacker) return false;
  if (attacker.lastAttackMelee) return true;
  if (attacker.weaponSlot === "melee") return true;
  var w = attacker.weapon || attacker.melee;
  if (w && (w.role === "melee" || w.melee || w.id === "sword" || w.id === "claws"))
    return true;
  if (
    (attacker.knight || attacker.role === "knight" || attacker.name === "Leo") &&
    (attacker.combatState === "melee" || attacker.blocking)
  )
    return true;
  return false;
}

export function isFrontalToShield(enemy, attacker) {
  if (!enemy || !attacker) return true;
  var fx = enemy.facingX || 0,
    fy = enemy.facingY || 0;
  if (!fx && !fy) fx = 1;
  var dx = attacker.x - enemy.x,
    dy = attacker.y - enemy.y,
    d = Math.hypot(dx, dy) || 1;
  return (fx * dx + fy * dy) / d >= SHIELD.frontDot;
}

export function shieldBlocksRanged(enemy, attacker, opts) {
  if (!enemy || enemy.type !== "shield" || enemy.dead) return false;
  if (enemy.shieldUp === false) return false;
  if (isMeleeAttack(attacker, opts)) return false;
  return isFrontalToShield(enemy, attacker);
}

export function applyIncomingHostileDamage(enemy, raw, attacker, opts) {
  var amount = Math.max(0, Number(raw) || 0);
  if (shieldBlocksRanged(enemy, attacker, opts))
    amount *= 1 - SHIELD.frontReduction;
  return mitigateDamage(amount, (enemy && enemy.defense) || 0);
}

function roster() {
  var list = [];
  if (typeof window === "undefined") return list;
  (window.__battleMarines || []).forEach(function (m) {
    if (living(m)) list.push(m);
  });
  (window.__battleAllies || []).forEach(function (a) {
    if (living(a)) list.push(a);
  });
  if (living(window.__battlePlayer)) list.push(window.__battlePlayer);
  var v = window.__supportVehicle;
  if (living(v)) list.push(v);
  return list;
}

function everyoneNear(actor) {
  return roster().concat(actor && actor.engagedWith ? [actor.engagedWith] : []);
}

function closeOn(actor, threat, dt, speedScale) {
  if (!living(actor) || !living(threat)) return false;
  closeForMelee(actor, threat, dt, speedScale || 1.22);
  if (actor.engaged || inMeleeRange(actor, threat)) {
    coupleEngaged(actor, threat);
    return updateEngagedFight(actor, dt, everyoneNear(actor).concat([threat]));
  }
  return false;
}

function pickChargeTarget(e, player) {
  var best = null,
    bestScore = -Infinity;
  roster().forEach(function (t) {
    var d = Math.hypot(t.x - e.x, t.y - e.y);
    var score = Math.max(0, 1600 - d);
    if (t.isMarine) score += 80;
    if (t === e.combatTarget) score += 24;
    if (t.engaged || t.combatState === "melee") score += RIPPER.dogpileBonus;
    if (d < 260) score += 90;
    if (score > bestScore) {
      bestScore = score;
      best = t;
    }
  });
  return best || player;
}

function pickDogpileTarget(e, player) {
  var engaged = roster().filter(function (t) {
    return t.engaged || t.combatState === "melee";
  });
  if (!engaged.length) return pickChargeTarget(e, player);
  var best = null,
    bestD = Infinity;
  engaged.forEach(function (t) {
    var d = Math.hypot(t.x - e.x, t.y - e.y);
    if (d < bestD) {
      bestD = d;
      best = t;
    }
  });
  return best || pickChargeTarget(e, player);
}

function livingMonsters(enemies, self) {
  var list = [];
  (enemies || []).forEach(function (o) {
    if (o === self || !living(o) || o.spawnTimer > 0) return;
    if (o.pendingSegment) return;
    list.push(o);
  });
  return list;
}

function pickWoundedMonster(medic, enemies) {
  var best = null,
    bestScore = -Infinity;
  livingMonsters(enemies, medic).forEach(function (o) {
    if (o.hp >= o.maxHp * MEDIC.woundedFrac) return;
    var d = Math.hypot(o.x - medic.x, o.y - medic.y);
    if (d > MEDIC.seekRange) return;
    var missing = 1 - o.hp / Math.max(1, o.maxHp);
    var score = missing * 220 + Math.max(0, 900 - d) * 0.08;
    if (o.type === "shield" || o.type === "charger" || o.type === "heavy")
      score += 18;
    if (score > bestScore) {
      bestScore = score;
      best = o;
    }
  });
  return best;
}

function healTarget(medic, ally) {
  if (!living(medic) || !living(ally)) return false;
  if ((medic.healTimer || 0) > 0) return false;
  medic.healTimer = MEDIC.healInterval;
  medic.healing = true;
  medic.healTarget = ally;
  medic.healFlash = 0.45;
  ally.hp = Math.min(ally.maxHp, ally.hp + MEDIC.healAmount);
  ally.healFlash = 0.4;
  ally.lastHp = ally.hp;
  return true;
}

function forcedMelee(e, dt, player) {
  var threat = null;
  roster().forEach(function (t) {
    if (inMeleeRange(e, t)) threat = t;
  });
  if (!threat) return false;
  e.combatTarget = threat;
  closeOn(e, threat, dt, 1.08);
  return true;
}

function updateRipper(e, dt, player) {
  e.meleeCharge = true;
  e.cover = null;
  e.exposed = true;
  // Pack maybeDogpile() already ran in updateBandits; honor joiningMelee.
  if (living(e.joiningMelee)) {
    e.combatTarget = e.joiningMelee;
    e.targetTimer = 0.45;
  } else if (!living(e.combatTarget) || (e.targetTimer || 0) <= 0) {
    e.combatTarget = pickDogpileTarget(e, player);
    e.targetTimer = 0.45;
  } else {
    var engagedNow = pickDogpileTarget(e, player);
    if (engagedNow && (engagedNow.engaged || engagedNow.combatState === "melee"))
      e.combatTarget = engagedNow;
  }
  var threat = e.combatTarget || player;
  if (!living(threat)) return;
  e.charging = Math.hypot(threat.x - e.x, threat.y - e.y) > meleeRangeOf(e);
  e.combatState = e.charging ? "charge" : "melee";
  closeOn(e, threat, dt, e.charging ? 1.42 : 1.18);
}

function updateShield(e, dt, player) {
  e.meleeCharge = true;
  e.shieldUp = true;
  e.cover = null;
  e.exposed = true;
  if (!living(e.combatTarget) || (e.targetTimer || 0) <= 0) {
    e.combatTarget = pickChargeTarget(e, player);
    e.targetTimer = 0.7;
  }
  var threat = e.combatTarget || player;
  if (!living(threat)) return;
  closeOn(e, threat, dt, 1.12);
}

function updateMedic(e, dt, player, enemies) {
  e.cover = null;
  e.exposed = true;
  e.meleeCharge = false;
  e.joiningMelee = null;
  e.healTimer = Math.max(0, (e.healTimer || 0) - dt);
  if (forcedMelee(e, dt, player)) {
    e.healing = false;
    e.healTarget = null;
    return;
  }
  if ((e.healLockout || 0) > 0) {
    e.healing = false;
    e.healTarget = null;
    e.combatState = "seeking";
    return;
  }
  var wounded = pickWoundedMonster(e, enemies);
  if (!wounded) {
    e.healing = false;
    e.healTarget = null;
    e.combatState = "seeking";
    var huddle = livingMonsters(enemies, e)[0];
    if (huddle) {
      faceThreat(e, huddle);
      e.targetX = huddle.x + 36;
      e.targetY = huddle.y + 20;
      moveTowardTarget(e, dt, 0.92);
    }
    return;
  }
  e.healTarget = wounded;
  e.combatTarget = null;
  faceThreat(e, wounded);
  var d = Math.hypot(wounded.x - e.x, wounded.y - e.y);
  e.targetX = wounded.x;
  e.targetY = wounded.y;
  e.combatState = "support";
  if (d > MEDIC.healRange) {
    e.healing = false;
    moveTowardTarget(e, dt, 1.18);
    return;
  }
  healTarget(e, wounded);
}

export function updateVariants(enemies, dt, player, covers, spawnProjectile) {
  covers = covers;
  spawnProjectile = spawnProjectile;
  (enemies || []).forEach(function (e) {
    if (!e || !isVariantType(e.type)) return;
    if (e.dead) {
      clearEngaged(e);
      e.deathTimer = Math.min(e.deathDuration || 0.8, (e.deathTimer || 0) + dt);
      return;
    }
    e.t = (e.t || 0) + dt;
    e.hit = Math.max(0, (e.hit || 0) - dt);
    e.muzzle = Math.max(0, (e.muzzle || 0) - dt);
    e.targetTimer = Math.max(0, (e.targetTimer || 0) - dt);
    e.healLockout = Math.max(0, (e.healLockout || 0) - dt);
    e.healFlash = Math.max(0, (e.healFlash || 0) - dt);
    if (e.type === "medic" && e.lastHp != null && e.hp < e.lastHp - 0.05) {
      e.healing = false;
      e.healTarget = null;
      e.healLockout = MEDIC.interruptLockout;
    }
    e.lastHp = e.hp;
    if ((e.spawnTimer || 0) > 0) return;
    if (e.doorEgress) return;
    e.cover = null;
    e.exposed = true;
    if ((e.demoHold || 0) > 0) {
      e.demoHold -= dt;
      e.combatState = "idle";
      return;
    }
    if (e.engaged && living(e.engagedWith)) {
      updateEngagedFight(e, dt, everyoneNear(e));
      if (!living(e.engagedWith)) clearEngaged(e);
      return;
    }
    if (e.engaged && !living(e.engagedWith)) clearEngaged(e);
    if (e.type === "ripper") updateRipper(e, dt, player);
    else if (e.type === "shield") updateShield(e, dt, player);
    else updateMedic(e, dt, player, enemies);
  });
}

function drawTempBadge(ctx, y) {
  ctx.save();
  ctx.font = "800 8px system-ui";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.lineWidth = 3;
  ctx.strokeStyle = "#1a1208";
  ctx.fillStyle = "#f0d070";
  ctx.strokeText("TEMP TINT", 0, y);
  ctx.fillText("TEMP TINT", 0, y);
  ctx.restore();
}

export function drawWorldLabel(ctx, e) {
  if (!ctx || !e || e.dead) return;
  var label = e.worldLabel || variantWorldLabel(e.type);
  if (!label) return;
  var temp = variantArtStatus(e.type) === "temp-tint";
  ctx.save();
  ctx.font = "900 11px system-ui";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  var bw = Math.max(52, label.length * 8 + 14);
  ctx.fillStyle = "#120c08e6";
  ctx.strokeStyle = variantBarColor(e.type) || "#f2e6d2";
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  if (ctx.roundRect) ctx.roundRect(-bw / 2, -72, bw, 16, 4);
  else ctx.rect(-bw / 2, -72, bw, 16);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = variantBarColor(e.type) || "#f2e6d2";
  ctx.fillText(label, 0, -64);
  ctx.restore();
  if (temp) drawTempBadge(ctx, -80);
}

export function drawVariantSprite(ctx, e, options) {
  if (!ctx || !e) return false;
  var kind = VARIANT_KINDS[e.type];
  if (!kind) return false;
  if (drawOfficialVariant(ctx, e, options)) return true;
  options = options || {};
  var proxy = Object.assign({}, e, { type: kind.fallbackSheet });
  ctx.save();
  if (variantArtStatus(e.type) === "temp-tint") ctx.filter = kind.tempTint;
  var drawn = drawEnemyMonster(ctx, proxy, options);
  if (!drawn) drawn = drawSoldier(ctx, proxy, Object.assign({}, options, { team: "enemy" }));
  ctx.restore();
  return drawn;
}

export function drawVariantOverlays(ctx, e) {
  if (!ctx || !e || e.dead) return;
  drawWorldLabel(ctx, e);
  if ((e.healFlash || 0) > 0 || (e.healing && e.type === "medic")) {
    ctx.save();
    ctx.fillStyle = "#3ee36a";
    ctx.strokeStyle = "#0b3a18";
    ctx.lineWidth = 1.3;
    ctx.beginPath();
    ctx.rect(-2.1, -102, 4.2, 16);
    ctx.rect(-7, -96.2, 14, 4.2);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }
}
