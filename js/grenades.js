import { mitigateDamage, creditKill } from "./combatStats.js?v=20260908-124";
import { AudioBus } from "./audio.js?v=20260908-124";
import { getSkillMods } from "./skillTree.js?v=20260908-124";
import { damageCover, isSoftCover } from "./destructibleCover.js?v=20260908-124";

var grenades = [];

export function resetGrenades() {
  grenades.length = 0;
}

export function activeGrenades() {
  return grenades;
}

function livingHostiles(enemies) {
  return (enemies || []).filter(function (e) {
    return e && !e.dead && !e.downed && e.hp > 0 && !(e.spawnTimer > 0) && !e.pendingSegment;
  });
}

function clusterAim(from, enemies) {
  var list = livingHostiles(enemies);
  if (!list.length) return null;
  var best = null,
    bestScore = -Infinity;
  list.forEach(function (e) {
    var near = 0;
    list.forEach(function (o) {
      if (Math.hypot(o.x - e.x, o.y - e.y) < 180) near++;
    });
    var d = Math.hypot(e.x - from.x, e.y - from.y);
    var score = near * 40 + Math.max(0, 1400 - d) * 0.04;
    if (score > bestScore) {
      bestScore = score;
      best = e;
    }
  });
  return best;
}

export function canThrowGrenade(actor, now, mods) {
  if (!actor || actor.dead || actor.downed) return false;
  mods = mods || getSkillMods();
  if (!mods.grenades) return false;
  if (actor.isMarine) return false;
  if (actor.name && actor.name !== "PLAYER" && !mods.allyGrenades && !actor.isPlayer)
    return false;
  return (actor.grenadeReadyAt || 0) <= now;
}

export function throwGrenade(from, target, mods) {
  if (!from || !target) return null;
  mods = mods || getSkillMods();
  var g = {
    sx: from.x,
    sy: from.y,
    x: from.x,
    y: from.y,
    tx: target.x,
    ty: target.y,
    life: 0,
    flight: 0.72,
    exploded: false,
    boomT: 0,
    radius: mods.grenadeRadius || 150,
    damage: mods.grenadeDamage || 38,
    sparks: [],
    owner: from,
  };
  grenades.push(g);
  from.grenadeReadyAt = (from.grenadeReadyAt || 0) + 0.01;
  return g;
}

export function trySquadGrenades(actors, enemies, dt, now) {
  var mods = getSkillMods();
  if (!mods.grenades) return;
  (actors || []).forEach(function (a) {
    if (!a || a.dead || a.downed) return;
    a.grenadeReadyAt = a.grenadeReadyAt == null ? now + 4 + Math.random() * 6 : a.grenadeReadyAt;
    if (!canThrowGrenade(a, now, mods)) return;
    var aim = clusterAim(a, enemies);
    if (!aim) return;
    if (Math.hypot(aim.x - a.x, aim.y - a.y) > 1350) return;
    throwGrenade(a, aim, mods);
    a.grenadeReadyAt = now + mods.grenadeCooldown;
    a.callout = a.callout || "FRAG OUT!";
    a.calloutTimer = Math.max(a.calloutTimer || 0, 1.1);
  });
}

function applyBlast(g, enemies) {
  var hits = 0;
  livingHostiles(enemies).forEach(function (e) {
    var d = Math.hypot(e.x - g.tx, e.y - g.ty);
    if (d > g.radius) return;
    var falloff = 1 - d / g.radius;
    var raw = g.damage * (0.45 + 0.55 * falloff);
    var dealt = mitigateDamage(raw, e.defense);
    e.hp = Math.max(0, e.hp - dealt);
    e.lastDamageTaken = dealt;
    e.hit = 0.28;
    hits++;
    if (e.hp <= 0) {
      e.hp = 0;
      e.dead = true;
      e.deathTimer = 0;
      creditKill(g.owner);
    }
  });
  if (AudioBus && AudioBus.playBoom) AudioBus.playBoom({ volume: 0.7, priority: 3 });
  return hits;
}

export function updateGrenades(dt, enemies) {
  for (var i = grenades.length - 1; i >= 0; i--) {
    var g = grenades[i];
    g.life += dt;
    if (!g.exploded) {
      var u = Math.min(1, g.life / g.flight);
      g.x = g.sx + (g.tx - g.sx) * u;
      g.y = g.sy + (g.ty - g.sy) * u;
      g.height = Math.sin(u * Math.PI) * 86;
      if (u >= 1) {
        g.x = g.tx;
        g.y = g.ty;
        g.exploded = true;
        g.boomT = 0;
        g.height = 0;
        for (var s = 0; s < 8; s++) {
          var ang = (s / 8) * Math.PI * 2;
          g.sparks.push({
            x: Math.cos(ang) * 8,
            y: Math.sin(ang) * 8,
            vx: Math.cos(ang) * 90,
            vy: Math.sin(ang) * 90,
          });
        }
        applyBlast(g, enemies);
        var covers =
          typeof window !== "undefined" ? window.__battleCovers : [];
        var occupants = []
          .concat(typeof window !== "undefined" && window.__battlePlayer ? [window.__battlePlayer] : [])
          .concat((typeof window !== "undefined" && window.__battleAllies) || [])
          .concat((typeof window !== "undefined" && window.__battleMarines) || [])
          .concat(enemies || []);
        (covers || []).forEach(function (c) {
          if (!c || !isSoftCover(c)) return;
          if (Math.hypot(c.x - g.tx, c.y - g.ty) <= g.radius + 40)
            damageCover(c, g.damage * 0.85, occupants);
        });
      }
    } else {
      g.boomT += dt;
      g.sparks.forEach(function (sp) {
        sp.x += sp.vx * dt;
        sp.y += sp.vy * dt;
      });
      if (g.boomT >= 0.42) grenades.splice(i, 1);
    }
  }
}

export function drawGrenades(ctx, iso) {
  grenades.forEach(function (g) {
    var p = iso(g.x, g.y);
    ctx.save();
    ctx.translate(p[0], p[1]);
    if (!g.exploded) {
      ctx.fillStyle = "#0006";
      ctx.beginPath();
      ctx.ellipse(0, 4, 7, 3, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.translate(0, -(g.height || 0));
      ctx.fillStyle = "#6b7a3a";
      ctx.strokeStyle = "#c9d27a";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(0, 0, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.strokeStyle = "#ffd36a88";
      ctx.beginPath();
      ctx.moveTo(0, 6);
      ctx.lineTo(0, 14);
      ctx.stroke();
    } else {
      var u = Math.min(1, g.boomT / 0.42);
      ctx.globalAlpha = 1 - u;
      ctx.strokeStyle = "#ffb14a";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(0, 0, 12 + u * 46, 0, Math.PI * 2);
      ctx.stroke();
      ctx.strokeStyle = "#ffe7a8";
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.arc(0, 0, 6 + u * 28, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = "#ff7a3a";
      g.sparks.forEach(function (sp) {
        ctx.fillRect(sp.x - 1.5, sp.y - 1.5, 3, 3);
      });
    }
    ctx.restore();
  });
}
