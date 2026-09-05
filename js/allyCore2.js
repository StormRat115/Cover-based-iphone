import { isLineBlocked, getHitChance } from "./cover.js?v=20260905-59";
import { weaponCopy } from "./weapons.js?v=20260905-59";
import {
  pickTacticalCover,
  applyCoverChoice,
  moveTowardTarget,
  faceThreat,
  coverStillUseful,
  peekPoint,
} from "./combatAI.js?v=20260905-59";
import {
  CHARACTER_STATS,
  mitigateDamage,
  finalAccuracy,
  attackDamage,
} from "./combatStats.js?v=20260905-59";
import { recoverInCover, shouldRecover } from "./recoveryAI.js?v=20260905-59";
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
      weapon: weaponCopy(chosen[s.name] || s.weapon),
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
function nearestEnemy(a, enemies) {
  var best = null,
    bd = Infinity;
  enemies.forEach(function (e) {
    if (!e.dead) {
      var d = Math.hypot(a.x - e.x, a.y - e.y);
      if (d < bd) {
        bd = d;
        best = e;
      }
    }
  });
  return { target: best, dist: bd };
}
function reload(a) {
  if (!a.reloading) {
    a.reloading = true;
    a.reloadTimer = a.weapon.reload;
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
    if (t !== a && t.downed && !t.dead) {
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
export function updateAllies(
  allies,
  dt,
  player,
  covers,
  enemies,
  spawnProjectile,
  mode,
) {
  squadMode = mode || window.squadMode || squadMode;
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
      a.downed = true;
      a.downTimer = 0;
      a.hp = 0;
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
    if (a.hp < a.maxHp && a.timeSinceDamage > a.regenDelay)
      a.hp = Math.min(a.maxHp, a.hp + a.regenRate * dt);
    var pick = nearestEnemy(a, enemies),
      e = pick.target,
      d = pick.dist;
    if (shouldRecover(a)) {
      if (e) faceThreat(a, e);
      recoverInCover(a, e, covers, allies, dt);
      return;
    }
    if (updateRevive(a, allies, player, dt)) return;
    if (!e) {
      a.cover = null;
      a.targetX = player.x + (a.coverSlotIndex - 1) * 90;
      a.targetY = player.y + 100;
      moveTowardTarget(a, dt);
      return;
    }
    faceThreat(a, e);
    if (
      squadMode === "FOLLOW" &&
      Math.hypot(a.x - player.x, a.y - player.y) > 400
    ) {
      a.cover = null;
      a.targetX = player.x + (a.coverSlotIndex - 1) * 90;
      a.targetY = player.y + 105;
      moveTowardTarget(a, dt);
      return;
    }
    var blocked = isLineBlocked(a, e, covers);
    if (
      (!a.cover || !coverStillUseful(a, e, covers) || blocked) &&
      a.repositionCooldown <= 0 &&
      squadMode !== "HOLD"
    ) {
      var choice = pickTacticalCover(a, e, covers, allies, {
        maxTravel: 760,
        desiredRange: Math.min(a.weapon.range * 0.68, 1050),
        flankSide: a.flankSide,
      });
      if (choice && !claimed(choice, a, allies)) {
        applyCoverChoice(a, choice);
        a.combatState = "seeking";
        a.repositionCooldown = 1.1;
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
    if (d > a.weapon.range * 0.82 && squadMode !== "HOLD") {
      a.targetX = e.x;
      a.targetY = e.y;
      moveTowardTarget(a, dt);
    } else shoot(a, e, spawnProjectile, covers);
  });
}
