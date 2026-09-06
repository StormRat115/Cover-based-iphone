import {
  isLineBlocked,
  getHitChance,
  getCoverSlot,
} from "./cover.js?v=20260906-79";
import { weaponCopy } from "./weapons.js?v=20260906-79";
import { AudioBus } from "./audio.js?v=20260906-79";
import {
  pickTacticalCover,
  applyCoverChoice,
  moveTowardTarget,
  faceThreat,
  coverStillUseful,
  peekPoint,
} from "./combatAI.js?v=20260906-79";
import {
  CHARACTER_STATS,
  mitigateDamage,
  finalAccuracy,
  attackDamage,
} from "./combatStats.js?v=20260906-79";
import { recoverInCover, shouldRecover } from "./recoveryAI.js?v=20260906-79";
export const SQUAD_MODES = ["FOLLOW", "HOLD", "ASSAULT", "FOCUS"];
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
      b.classList.toggle("active", i === 0);
      b.addEventListener("pointerdown", function (e) {
        e.preventDefault();
        squadMode = b.dataset.command || "FOLLOW";
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
    ],
    chosen = window.__selectedLoadout || {};
  var allies = SQUAD.map(function (s, i) {
    var pos = starts[i];
    return {
      name: s.name,
      role: s.role,
      weapon: (function () {
        var entry = chosen[s.name];
        if (typeof entry === "string") return weaponCopy(entry);
        if (entry && typeof entry === "object")
          return weaponCopy(entry.weapon || s.weapon, entry.attachments);
        return weaponCopy(s.weapon);
      })(),
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
  return allies;
}
function activeEnemy(e) {
  return !!e && !e.dead && !e.downed && e.hp > 0 && !(e.spawnTimer > 0);
}
function chooseCombatEnemy(a, enemies, covers, friendlies, player, mode) {
  if (mode === "FOCUS" && activeEnemy(player.aimTarget))
    return {
      target: player.aimTarget,
      dist: Math.hypot(a.x - player.aimTarget.x, a.y - player.aimTarget.y),
    };
  var best = null,
    bestDistance = Infinity,
    bestScore = -Infinity;
  enemies.forEach(function (e) {
    if (!activeEnemy(e)) return;
    var d = Math.hypot(a.x - e.x, a.y - e.y),
      blocked = isLineBlocked(a, e, covers),
      focusCount = friendlies.filter(function (friendly) {
        return friendly !== a && friendly.combatTarget === e;
      }).length,
      healthPressure = 1 - e.hp / Math.max(1, e.maxHp),
      score = Math.max(0, 1700 - d) * 0.04 + healthPressure * 48;
    score += blocked ? -16 : 26;
    score += e.exposed ? 24 : -9;
    score -= focusCount * (healthPressure > 0.65 ? 9 : 55);
    if (e.type === "sniper") score += 52;
    else if (e.type === "heavy") score += a.role === "marksman" ? 44 : 24;
    else if (e.type === "shotgunner" && d < 650) score += 48;
    if (e.combatTarget === a) score += 72;
    else if (e.combatTarget === player) score += 36;
    else if (e.combatTarget && !e.combatTarget.dead) score += 18;
    if (e === a.combatTarget) score += 16;
    if (a.role === "flanker" && d < 700 && e.exposed) score += 20;
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
function shoot(a, e, spawnProjectile, covers) {
  if (
    a.dead ||
    a.downed ||
    a.reloading ||
    a.weapon.ammo <= 0 ||
    a.weapon.fireCooldown > 0
  )
    return;
  var chance = finalAccuracy(
      getHitChance(a, e, covers),
      a.weapon.accuracy,
      a.accuracy,
    ),
    hit = Math.random() * 100 < chance;
  a.weapon.ammo--;
  a.weapon.fireCooldown = a.weapon.cooldown;
  AudioBus.playFire(a.weapon, { volume: 0.48, priority: 2 });
  a.muzzle = 0.12;
  a.shotsLeft = Math.max(0, (a.shotsLeft || 1) - 1);
  if (spawnProjectile) spawnProjectile(a, e, "ally", hit ? 1 : 0);
  if (hit) {
    var dealt = mitigateDamage(
      attackDamage(a.weapon.damage, a.damageBonus),
      e.defense,
    );
    e.hp = Math.max(0, e.hp - dealt);
    e.lastDamageTaken = dealt;
    e.hit = 0.18;
    if (e.hp <= 0) {
      e.dead = true;
      e.deathTimer = 0;
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
  return (
    choice &&
    allies.some(function (o) {
      return o !== a && !o.dead && !o.downed && o.cover === choice.cover;
    })
  );
}
function advanceToMission(a, mission, covers, friendlies, dt) {
  if (!mission || !mission.objective) return false;
  var goal = mission.objective,
    goalDistance = Math.hypot(goal.x - a.x, goal.y - a.y);
  if (goalDistance <= goal.radius * 0.72) {
    a.exposed = false;
    a.combatState = "covered";
    a.targetX = a.x;
    a.targetY = a.y;
    return true;
  }
  if (a.cover && a.combatState === "seeking") {
    a.exposed = true;
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
  var best = null,
    bestScore = Infinity;
  covers.forEach(function (cover) {
    var travel = Math.hypot(cover.x - a.x, cover.y - a.y),
      remaining = Math.hypot(cover.x - goal.x, cover.y - goal.y);
    if (travel < 90 || travel > 920 || remaining > goalDistance - 100) return;
    var choice = {
      cover: cover,
      slot: Object.assign(getCoverSlot(cover, a, null), {
        index: a.coverSlotIndex || 0,
      }),
    };
    if (claimed(choice, a, friendlies)) return;
    var users = friendlies.filter(function (other) {
      return other !== a && !other.dead && other.cover === cover;
    }).length;
    var score = remaining * 0.55 + travel * 0.3 + users * 260;
    if (cover.type === "wide" || cover.type === "car") score -= 90;
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
  // The final short crossing is inside the fortified capture perimeter.
  if (goalDistance < goal.radius + 260) {
    a.cover = null;
    a.targetX = goal.x + ((a.coverSlotIndex || 0) - 1) * 72;
    a.targetY = goal.y + 70 + (a.isMarine ? 75 : 0);
    moveTowardTarget(a, dt, 1.05);
    return true;
  }
  return true;
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
  squadMode = mode || window.squadMode || squadMode;
  var friendlyTeam = allies.concat(otherFriendlies || []);
  allies.forEach(function (a) {
    a.hit = Math.max(0, a.hit - dt);
    a.muzzle = Math.max(0, a.muzzle - dt);
    a.calloutTimer = Math.max(0, a.calloutTimer - dt);
    a.timeSinceDamage += dt;
    a.repositionCooldown = Math.max(0, a.repositionCooldown - dt);
    if (a.weapon.fireCooldown > 0)
      a.weapon.fireCooldown = Math.max(0, a.weapon.fireCooldown - dt);
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
      a.downTimer += dt;
      if (a.downTimer >= a.downDuration) {
        a.dead = true;
        a.downed = false;
      }
      return;
    }
    if (a.reloading) {
      a.reloadTimer -= dt;
      if (a.reloadTimer <= 0) {
        a.reloading = false;
        a.weapon.ammo = a.weapon.magazine;
      }
    }
    if (a.regenRate > 0 && a.hp < a.maxHp && a.timeSinceDamage > a.regenDelay)
      a.hp = Math.min(a.maxHp, a.hp + a.regenRate * dt);
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
      aggressiveAdvance = !!a.aggressiveAdvance && squadMode === "ASSAULT",
      engagementRange = aggressiveAdvance
        ? Math.min(a.weapon.range * 0.48, 760)
        : a.weapon.range * 0.82;
    a.objectiveAdvancePaused = !!e;
    if (!Object.prototype.hasOwnProperty.call(a, "combatTarget"))
      Object.defineProperty(a, "combatTarget", {
        value: e,
        writable: true,
        configurable: true,
      });
    else a.combatTarget = e;
    if (a.canRecover !== false && shouldRecover(a)) {
      if (e) faceThreat(a, e);
      recoverInCover(a, e, covers, friendlyTeam, dt);
      return;
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
    var mission =
      typeof window !== "undefined" ? window.__streetMission : null;
    if (!e && mission) {
      advanceToMission(a, mission, covers, friendlyTeam, dt);
      return;
    }
    if (!e) {
      a.cover = null;
      a.targetX = player.x + (a.coverSlotIndex - 1) * 90;
      a.targetY = player.y + 100;
      moveTowardTarget(a, dt);
      return;
    }
    var defendingObjective = !!(
      a.isMarine &&
      mission &&
      mission.captured
    );
    faceThreat(a, e);
    if (
      a.cover &&
      !a.reloading &&
      a.weapon.ammo <= Math.ceil(a.weapon.magazine * 0.3) &&
      d > 380
    ) {
      reload(a);
      a.exposed = false;
      a.combatState = "covered";
      return;
    }
    var blocked = isLineBlocked(a, e, covers);
    if (
      (!a.cover ||
        !coverStillUseful(a, e, covers) ||
        blocked ||
        (aggressiveAdvance && d > engagementRange * 1.28)) &&
      a.repositionCooldown <= 0 &&
      squadMode !== "HOLD"
    ) {
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
      var choice = pickTacticalCover(a, e, availableCovers, friendlyTeam, {
        maxTravel: aggressiveAdvance ? 1100 : 760,
        desiredRange: aggressiveAdvance
          ? engagementRange
          : Math.min(a.weapon.range * 0.68, 1050),
        flankSide: a.flankSide,
        flankWeight: aggressiveAdvance ? 230 : 150,
        forceNew: aggressiveAdvance && d > engagementRange * 1.28,
        threats: enemies.filter(activeEnemy),
      });
      if (choice && !claimed(choice, a, friendlyTeam)) {
        applyCoverChoice(a, choice);
        a.combatState = "seeking";
        a.repositionCooldown = aggressiveAdvance ? 0.65 : 1.1;
      }
    }
    if (a.cover && a.combatState === "seeking") {
      moveTowardTarget(a, dt);
      if (Math.hypot(a.x - a.coverAnchorX, a.y - a.coverAnchorY) < 18) {
        a.x = a.coverAnchorX;
        a.y = a.coverAnchorY;
        a.combatState = "covered";
        a.exposed = false;
        a.combatTimer = 0.4;
      }
      return;
    }
    if (a.cover) {
      a.combatTimer -= dt;
      if (a.combatState === "covered" && a.combatTimer <= 0) {
        a.combatState = "exposed";
        a.exposed = true;
        a.combatTimer = 0.8;
        a.shotsLeft = 3 + Math.floor(Math.random() * 3);
      } else if (a.combatState === "exposed") {
        var pp = peekPoint(a, e, 48);
        a.targetX = pp.x;
        a.targetY = pp.y;
        moveTowardTarget(a, dt);
        if (d <= a.weapon.range) shoot(a, e, spawnProjectile, covers);
        if (a.combatTimer <= 0 || a.shotsLeft <= 0) {
          a.combatState = "covered";
          a.exposed = false;
          a.targetX = a.coverAnchorX;
          a.targetY = a.coverAnchorY;
          a.combatTimer = 0.5;
        }
      }
      return;
    }
    if (d <= a.weapon.range) shoot(a, e, spawnProjectile, covers);
  });
}
