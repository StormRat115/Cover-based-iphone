import {
  isLineBlocked,
  getCoverSlot,
  getHitChance,
  chooseCoverPeek,
} from "./cover.js?v=20260905-60";
import { weaponCopy } from "./weapons.js?v=20260905-60";

export const SQUAD_MODES = ["FOLLOW", "HOLD", "ASSAULT", "FOCUS"];
var squadMode = "FOLLOW",
  healthHud = null;
var SQUAD = [
  {
    name: "Rook",
    weapon: "rifle",
    role: "assault",
    speed: 205,
    regen: 4,
    hp: 80,
  },
  {
    name: "Viper",
    weapon: "smg",
    role: "flanker",
    speed: 235,
    regen: 4,
    hp: 80,
  },
  {
    name: "Doc",
    weapon: "dmr",
    role: "marksman",
    speed: 180,
    regen: 5,
    hp: 100,
  },
];
function rand(a, b) {
  return a + Math.random() * (b - a);
}
function wire() {
  var bs = document.querySelectorAll("#squadCommands button");
  bs.forEach(function (b, i) {
    b.classList.toggle("active", i === 0);
    b.addEventListener("pointerdown", function (e) {
      e.preventDefault();
      squadMode = b.dataset.command || "FOLLOW";
      window.squadMode = squadMode;
      bs.forEach(function (x) {
        x.classList.toggle("active", x === b);
      });
    });
  });
}
if (typeof window !== "undefined") {
  window.squadMode = "FOLLOW";
  if (document.readyState === "loading")
    window.addEventListener("DOMContentLoaded", wire);
  else wire();
}
function hud(allies) {
  if (!healthHud) {
    healthHud = document.createElement("div");
    healthHud.id = "allyHealth";
    healthHud.style.cssText =
      "position:fixed;left:12px;top:calc(env(safe-area-inset-top) + 62px);width:145px;padding:7px 8px;border:1px solid #ffffff22;border-radius:9px;background:#101714cc;backdrop-filter:blur(4px);z-index:5;pointer-events:none;font:800 10px system-ui;color:#e8eee9;letter-spacing:.6px;text-shadow:0 1px 3px #000";
    document.body.appendChild(healthHud);
  }
  healthHud.innerHTML =
    '<div style="font-size:9px;color:#8fb7c8;letter-spacing:1.2px;margin-bottom:4px">SQUAD STATUS</div>' +
    allies
      .map(function (a) {
        var p = Math.round((Math.max(0, a.hp) / a.maxHp) * 100),
          label = a.dead ? "KIA" : a.downed ? "DOWNED" : p + "%",
          c = a.dead
            ? "#666"
            : p > 55
              ? "#61b86b"
              : p > 25
                ? "#d6b74d"
                : "#d85b50";
        return (
          '<div style="margin:2px 0 5px;opacity:' +
          (a.dead ? ".4" : "1") +
          '"><div style="display:flex;justify-content:space-between"><span>' +
          a.name +
          " · " +
          a.weapon.short +
          "</span><span>" +
          label +
          '</span></div><div style="height:4px;background:#303733;border-radius:3px;overflow:hidden"><div style="height:100%;width:' +
          p +
          "%;background:" +
          c +
          '"></div></div></div>'
        );
      })
      .join("");
}
export function createAllies() {
  var starts = [
    [-70, 170],
    [75, 185],
    [0, 260],
  ];
  var out = SQUAD.map(function (s, i) {
    var p = starts[i],
      w = weaponCopy(s.weapon);
    return {
      name: s.name,
      role: s.role,
      weapon: w,
      x: p[0],
      y: p[1],
      hp: s.hp,
      maxHp: s.hp,
      lastHp: s.hp,
      fire: 0.3 + i * 0.3,
      t: 0,
      dead: false,
      downed: false,
      downTimer: 0,
      downDuration: 11,
      deathTimer: 0,
      deathDuration: 0.8,
      muzzle: 0,
      hit: 0,
      targetX: p[0],
      targetY: p[1],
      cover: null,
      coverSlotIndex: i,
      speed: s.speed,
      facingX: i === 1 ? -1 : 1,
      facingY: 0,
      timeSinceDamage: 99,
      regenDelay: 3,
      regenRate: s.regen,
      callout: "",
      calloutTimer: 0,
      reloadTimer: 0,
      reloading: false,
      reviveTimer: 0,
      reviveDuration: 2.5,
      flankSide: i === 1 ? -1 : 1,
      combatState: "seeking",
      combatTimer: 0,
      shotsLeft: 0,
      coverCycles: 0,
      coverAnchorX: p[0],
      coverAnchorY: p[1],
      peekX: p[0],
      peekY: p[1],
      exposed: false,
      coverCommit: 0,
      repathTimer: 0,
      underFireTimer: 0,
      lastCoverId: null,
      angleFails: 0,
    };
  });
  window.__battleAllies = out;
  return out;
}
function say(a, t, d) {
  a.callout = t;
  a.calloutTimer = d || 1.6;
}
function nearest(a, enemies) {
  var best = null,
    bd = Infinity;
  for (var i = 0; i < enemies.length; i++) {
    var e = enemies[i];
    if (e.dead) continue;
    var d = Math.hypot(a.x - e.x, a.y - e.y);
    if (d < bd) {
      bd = d;
      best = e;
    }
  }
  return { target: best, dist: bd };
}
function weakest(enemies) {
  var best = null,
    score = -1;
  for (var i = 0; i < enemies.length; i++) {
    var e = enemies[i];
    if (e.dead) continue;
    var s = 1 - e.hp / e.maxHp;
    if (s > score) {
      score = s;
      best = e;
    }
  }
  return best;
}
function desired(a, mode) {
  if (a.role === "marksman") return 760;
  if (a.role === "flanker") return 470;
  if (mode === "ASSAULT") return 390;
  if (mode === "HOLD") return 570;
  return 540;
}
function users(c, allies, a) {
  var n = 0;
  for (var i = 0; i < allies.length; i++) {
    var o = allies[i];
    if (o !== a && !o.dead && !o.downed && o.cover === c) n++;
  }
  return n;
}
function coverScore(a, c, target, player, covers, allies, mode) {
  var travel = Math.hypot(c.x - a.x, c.y - a.y),
    td = Math.hypot(c.x - target.x, c.y - target.y),
    use = users(c, allies, a);
  if (travel > 780 || use >= 3) return 1e9;
  var ghost = { x: a.x, y: a.y, coverSlotIndex: use % 3 },
    anchor = getCoverSlot(c, ghost, target),
    peek = chooseCoverPeek(c, ghost, target, covers);
  var score =
    travel * 0.62 + Math.abs(td - desired(a, mode)) * 0.78 + use * 230;
  if (isLineBlocked(anchor, target, covers)) score -= 120;
  else score += 220;
  if (isLineBlocked(peek, target, covers)) score += 380;
  else score -= 180;
  if (c.id === a.lastCoverId) score += 170;
  if (mode === "FOLLOW")
    score +=
      Math.max(0, Math.hypot(c.x - player.x, c.y - player.y) - 520) * 0.7;
  if (a.role === "flanker")
    score += (c.x - player.x) * a.flankSide > 80 ? -80 : 120;
  if (c.type === "wide" || c.type === "car") score -= 45;
  if (c.segments && c.segments.length > 1) score -= 55;
  return score;
}
function pickCover(a, player, covers, allies, target, mode) {
  var ranked = [];
  for (var i = 0; i < covers.length; i++) {
    var s = coverScore(a, covers[i], target, player, covers, allies, mode);
    if (s < 1e9) ranked.push({ c: covers[i], s: s });
  }
  ranked.sort(function (x, y) {
    return x.s - y.s;
  });
  if (!ranked.length) {
    a.cover = null;
    a.exposed = true;
    a.repathTimer = 0.9;
    var dx = target.x - a.x,
      dy = target.y - a.y,
      d = Math.hypot(dx, dy) || 1;
    a.targetX = a.x + (dx / d) * 140;
    a.targetY = a.y + (dy / d) * 140;
    return;
  }
  var c = ranked[Math.floor(Math.random() * Math.min(2, ranked.length))].c;
  a.lastCoverId = a.cover ? a.cover.id : a.lastCoverId;
  a.cover = c;
  a.coverSlotIndex = users(c, allies, a) % 3;
  var slot = getCoverSlot(c, a, target),
    peek = chooseCoverPeek(c, a, target, covers);
  a.coverAnchorX = slot.x;
  a.coverAnchorY = slot.y;
  a.peekX = peek.x;
  a.peekY = peek.y;
  a.targetX = slot.x;
  a.targetY = slot.y;
  a.combatState = "seeking";
  a.exposed = false;
  a.coverCommit = rand(3.8, 6.2);
  a.coverCycles = 0;
  a.angleFails = isLineBlocked(peek, target, covers) ? 1 : 0;
  a.repathTimer = rand(0.45, 0.75);
}
function move(a, dt) {
  var dx = a.targetX - a.x,
    dy = a.targetY - a.y,
    d = Math.hypot(dx, dy);
  if (d <= 6) {
    a.x = a.targetX;
    a.y = a.targetY;
    return d;
  }
  a.facingX = dx / d;
  a.facingY = dy / d;
  var s = Math.min(d, a.speed * dt);
  a.x += (dx / d) * s;
  a.y += (dy / d) * s;
  return d;
}
function covered(a) {
  a.combatState = "covered";
  a.combatTimer = rand(0.45, 0.85);
  a.exposed = false;
  a.targetX = a.coverAnchorX;
  a.targetY = a.coverAnchorY;
  a.coverCycles++;
}
function peek(a, target, covers) {
  var p = chooseCoverPeek(a.cover, a, target, covers);
  a.peekX = p.x;
  a.peekY = p.y;
  a.targetX = p.x;
  a.targetY = p.y;
  a.combatState = "peeking";
  a.combatTimer = 1.1;
  a.exposed = false;
}
function fireState(a) {
  a.combatState = "firing";
  a.combatTimer = rand(0.55, 1.0);
  a.shotsLeft = 2 + Math.floor(Math.random() * 3);
  a.exposed = true;
  a.targetX = a.peekX;
  a.targetY = a.peekY;
}
function tuck(a) {
  a.combatState = "tucking";
  a.combatTimer = 0.8;
  a.targetX = a.coverAnchorX;
  a.targetY = a.coverAnchorY;
  a.exposed = true;
}
function revive(a, allies, player, dt) {
  var best = null,
    bd = Infinity;
  for (var i = 0; i < allies.length; i++) {
    var o = allies[i];
    if (o === a || o.dead || !o.downed) continue;
    var d = Math.hypot(a.x - o.x, a.y - o.y);
    if (d < 64 && d < bd) {
      best = o;
      bd = d;
    }
  }
  if (player.downed && !player.dead) {
    var pd = Math.hypot(a.x - player.x, a.y - player.y);
    if (pd < 64 && pd < bd) {
      best = player;
      bd = pd;
    }
  }
  if (!best) {
    a.reviveTimer = 0;
    return false;
  }
  a.cover = null;
  a.exposed = false;
  a.targetX = a.x;
  a.targetY = a.y;
  a.reviveTimer += dt;
  if (a.reviveTimer >= a.reviveDuration) {
    a.reviveTimer = 0;
    if (best.revive) best.revive();
    say(a, "BACK ON YOUR FEET!", 1.5);
    if (best !== player) say(best, "I'M UP!", 1.4);
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
) {
  mode = mode || squadMode;
  hud(allies);
  for (var i = 0; i < allies.length; i++) {
    var a = allies[i];
    if (a.dead) {
      a.deathTimer = Math.min(a.deathDuration, a.deathTimer + dt);
      continue;
    }
    a.t += dt;
    a.fire -= dt;
    a.muzzle = Math.max(0, a.muzzle - dt);
    a.hit = Math.max(0, a.hit - dt);
    a.calloutTimer = Math.max(0, a.calloutTimer - dt);
    a.timeSinceDamage += dt;
    a.coverCommit = Math.max(0, a.coverCommit - dt);
    a.repathTimer = Math.max(0, a.repathTimer - dt);
    a.underFireTimer = Math.max(0, a.underFireTimer - dt);
    if (a.hp < a.lastHp) {
      a.timeSinceDamage = 0;
      a.underFireTimer = 1.7;
      if (a.hp < a.maxHp * 0.35 && a.calloutTimer <= 0)
        say(a, "I'M INJURED", 1.6);
    }
    a.lastHp = a.hp;
    if (a.hp <= 0 && !a.downed) {
      a.downed = true;
      a.downTimer = 0;
      a.hp = 0;
      a.exposed = false;
      say(a, "I'M DOWNED", 1.7);
    }
    if (a.downed) {
      a.downTimer += dt;
      if (a.downTimer >= a.downDuration) {
        a.dead = true;
        a.downed = false;
        a.deathTimer = 0;
      }
      continue;
    }
    if (a.hp < a.maxHp && a.timeSinceDamage >= a.regenDelay)
      a.hp = Math.min(a.maxHp, a.hp + a.regenRate * dt);
    if (a.reloading) {
      a.reloadTimer -= dt;
      if (a.reloadTimer <= 0) {
        a.reloading = false;
        a.weapon.ammo = a.weapon.magazine;
      }
    }
    if (revive(a, allies, player, dt)) continue;
    var t =
      a.role === "marksman" && mode !== "ASSAULT"
        ? weakest(enemies)
        : nearest(a, enemies).target;
    if (!t) {
      a.cover = null;
      a.exposed = false;
      a.targetX =
        player.x +
        (a.role === "flanker" ? a.flankSide * 150 : a.x < player.x ? -80 : 80);
      a.targetY = player.y + 90;
      move(a, dt);
      continue;
    }
    var dist = Math.hypot(a.x - t.x, a.y - t.y),
      bad = false;
    if (a.cover) {
      var cd = Math.hypot(a.cover.x - t.x, a.cover.y - t.y);
      bad =
        cd < Math.max(220, desired(a, mode) * 0.52) ||
        cd > a.weapon.range * 1.18 ||
        a.angleFails >= 2;
      if (a.underFireTimer > 0 && a.coverCycles >= 2) bad = true;
    }
    if (!a.cover || ((bad || a.coverCycles >= 4) && a.coverCommit <= 0)) {
      if (a.repathTimer <= 0) pickCover(a, player, covers, allies, t, mode);
    }
    if (
      mode === "FOLLOW" &&
      Math.hypot(a.x - player.x, a.y - player.y) > 900 &&
      a.coverCommit <= 0
    ) {
      a.cover = null;
      a.repathTimer = 0;
      pickCover(a, player, covers, allies, t, mode);
    }
    var before = move(a, dt);
    if (a.cover) {
      if (a.combatState === "seeking" && before <= 14) covered(a);
      else if (a.combatState === "covered") {
        a.combatTimer -= dt;
        if (a.combatTimer <= 0 && dist < a.weapon.range * 1.08)
          peek(a, t, covers);
      } else if (a.combatState === "peeking") {
        if (before <= 10) {
          if (isLineBlocked(a, t, covers)) {
            a.angleFails++;
            tuck(a);
          } else {
            a.angleFails = 0;
            fireState(a);
          }
        } else {
          a.combatTimer -= dt;
          if (a.combatTimer <= 0) {
            a.angleFails++;
            tuck(a);
          }
        }
      } else if (a.combatState === "firing") {
        a.combatTimer -= dt;
        a.exposed = true;
        if (a.combatTimer <= 0 || a.shotsLeft <= 0) tuck(a);
      } else if (a.combatState === "tucking") {
        a.combatTimer -= dt;
        if (before < 24) a.exposed = false;
        if (before <= 10 || a.combatTimer <= 0) covered(a);
      }
    } else a.exposed = true;
    var chance = Math.max(
      12,
      Math.min(98, getHitChance(a, t, covers) + a.weapon.accuracy),
    );
    a.lastHitChance = chance;
    if (a.weapon.ammo <= 0 && !a.reloading) {
      a.reloading = true;
      a.reloadTimer = a.weapon.reload;
      say(a, "RELOADING", 1.1);
    }
    var can =
      dist < a.weapon.range &&
      !a.reloading &&
      ((a.cover && a.combatState === "firing") || !a.cover) &&
      !isLineBlocked(a, t, covers);
    if (a.fire <= 0 && can) {
      var cadence = a.role === "flanker" ? 0.9 : 1.05;
      a.fire = a.weapon.cooldown * cadence + Math.random() * 0.16;
      a.facingX = (t.x - a.x) / (dist || 1);
      a.facingY = (t.y - a.y) / (dist || 1);
      a.muzzle = 0.1;
      if (a.cover) a.shotsLeft--;
      if (spawnProjectile && Math.random() * 100 < chance)
        spawnProjectile(a, t, "ally", a.weapon.damage);
    }
  }
}
