import {
  isLineBlocked,
  isSightBlocked,
  getHitChance,
} from "./cover.js?v=20260908-137";
import { weaponCopy } from "./weapons.js?v=20260908-137";
import { fillEmptySquadAttachments } from "./attachments.js?v=20260908-137";
import { AudioBus } from "./audio.js?v=20260908-137";
import {
  pickTacticalCover,
  applyCoverChoice,
  moveTowardTarget,
  faceThreat,
  coverStillUseful,
  peekPoint,
  repathIfSlotContested,
} from "./combatAI.js?v=20260908-137";
import {
  CHARACTER_STATS,
  mitigateDamage,
  combatAccuracy,
  attackDamage,
  creditKill,
} from "./combatStats.js?v=20260908-137";
import { recoverInCover, shouldRecover } from "./recoveryAI.js?v=20260908-137";
import {
  isCoverFull,
  occupancyPenalty,
  occupiesCoverSlot,
  reserveCoverSlot,
} from "./coverSlots.js?v=20260908-137";
import {
  spraySuppression,
  tickSuppression,
  suppressionAccuracyDelta,
} from "./suppression.js?v=20260908-137";
import { updateDownedCrawl } from "./downedCrawl.js?v=20260908-137";
import {
  currentPushGoal,
  pushGoalKey,
} from "./streetObjectives.js?v=20260908-137";
import { isStreetBreathing } from "./streetBeat.js?v=20260908-137";
import {
  tagSquadFireteams,
  updateFireteams,
  isFireteamOverwatch,
  isFireteamBounding,
  boundSpeedScale,
  hopCoversAhead,
} from "./fireteams.js?v=20260908-137";
import { orderAccuracy, orderDefense } from "./squadDialog.js?v=20260908-137";
import {
  isLeo,
  leoSword,
  leoSidearmFromLoadout,
  tickLeoTimers,
  updateLeoKnight,
} from "./leoKnight.js?v=20260908-137";
import { knifeWeapon, ignoresCover, tickMeleeTimer } from "./melee.js?v=20260908-137";
import {
  preferShootTargets,
  engagedTargetPenalty,
  updateEngagedFight,
  tryStartMelee,
  closeForMelee,
  tickEngaged,
  canRegen,
} from "./engaged.js?v=20260908-137";
import { applyIncomingHostileDamage } from "./enemyVariants.js?v=20260908-137";
import {
  tickSquadAbilities,
  abilityBusy,
  hasPerfectHit,
} from "./squadAbilities.js?v=20260908-137";
export const MARINE_AGGRO = {
  engageRangeFactor: 0.4,
  engageRangeCap: 700,
  leapRangeFactor: 1.18,
  coveredDwell: 0.26,
  peekMin: 1.18,
  peekMax: 1.85,
  peekShotsMin: 6,
  peekShotsExtra: 4,
  reposition: 0.38,
  advanceSpeed: 1.18,
  desiredRangeFactor: 0.52,
  flankWeight: 260,
  pushHp: 0.42,
  pushDamageGrace: 0.75,
  pushSuppression: 0.28,
  pushHoldDistance: 500,
  pushFarDistance: 880,
  pushRangeFactor: 0.78,
  behindFront: 120,
};
export const SQUAD_AGGRO = {
  recoverPct: 0.1,
  coveredDwell: 0.09,
  peekMin: 2.35,
  peekMax: 3.65,
  peekShotsMin: 14,
  peekShotsExtra: 9,
  reposition: 0.16,
  engageRangeFactor: 0.42,
  advanceSpeed: 1.22,
  followLag: 56,
  followCatch: 1.28,
};
function marineTuned(a) {
  return a && a.isMarine ? MARINE_AGGRO : null;
}
export const SQUAD_MODES = ["AGGRESSIVE", "FOLLOW", "HOLD"];
export function normalizeSquadMode(mode) {
  if (mode === "ASSAULT" || mode === "PUSH") return "AGGRESSIVE";
  if (mode === "FOCUS") return "FOLLOW";
  if (SQUAD_MODES.indexOf(mode) >= 0) return mode;
  return "FOLLOW";
}
function isAggressiveMode(mode) {
  return normalizeSquadMode(mode) === "AGGRESSIVE";
}
function isHoldMode(mode) {
  return normalizeSquadMode(mode) === "HOLD";
}
var squadMode = "FOLLOW";
var SQUAD = [
  {
    name: "Rook",
    weapon: "rifle",
    role: "assault",
    speed: 205,
    hp: CHARACTER_STATS.Rook.hp,
    defense: CHARACTER_STATS.Rook.defense,
    accuracy: CHARACTER_STATS.Rook.accuracy,
    regen: CHARACTER_STATS.Rook.regen,
    damage: CHARACTER_STATS.Rook.damage,
  },
  {
    name: "Viper",
    weapon: "smg",
    role: "flanker",
    speed: 235,
    hp: CHARACTER_STATS.Viper.hp,
    defense: CHARACTER_STATS.Viper.defense,
    accuracy: CHARACTER_STATS.Viper.accuracy,
    regen: CHARACTER_STATS.Viper.regen,
    damage: CHARACTER_STATS.Viper.damage,
  },
  {
    name: "Doc",
    weapon: "dmr",
    role: "marksman",
    speed: 180,
    hp: CHARACTER_STATS.Doc.hp,
    defense: CHARACTER_STATS.Doc.defense,
    accuracy: CHARACTER_STATS.Doc.accuracy,
    regen: CHARACTER_STATS.Doc.regen,
    damage: CHARACTER_STATS.Doc.damage,
  },
  {
    name: "Leo",
    weapon: "pistol",
    role: "knight",
    speed: 168,
    hp: CHARACTER_STATS.Leo.hp,
    defense: CHARACTER_STATS.Leo.defense,
    accuracy: CHARACTER_STATS.Leo.accuracy,
    regen: CHARACTER_STATS.Leo.regen,
    damage: CHARACTER_STATS.Leo.damage,
  },
];
function syncCommandButtons() {
  document
    .querySelectorAll("#squadCommands [data-command]")
    .forEach((button) => {
      const active = button.dataset.command === squadMode;
      button.classList.toggle("active", active);
      button.setAttribute("aria-pressed", String(active));
    });
}
export function resetSquadCommands() {
  squadMode = "FOLLOW";
  window.squadMode = squadMode;
  syncCommandButtons();
}
function wireSquadCommands() {
  document
    .querySelectorAll("#squadCommands [data-command]")
    .forEach(function (b, i) {
      b.classList.toggle("active", normalizeSquadMode(b.dataset.command) === "FOLLOW");
      b.addEventListener("pointerdown", function (e) {
        e.preventDefault();
        squadMode = normalizeSquadMode(b.dataset.command || "FOLLOW");
        window.squadMode = squadMode;
        syncCommandButtons();
      });
    });
}
if (typeof window !== "undefined") {
  window.squadMode = "FOLLOW";
  if (document.readyState === "loading")
    window.addEventListener("DOMContentLoaded", wireSquadCommands);
  else wireSquadCommands();
}
export function createAllies() {
  var starts = [
      [-70, 170],
      [75, 185],
      [0, 260],
      [155, 230],
    ],
    chosen = window.__selectedLoadout || {};
  var allies = SQUAD.map(function (s, i) {
    var pos = starts[i];
    var entry = chosen[s.name];
    var knight = s.role === "knight";
    var weaponId = s.weapon;
    var attachmentIds = null;
    if (typeof entry === "string") weaponId = entry;
    else if (entry && typeof entry === "object") {
      weaponId = entry.weapon || s.weapon;
      attachmentIds = entry.attachments;
    }
    if (!knight) attachmentIds = fillEmptySquadAttachments(attachmentIds);
    return {
      name: s.name,
      role: s.role,
      knight: knight,
      meleePrefer: knight,
      weapon: knight ? leoSword() : weaponCopy(weaponId, attachmentIds),
      sidearm: knight ? leoSidearmFromLoadout(entry) : null,
      weaponSlot: knight ? "melee" : "primary",
      blocking: false,
      melee: knight ? leoSword() : knifeWeapon(),
      meleeTimer: 0,
      abilityCooldown: 2.4 + i * 1.15,
      engaged: false,
      x: pos[0],
      y: pos[1],
      hp: s.hp,
      maxHp: s.hp,
      defense: s.defense,
      accuracy: s.accuracy,
      damageBonus: s.damage,
      dead: false,
      downed: false,
      downTimer: 0,
      downDuration: 11,
      reviveTimer: 0,
      reviveDuration: 2.5,
      deathTimer: 0,
      deathDuration: 0.8,
      muzzle: 0,
      hit: 0,
      targetX: pos[0],
      targetY: pos[1],
      cover: null,
      coverSlotIndex: i,
      speed: s.speed,
      facingX: 1,
      facingY: 0,
      timeSinceDamage: 99,
      regenDelay: 3,
      regenRate: s.regen,
      callout: "",
      calloutTimer: 0,
      reloadTimer: 0,
      reloading: false,
      kills: 0,
      flankSide: i === 1 ? -1 : 1,
      combatState: "seeking",
      combatTimer: 0,
      shotsLeft: 0,
      coverAnchorX: pos[0],
      coverAnchorY: pos[1],
      exposed: true,
      repositionCooldown: i * 0.18,
      recovering: false,
    };
  });
  window.__battleAllies = allies;
  tagSquadFireteams(allies);
  return allies;
}
function activeEnemy(e) {
  return !!e && !e.dead && !e.downed && e.hp > 0 && !(e.spawnTimer > 0);
}
function chooseCombatEnemy(a, enemies, covers, friendlies, player, mode) {
  mode = normalizeSquadMode(mode);
  var pool = preferShootTargets(enemies);
  var best = null,
    bestDistance = Infinity,
    bestScore = -Infinity;
  pool.forEach(function (e) {
    if (!activeEnemy(e)) return;
    var d = Math.hypot(a.x - e.x, a.y - e.y),
      blocked = isSightBlocked(a, e, covers),
      focusCount = friendlies.filter(function (friendly) {
        return friendly !== a && friendly.combatTarget === e;
      }).length,
      healthPressure = 1 - e.hp / Math.max(1, e.maxHp),
      score = Math.max(0, 1700 - d) * 0.04 + healthPressure * 76;
    score += blocked ? -16 : 26;
    score += e.exposed ? 24 : -9;
    score += engagedTargetPenalty(e);
    // Coordinate on wounded/high-value threats instead of constantly splitting fire.
    score += focusCount * (healthPressure > 0.55 ? 22 : -28);
    if (e.type === "sniper") score += 52;
    else if (e.type === "heavy") score += a.role === "marksman" ? 44 : 24;
    else if (e.type === "shotgunner" && d < 650) score += 48;
    if (e.combatTarget === a) score += 72;
    else if (e.combatTarget === player) score += 36;
    else if (e.combatTarget && !e.combatTarget.dead) score += 18;
    if (e === a.combatTarget) score += 34;
    if (a.role === "flanker" && d < 700 && e.exposed) score += 20;
    if (a.role === "knight" && d < 480) score += 36;
    if (score > bestScore) {
      bestScore = score;
      best = e;
      bestDistance = d;
    }
  });
  return { target: best, dist: bestDistance };
}
function reload(a) {
  if (!a.reloading) {
    a.reloading = true;
    a.reloadTimer = a.weapon.reload;
    AudioBus.playReload({ volume: 0.55 });
  }
}
function shoot(a, e, spawnProjectile, covers, accuracyModifier) {
  if (
    a.dead ||
    a.downed ||
    a.reloading ||
    a.weapon.ammo <= 0 ||
    a.weapon.fireCooldown > 0
  )
    return;
  var chance = hasPerfectHit(a)
      ? 100
      : combatAccuracy(
          getHitChance(a, e, covers),
          a.weapon.accuracy,
          a.accuracy,
          suppressionAccuracyDelta(a) + orderAccuracy(a) + (accuracyModifier || 0),
        ),
    hit = Math.random() * 100 < chance;
  a.weapon.ammo--;
  a.weapon.fireCooldown = a.weapon.cooldown;
  AudioBus.playFire(a.weapon, { volume: 0.48, priority: 2 });
  a.muzzle = 0.12;
  a.shotsLeft = Math.max(0, (a.shotsLeft || 1) - 1);
  if (spawnProjectile) spawnProjectile(a, e, "ally", hit ? 1 : 0);
  spraySuppression(a, e, (typeof window !== "undefined" && window.__battleEnemies) || [], true);
  if (hit) {
    var dealt = applyIncomingHostileDamage(
      e,
      attackDamage(a.weapon.damage, a.damageBonus),
      a,
      { melee: false },
    );
    e.hp = Math.max(0, e.hp - dealt);
    e.lastDamageTaken = dealt;
    e.hit = 0.18;
    if (e.hp <= 0) {
      e.dead = true;
      e.deathTimer = 0;
      creditKill(a);
    }
  }
  if (a.weapon.ammo <= 0) reload(a);
}
function updateRevive(a, allies, player, dt) {
  var best = null,
    bd = Infinity;
  allies.concat([player]).forEach(function (t) {
    if (t !== a && t.downed && !t.dead && t.canBeRevived !== false) {
      var d = Math.hypot(a.x - t.x, a.y - t.y);
      if (d < bd) {
        bd = d;
        best = t;
      }
    }
  });
  if (!best) return false;
  if (bd > 62) {
    a.cover = null;
    a.targetX = best.x;
    a.targetY = best.y;
    moveTowardTarget(a, dt);
    return true;
  }
  best.reviveTimer = (best.reviveTimer || 0) + dt;
  if (best.reviveTimer >= best.reviveDuration) {
    if (best.revive) best.revive();
    else {
      best.downed = false;
      best.hp = Math.max(30, Math.round(best.maxHp * 0.4));
      best.reviveTimer = 0;
    }
  }
  return true;
}
function claimed(choice, a, allies) {
  if (!choice || !choice.cover) return true;
  if (isCoverFull(choice.cover, allies, a)) return true;
  return false;
}
function advanceToMission(a, mission, covers, friendlies, dt, threats) {
  var street =
    typeof window !== "undefined" ? window.__streetObjectives : null;
  var goal = currentPushGoal(mission, street) || (mission && mission.objective);
  if (!goal) return false;
  var goalDistance = Math.hypot(goal.x - a.x, goal.y - a.y);
  var key = pushGoalKey(goal);
  if (a.lastPushGoalKey && a.lastPushGoalKey !== key) {
    a.missionPause = 0;
    if (a.cover && Number.isFinite(a.coverAnchorX)) {
      var stayDist = Math.hypot(
        a.coverAnchorX - goal.x,
        a.coverAnchorY - goal.y,
      );
      if (stayDist > goalDistance - 80) {
        a.cover = null;
        a.combatState = "seeking";
        a.exposed = true;
      }
    }
  }
  a.lastPushGoalKey = key;
  threats = (threats || []).filter(activeEnemy);
  var primaryThreat = threats[0] || null;
  if (goalDistance <= goal.radius * 0.72) {
    a.exposed = false;
    a.combatState = "covered";
    a.targetX = a.x;
    a.targetY = a.y;
    return true;
  }
  if (a.cover && a.combatState === "seeking") {
    repathIfSlotContested(a, primaryThreat, covers, friendlies, {
      advance: true,
      advancePoint: goal,
      minThreat: 10,
      maxThreat: 4000,
      maxTravel: 1600,
    });
    a.exposed = true;
    if (!a.cover) {
      moveTowardTarget(a, dt, a.aggressiveAdvance ? 1.16 : 1.05);
      return true;
    }
    if (moveTowardTarget(a, dt, a.aggressiveAdvance ? 1.12 : 1)) {
      a.x = a.coverAnchorX;
      a.y = a.coverAnchorY;
      a.combatState = "covered";
      a.exposed = false;
      a.missionPause = 0.5 + Math.random() * 0.35;
    }
    return true;
  }
  a.missionPause = Math.max(0, (a.missionPause || 0) - dt);
  if (a.missionPause > 0) return true;
  if (
    isFireteamOverwatch(a) &&
    !isLeo(a) &&
    a.cover &&
    occupiesCoverSlot(a, 58)
  ) {
    a.exposed = false;
    a.combatState = "covered";
    a.targetX = a.coverAnchorX;
    a.targetY = a.coverAnchorY;
    a.missionPause = 0.18;
    return true;
  }
  var hopPool = isFireteamBounding(a) ? hopCoversAhead(a, covers) : covers;
  var best = null,
    bestScore = Infinity;
  hopPool.forEach(function (cover) {
    if (!cover || cover.destroyed) return;
    var travel = Math.hypot(cover.x - a.x, cover.y - a.y),
      remaining = Math.hypot(cover.x - goal.x, cover.y - goal.y);
    if (travel < 90 || travel > 920 || remaining > goalDistance - 100) return;
    var slot = reserveCoverSlot(cover, a, primaryThreat, friendlies);
    if (!slot) return;
    var choice = { cover: cover, slot: slot };
    if (claimed(choice, a, friendlies)) return;
    var exposedTo = 0;
    threats.forEach(function (threat) {
      if (!isLineBlocked(slot, threat, [cover])) exposedTo++;
    });
    var score =
      remaining * 0.55 + travel * 0.3 + occupancyPenalty(cover, friendlies, a);
    if (
      a.isMarine &&
      typeof window !== "undefined" &&
      window.__battlePlayer &&
      cover === window.__battlePlayer.cover
    )
      score += 2400;
    if (cover.type === "wide" || cover.type === "car") score -= 90;
    score += exposedTo * 260;
    if (primaryThreat && isLineBlocked(slot, primaryThreat, [cover])) score -= 140;
    score += Math.random() * 35;
    if (score < bestScore) {
      bestScore = score;
      best = choice;
    }
  });
  if (best) {
    applyCoverChoice(a, best);
    a.combatState = "seeking";
    a.exposed = true;
    return true;
  }
  // No leapfrog slot — keep walking so a finished street task cannot freeze AI.
  if (isFireteamOverwatch(a) && a.cover && !isLeo(a)) return true;
  a.cover = null;
  a.targetX = goal.x + ((a.coverSlotIndex || 0) - 1) * 72;
  a.targetY = goal.y + 70 + (a.isMarine ? 75 : 0);
  a.exposed = true;
  a.combatState = "seeking";
  moveTowardTarget(
    a,
    dt,
    (a.aggressiveAdvance ? 1.16 : 1.05) * boundSpeedScale(a),
  );
  return true;
}
function shouldPressObjective(a, e, d, covers, goal) {
  if (!goal) return false;
  var street =
    typeof window !== "undefined" ? window.__streetObjectives : null;
  var streetTask = goal.source === "street";
  var resumeFort =
    goal.source === "fort" &&
    street &&
    street.resumeForward &&
    !street.current;
  if (!streetTask && !resumeFort) return false;
  if (isHoldMode(squadMode) && !a.isMarine) return false;
  var tun = marineTuned(a);
  if (a.hp < a.maxHp * (tun ? tun.pushHp : 0.55)) return false;
  if ((a.suppressionTimer || 0) > (tun ? tun.pushSuppression : 0.2)) return false;
  if (a.timeSinceDamage < (tun ? tun.pushDamageGrace : 1.2)) return false;
  if (!e) return true;
  if (d < (tun ? tun.pushHoldDistance : 560)) return false;
  var blocked = isSightBlocked(a, e, covers);
  var hostileRange = e.weapon && e.weapon.range ? e.weapon.range : 1000;
  var far = tun ? tun.pushFarDistance : 1050;
  var rangeFactor = tun ? tun.pushRangeFactor : 0.85;
  return blocked || d > Math.min(far, hostileRange * rangeFactor);
}
export function updateAllies(
  allies,
  dt,
  player,
  covers,
  enemies,
  spawnProjectile,
  mode,
  otherFriendlies,
) {
  squadMode = normalizeSquadMode(mode || (typeof window !== "undefined" && window.squadMode) || squadMode);
  if (typeof window !== "undefined") window.squadMode = squadMode;
  updateFireteams(allies, otherFriendlies, dt);
  var friendlyTeam = allies.concat(otherFriendlies || []);
  // The player owns cover slots too. Excluding them let AI friendlies reserve
  // the same slot and physically pin the player against the barricade.
  if (player && friendlyTeam.indexOf(player) < 0) friendlyTeam.push(player);
  var slotCrowd = friendlyTeam.concat(enemies || []);
  var everyone = slotCrowd;
  if (!allies.length || !allies[0].isMarine) {
    tickSquadAbilities(
      allies,
      player,
      dt,
      covers,
      enemies,
      spawnProjectile,
      friendlyTeam,
    );
  }
  allies.forEach(function (a) {
    a.hit = Math.max(0, a.hit - dt);
    a.muzzle = Math.max(0, a.muzzle - dt);
    a.calloutTimer = Math.max(0, a.calloutTimer - dt);
    a.timeSinceDamage += dt;
    a.repositionCooldown = Math.max(0, a.repositionCooldown - dt);
    if (a.weapon.fireCooldown > 0)
      a.weapon.fireCooldown = Math.max(0, a.weapon.fireCooldown - dt);
    tickLeoTimers(a, dt);
    tickMeleeTimer(a, dt);
    tickEngaged(a, dt, everyone);
    if (a.dead) {
      a.deathTimer += dt;
      return;
    }
    if (a.hp <= 0 && !a.downed) {
      a.hp = 0;
      if (a.permanentDeath) {
        a.dead = true;
        a.deathTimer = 0;
        a.exposed = false;
        return;
      }
      a.downed = true;
      a.downTimer = 0;
    }
    if (a.downed) {
      if (!a.permanentDeath) {
        updateDownedCrawl(a, dt, covers, enemies);
        if (a.downTimer >= a.downDuration) {
          a.dead = true;
          a.downed = false;
        }
      }
      return;
    }
    tickSuppression(a, dt);
    if (a.reloading) {
      a.reloadTimer -= dt;
      if (a.reloadTimer <= 0) {
        a.reloading = false;
        a.weapon.ammo = a.weapon.magazine;
        if (a.sidearm) {
          a.sidearm.ammo = a.sidearm.magazine;
          a.sidearm.reserve = Infinity;
        }
      }
    }
    if (
      canRegen(a) &&
      a.regenRate > 0 &&
      a.hp < a.maxHp &&
      a.timeSinceDamage > a.regenDelay
    )
      a.hp = Math.min(a.maxHp, a.hp + a.regenRate * dt);
    if (abilityBusy(a)) return;
    if (a.engaged && updateEngagedFight(a, dt, everyone)) return;
    var pick = chooseCombatEnemy(
        a,
        enemies,
        covers,
        friendlyTeam,
        player,
        squadMode,
      ),
      e = pick.target,
      d = pick.dist,
      tun = marineTuned(a),
      aggressiveAdvance =
        (!!a.aggressiveAdvance && a.isMarine) ||
        (isAggressiveMode(squadMode) && !a.isMarine),
      peekTun = tun || (!a.isMarine ? SQUAD_AGGRO : null),
      engagementRange = aggressiveAdvance
        ? Math.min(
            a.weapon.range * (tun ? tun.engageRangeFactor : SQUAD_AGGRO.engageRangeFactor),
            tun ? tun.engageRangeCap : 760,
          )
        : a.weapon.range * 0.82;
    var mission =
        typeof window !== "undefined" ? window.__streetMission : null,
      street =
        typeof window !== "undefined" ? window.__streetObjectives : null,
      activeGoal = currentPushGoal(mission, street),
      streetBreathing = isStreetBreathing(street),
      objectivePush =
        !streetBreathing &&
        shouldPressObjective(a, e, d, covers, activeGoal);
    a.objectiveAdvancePaused = streetBreathing || (!!e && !objectivePush);
    if (streetBreathing) {
      a.objectiveHold = true;
      if (e) faceThreat(a, e);
      if (a.cover && Number.isFinite(a.coverAnchorX)) {
        a.targetX = a.coverAnchorX;
        a.targetY = a.coverAnchorY;
        a.combatState = "covered";
        a.exposed = false;
        moveTowardTarget(a, dt, 1.05);
      }
      if (e && a.weapon.ammo > 0 && !a.reloading && d <= a.weapon.range * 0.72)
        shoot(a, e, spawnProjectile, covers, -6);
      return;
    }
    if (!Object.prototype.hasOwnProperty.call(a, "combatTarget"))
      Object.defineProperty(a, "combatTarget", {
        value: e,
        writable: true,
        configurable: true,
      });
    else a.combatTarget = e;
    if (e && tryStartMelee(a, e, everyone) && updateEngagedFight(a, dt, everyone))
      return;
    if (ignoresCover(a) && e) {
      if (isLeo(a)) {
        updateLeoKnight(a, dt, e, d, covers, slotCrowd, spawnProjectile, squadMode);
        return;
      }
      closeForMelee(a, e, dt, 1.2);
      if (d <= a.weapon.range && a.weapon.role !== "melee" && !isSightBlocked(a, e, covers))
        shoot(a, e, spawnProjectile, covers, -10);
      return;
    }
    if (
      a.canRecover !== false &&
      !ignoresCover(a) &&
      shouldRecover(a)
    ) {
      if (e) faceThreat(a, e);
      recoverInCover(a, e, covers, slotCrowd, dt);
      return;
    }
    if (
      squadMode === "FOLLOW" &&
      player &&
      !player.dead &&
      !player.downed &&
      !a.isMarine &&
      a.y > player.y + SQUAD_AGGRO.followLag
    ) {
      a.cover = null;
      a.exposed = true;
      a.targetX = player.x + ((a.coverSlotIndex || 0) - 1) * 72;
      a.targetY = player.y + 36;
      moveTowardTarget(a, dt, SQUAD_AGGRO.followCatch);
      if (e && d <= a.weapon.range && !isSightBlocked(a, e, covers))
        shoot(a, e, spawnProjectile, covers, -8);
      if (a.y > player.y + SQUAD_AGGRO.followLag * 0.55) return;
    }
    var reviveSafe =
      !e ||
      d > 900 ||
      (d > 620 &&
        a.cover &&
        isLineBlocked({ x: a.x, y: a.y }, e, covers));
    if (
      a.canRevive !== false &&
      reviveSafe &&
      updateRevive(a, friendlyTeam, player, dt)
    )
      return;
    if ((!e || objectivePush) && mission) {
      advanceToMission(
        a,
        mission,
        covers,
        slotCrowd,
        dt,
        objectivePush ? enemies : [],
      );
      return;
    }
    if (!e) {
      a.cover = null;
      a.blocking = false;
      a.targetX = player.x + ((a.coverSlotIndex || 0) - 1) * 72;
      a.targetY = player.y + 36;
      moveTowardTarget(a, dt, squadMode === "FOLLOW" ? 1.16 : 1);
      return;
    }
    if (
      isLeo(a) &&
      updateLeoKnight(a, dt, e, d, covers, slotCrowd, spawnProjectile, squadMode)
    )
      return;
    var defendingObjective = !!(
      a.isMarine &&
      mission &&
      mission.captured
    );
    faceThreat(a, e);
    var inSlot = occupiesCoverSlot(a, 58);
    if (a.cover && a.cover.destroyed) {
      a.cover = null;
      inSlot = false;
    }
    if (
      inSlot &&
      !a.reloading &&
      a.weapon.ammo <= Math.ceil(a.weapon.magazine * 0.3) &&
      d > 380
    ) {
      reload(a);
      a.exposed = false;
      a.combatState = "covered";
      return;
    }
    var availableCovers = defendingObjective
      ? covers.filter(function (cover) {
          return (
            Math.hypot(
              cover.x - mission.objective.x,
              cover.y - mission.objective.y,
            ) < 700
          );
        })
      : covers;
    if (a.isMarine && player && player.cover) {
      var marineAlternatives = availableCovers.filter(function (cover) {
        return cover !== player.cover;
      });
      if (marineAlternatives.length) availableCovers = marineAlternatives;
    }
    var useful = inSlot && coverStillUseful(a, e, covers, 80, 2000);
    var headingToSlot = !!(a.cover && !inSlot && Number.isFinite(a.coverAnchorX));
    if (headingToSlot || (a.cover && Number.isFinite(a.coverSlotIndex) && !inSlot)) {
      repathIfSlotContested(a, e, availableCovers, slotCrowd, {
        slotPriority: true,
        allowUnprotected: true,
        advance: aggressiveAdvance,
        desiredRange: aggressiveAdvance
          ? tun
            ? Math.min(a.weapon.range * tun.desiredRangeFactor, tun.engageRangeCap)
            : engagementRange
          : Math.min(a.weapon.range * 0.68, 1050),
        threats: enemies.filter(activeEnemy),
        minThreat: 50,
        maxThreat: 2400,
        maxTravel: 1500,
      });
      inSlot = occupiesCoverSlot(a, 58);
      headingToSlot = !!(a.cover && !inSlot && Number.isFinite(a.coverAnchorX));
    }
    var frontY = a.y;
    if (player && !player.dead && !player.downed) frontY = Math.min(frontY, player.y);
    friendlyTeam.forEach(function (f) {
      if (f && f !== a && !f.dead && !f.downed) frontY = Math.min(frontY, f.y);
    });
    var pinned =
      a.timeSinceDamage < 0.55 || (a.suppressionTimer || 0) > 0.35;
    var behindFront = !!(
      (tun && a.y > frontY + tun.behindFront) ||
      (aggressiveAdvance && a.y > frontY + 90)
    );
    var hold = isHoldMode(squadMode);
    var teamHold = isFireteamOverwatch(a);
    var teamBound = isFireteamBounding(a);
    var shouldLeap =
      inSlot &&
      !pinned &&
      !hold &&
      (teamBound ||
        (aggressiveAdvance &&
          !teamHold &&
          (d > engagementRange * (tun ? tun.leapRangeFactor : 1.2) ||
            behindFront)));
    if (teamHold && useful && inSlot) shouldLeap = false;
    var seekPool =
      teamBound && shouldLeap ? hopCoversAhead(a, availableCovers) : availableCovers;
    if (
      !ignoresCover(a) &&
      ((!inSlot && !headingToSlot) ||
        shouldLeap ||
        (!useful && inSlot && !hold)) &&
      a.repositionCooldown <= 0
    ) {
      var choice = pickTacticalCover(a, e, seekPool, slotCrowd, {
        maxTravel: 1500,
        minThreat: 50,
        maxThreat: 2400,
        desiredRange: aggressiveAdvance
          ? tun
            ? Math.min(a.weapon.range * tun.desiredRangeFactor, tun.engageRangeCap)
            : engagementRange
          : Math.min(a.weapon.range * 0.68, 1050),
        flankSide: a.flankSide,
        flankWeight: tun
          ? tun.flankWeight
          : aggressiveAdvance
            ? 230
            : 150,
        forceNew: shouldLeap || (!useful && inSlot),
        slotPriority: true,
        allowUnprotected: true,
        advance: aggressiveAdvance,
        threats: enemies.filter(activeEnemy),
      });
      if (choice && !claimed(choice, a, slotCrowd)) {
        applyCoverChoice(a, choice);
        a.combatState = "seeking";
        a.repositionCooldown = aggressiveAdvance
          ? tun
            ? tun.reposition
            : SQUAD_AGGRO.reposition
          : 0.85;
        inSlot = false;
      }
    }
    if (a.cover && !inSlot) {
      a.combatState = "seeking";
      a.exposed = true;
      // Keep pressure on visible targets while changing cover, with a movement penalty.
      if (
        d <= a.weapon.range * 0.92 &&
        !isSightBlocked(a, e, covers)
      )
        shoot(a, e, spawnProjectile, covers, -12);
      moveTowardTarget(
        a,
        dt,
        (aggressiveAdvance ? SQUAD_AGGRO.advanceSpeed : 1.18) * boundSpeedScale(a),
      );
      if (occupiesCoverSlot(a, 18)) {
        a.x = a.coverAnchorX;
        a.y = a.coverAnchorY;
        a.combatState = "covered";
        a.exposed = false;
        a.combatTimer = peekTun ? peekTun.coveredDwell : 0.45;
      }
      return;
    }
    if (inSlot) {
      if (a.combatState === "seeking" || !a.combatState) {
        if (Number.isFinite(a.coverAnchorX)) {
          a.x = a.coverAnchorX;
          a.y = a.coverAnchorY;
        }
        a.combatState = "covered";
        a.exposed = false;
        a.combatTimer = peekTun ? peekTun.coveredDwell : 0.45;
      }
      a.combatTimer -= dt;
      if (a.combatState === "covered" && a.combatTimer <= 0) {
        a.combatState = "exposed";
        a.exposed = true;
        a.combatTimer = peekTun
          ? Math.max(
              peekTun.peekMin,
              Math.min(peekTun.peekMax, a.weapon.cooldown * 2.1 + 0.4),
            )
          : Math.max(1.05, Math.min(1.7, a.weapon.cooldown * 2.35 + 0.45));
        a.shotsLeft = peekTun
          ? peekTun.peekShotsMin + Math.floor(Math.random() * peekTun.peekShotsExtra)
          : 5 + Math.floor(Math.random() * 4);
      } else if (a.combatState === "exposed") {
        var pp = peekPoint(a, e, 36);
        a.targetX = pp.x;
        a.targetY = pp.y;
        moveTowardTarget(a, dt);
        if (d <= a.weapon.range) shoot(a, e, spawnProjectile, covers);
        if (a.combatTimer <= 0 || a.shotsLeft <= 0) {
          a.combatState = "covered";
          a.exposed = false;
          a.targetX = a.coverAnchorX;
          a.targetY = a.coverAnchorY;
          a.combatTimer = peekTun
            ? peekTun.coveredDwell * 0.7 + Math.random() * 0.12
            : 0.32 + Math.random() * 0.18;
        }
      } else {
        a.targetX = a.coverAnchorX;
        a.targetY = a.coverAnchorY;
        moveTowardTarget(a, dt, 1.08);
      }
      return;
    }
    if (d <= a.weapon.range) shoot(a, e, spawnProjectile, covers);
  });
}
