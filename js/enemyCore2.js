import {
  isLineBlocked,
  getCoverSlot,
  getHitChance,
  chooseCoverPeek,
} from "./cover.js?v=20260905-65";
import { weaponCopy } from "./weapons.js?v=20260905-65";

var TYPES = {
  rifleman: { weapon: "rifle", hp: 60, speed: 205, scale: 1 },
  shotgunner: { weapon: "shotgun", hp: 90, speed: 190, scale: 1.05 },
  heavy: { weapon: "lmg", hp: 150, speed: 160, scale: 1.15 },
  sniper: { weapon: "sniper", hp: 55, speed: 180, scale: 0.95 },
  marksman: { weapon: "dmr", hp: 75, speed: 190, scale: 1 },
  smg: { weapon: "smg", hp: 52, speed: 235, scale: 0.98 },
  pistol: { weapon: "pistol", hp: 45, speed: 220, scale: 0.95 },
};
var SPAWNS = [
  [-1130, -890],
  [-720, -1040],
  [-90, -1090],
  [650, -1040],
  [1120, -900],
  [1180, -360],
  [1200, 280],
  [1030, 880],
  [470, 1050],
  [-210, 1070],
  [-820, 930],
  [-1190, 420],
  [-1210, -250],
  [-930, -1010],
];
function rand(a, b) {
  return a + Math.random() * (b - a);
}
function roleDesired(e) {
  var r = e.weapon.role;
  return r === "precision"
    ? 980
    : r === "marksman"
      ? 830
      : r === "flanker"
        ? 500
        : r === "breach"
          ? 390
          : r === "support"
            ? 700
            : 720;
}
export function createBandits(wave) {
  wave = wave || 1;
  var count = Math.min(SPAWNS.length, 5 + Math.min(9, wave));
  var offset = (wave - 1) % SPAWNS.length;
  var picks = [];
  for (var i = 0; i < count; i++)
    picks.push(SPAWNS[(i + offset) % SPAWNS.length]);
  return picks.map(function (pos, i) {
    var x = pos[0],
      y = pos[1],
      type = "rifleman";
    if (wave >= 2 && i % 5 === 1) type = "shotgunner";
    if (wave >= 2 && i % 6 === 3) type = "heavy";
    if (wave >= 3 && i % 4 === 0) type = "sniper";
    if (wave >= 3 && i % 7 === 4) type = "marksman";
    if (wave >= 4 && i % 6 === 1) type = "smg";
    if (wave >= 4 && i % 8 === 6) type = "pistol";
    var s = TYPES[type],
      w = weaponCopy(s.weapon);
    return {
      x: x,
      y: y,
      type: type,
      weapon: w,
      hp: s.hp,
      maxHp: s.hp,
      lastHp: s.hp,
      fire: w.cooldown * 2 + i * 0.08,
      t: i * 0.35,
      dead: false,
      deathTimer: 0,
      deathDuration: 0.8,
      muzzle: 0,
      hit: 0,
      targetX: x,
      targetY: y,
      spawnTimer: 1.6 + (i % 4) * 0.32,
      cover: null,
      coverSlotIndex: i % 3,
      speed: s.speed,
      facingX: x < 0 ? 1 : -1,
      facingY: 0,
      scale: s.scale,
      reloadTimer: 0,
      combatState: "seeking",
      combatTimer: 0,
      shotsLeft: 0,
      coverCycles: 0,
      coverAnchorX: x,
      coverAnchorY: y,
      peekX: x,
      peekY: y,
      exposed: false,
      coverCommit: 0,
      repathTimer: 0,
      underFireTimer: 0,
      lastCoverId: null,
      angleFails: 0,
    };
  });
}
function occupancy(c, enemies, e) {
  var n = 0;
  enemies.forEach(function (o) {
    if (o !== e && !o.dead && o.cover === c) n++;
  });
  return n;
}
function scoreCover(e, c, player, covers, enemies) {
  var travel = Math.hypot(c.x - e.x, c.y - e.y),
    pd = Math.hypot(c.x - player.x, c.y - player.y),
    desired = roleDesired(e),
    users = occupancy(c, enemies, e);
  if (travel > 900 || users >= 3) return 1e9;
  var temp = { x: e.x, y: e.y, coverSlotIndex: users % 3 };
  var anchor = getCoverSlot(c, temp, player),
    peek = chooseCoverPeek(c, temp, player, covers);
  var protectedAtAnchor = isLineBlocked(anchor, player, covers),
    clearAtPeek = !isLineBlocked(peek, player, covers);
  var score =
    travel * 0.66 +
    Math.abs(pd - desired) * 0.72 +
    users * 250 +
    (protectedAtAnchor ? -140 : 250) +
    (clearAtPeek ? -210 : 420);
  if (c.id === e.lastCoverId) score += 190;
  if (c.type === "wide" || c.type === "car") score -= 50;
  if (c.segments && c.segments.length > 1) score -= 65;
  return score;
}
function choosePosition(e, player, covers, enemies) {
  var ranked = [];
  for (var i = 0; i < covers.length; i++) {
    var c = covers[i],
      s = scoreCover(e, c, player, covers, enemies);
    if (s < 1e9) ranked.push({ c: c, s: s });
  }
  ranked.sort(function (a, b) {
    return a.s - b.s;
  });
  if (!ranked.length) {
    e.cover = null;
    e.exposed = true;
    e.combatState = "seeking";
    var dx = player.x - e.x,
      dy = player.y - e.y,
      d = Math.hypot(dx, dy) || 1;
    e.targetX = e.x + (dx / d) * 170;
    e.targetY = e.y + (dy / d) * 170;
    e.repathTimer = 0.9;
    return false;
  }
  var c = ranked[Math.floor(Math.random() * Math.min(3, ranked.length))].c;
  e.lastCoverId = e.cover ? e.cover.id : e.lastCoverId;
  e.cover = c;
  var users = occupancy(c, enemies, e);
  e.coverSlotIndex = users % 3;
  var slot = getCoverSlot(c, e, player),
    peek = chooseCoverPeek(c, e, player, covers);
  e.coverAnchorX = slot.x;
  e.coverAnchorY = slot.y;
  e.peekX = peek.x;
  e.peekY = peek.y;
  e.targetX = slot.x;
  e.targetY = slot.y;
  e.combatState = "seeking";
  e.exposed = false;
  e.coverCommit = rand(4.2, 7.2);
  e.coverCycles = 0;
  e.angleFails = isLineBlocked(peek, player, covers) ? 1 : 0;
  e.repathTimer = rand(0.5, 0.85);
  return true;
}
function enterCovered(e) {
  e.combatState = "covered";
  e.combatTimer = rand(0.45, 0.9);
  e.exposed = false;
  e.targetX = e.coverAnchorX;
  e.targetY = e.coverAnchorY;
  e.coverCycles++;
}
function enterPeeking(e, player, covers) {
  var p = chooseCoverPeek(e.cover, e, player, covers);
  e.peekX = p.x;
  e.peekY = p.y;
  e.targetX = p.x;
  e.targetY = p.y;
  e.combatState = "peeking";
  e.combatTimer = 1.35;
  e.exposed = false;
}
function enterFiring(e) {
  e.combatState = "firing";
  e.combatTimer = rand(1.25, 2.15);
  e.shotsLeft = 3 + Math.floor(Math.random() * 4);
  e.exposed = true;
  e.targetX = e.peekX;
  e.targetY = e.peekY;
}
function enterTucking(e) {
  e.combatState = "tucking";
  e.combatTimer = 0.9;
  e.targetX = e.coverAnchorX;
  e.targetY = e.coverAnchorY;
  e.exposed = true;
}
function moveToward(e, dt) {
  var dx = e.targetX - e.x,
    dy = e.targetY - e.y,
    d = Math.hypot(dx, dy);
  if (d <= 6) {
    e.x = e.targetX;
    e.y = e.targetY;
    return d;
  }
  e.facingX = dx / d;
  e.facingY = dy / d;
  var step = Math.min(d, e.speed * dt);
  e.x += (dx / d) * step;
  e.y += (dy / d) * step;
  return d;
}

export function updateBandits(enemies, dt, player, covers, spawnProjectile) {
  if (typeof window !== "undefined") window.__battleEnemies = enemies;
  for (var i = 0; i < enemies.length; i++) {
    var e = enemies[i];
    if (e.dead) {
      e.deathTimer = Math.min(e.deathDuration, e.deathTimer + dt);
      continue;
    }
    e.t += dt;
    e.fire -= dt;
    e.muzzle = Math.max(0, e.muzzle - dt);
    e.hit = Math.max(0, e.hit - dt);
    e.coverCommit = Math.max(0, e.coverCommit - dt);
    e.repathTimer = Math.max(0, e.repathTimer - dt);
    e.underFireTimer = Math.max(0, e.underFireTimer - dt);
    if (e.hp < e.lastHp) {
      e.underFireTimer = 1.8;
      e.lastHp = e.hp;
    } else e.lastHp = e.hp;
    if (e.spawnTimer > 0) {
      e.spawnTimer = Math.max(0, e.spawnTimer - dt);
      var sd = Math.hypot(player.x - e.x, player.y - e.y) || 1;
      e.facingX = (player.x - e.x) / sd;
      e.facingY = (player.y - e.y) / sd;
      continue;
    }
    var dist = Math.hypot(player.x - e.x, player.y - e.y),
      desired = roleDesired(e),
      currentBad = false;
    if (e.cover) {
      var cd = Math.hypot(e.cover.x - player.x, e.cover.y - player.y);
      currentBad =
        cd < Math.max(230, desired * 0.5) ||
        cd > e.weapon.range * 1.2 ||
        e.angleFails >= 2;
      if (e.underFireTimer > 0 && e.coverCycles >= 2) currentBad = true;
    }
    if (
      !e.cover ||
      ((currentBad || e.coverCycles >= 4) && e.coverCommit <= 0)
    ) {
      if (e.repathTimer <= 0) choosePosition(e, player, covers, enemies);
    }
    if (dist < 240 && e.coverCommit <= 0) {
      e.cover = null;
      e.repathTimer = 0;
      choosePosition(e, player, covers, enemies);
    }
    var before = moveToward(e, dt);
    if (e.cover) {
      if (e.combatState === "seeking" && before <= 14) enterCovered(e);
      else if (e.combatState === "covered") {
        e.combatTimer -= dt;
        e.exposed = false;
        e.targetX = e.coverAnchorX;
        e.targetY = e.coverAnchorY;
        if (e.combatTimer <= 0 && dist < e.weapon.range * 1.12)
          enterPeeking(e, player, covers);
      } else if (e.combatState === "peeking") {
        if (before <= 10) {
          if (isLineBlocked(e, player, covers)) {
            e.angleFails++;
            enterTucking(e);
          } else {
            e.angleFails = 0;
            enterFiring(e);
          }
        } else {
          e.combatTimer -= dt;
          if (e.combatTimer <= 0) {
            e.angleFails++;
            enterTucking(e);
          }
        }
      } else if (e.combatState === "firing") {
        e.combatTimer -= dt;
        e.exposed = true;
        e.targetX = e.peekX;
        e.targetY = e.peekY;
        if (e.combatTimer <= 0 || e.shotsLeft <= 0) enterTucking(e);
      } else if (e.combatState === "tucking") {
        e.combatTimer -= dt;
        if (before < 24) e.exposed = false;
        if (before <= 10 || e.combatTimer <= 0) enterCovered(e);
      }
    } else e.exposed = true;
    var lineBlocked = isLineBlocked(e, player, covers),
      chance = Math.max(
        8,
        Math.min(98, getHitChance(e, player, covers) + e.weapon.accuracy),
      );
    e.lastHitChance = chance;
    if (e.weapon.ammo <= 0 && !e.weapon.reloading) {
      e.weapon.reloading = true;
      e.reloadTimer = e.weapon.reload;
    }
    if (e.weapon.reloading) {
      e.reloadTimer -= dt;
      if (e.reloadTimer <= 0) {
        e.weapon.reloading = false;
        e.weapon.ammo = e.weapon.magazine;
      }
    }
    var canFire =
      dist < e.weapon.range &&
      !e.weapon.reloading &&
      ((e.cover && e.combatState === "firing") || !e.cover) &&
      !lineBlocked;
    if (e.fire <= 0 && canFire) {
      e.fire = e.weapon.cooldown + Math.random() * e.weapon.cooldown * 0.58;
      e.facingX = (player.x - e.x) / (dist || 1);
      e.facingY = (player.y - e.y) / (dist || 1);
      e.muzzle = 0.13;
      if (e.cover) e.shotsLeft--;
      if (spawnProjectile && Math.random() * 100 < chance)
        spawnProjectile(e, player, "enemy", e.weapon.damage);
    }
  }
}
