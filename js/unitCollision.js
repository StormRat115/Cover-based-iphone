export const UNIT_RADIUS = 13;
export const UNSTICK_SECONDS = 0.38;
export const PASS_THROUGH_SECONDS = 0.42;

function living(actor) {
  return !!(actor && !actor.dead && actor.hp > 0);
}

function friendly(actor) {
  return !!(
    actor &&
    (actor.isPlayer || actor.isMarine || (actor.name && !actor.type))
  );
}

export function isUnitSolid(actor) {
  if (!living(actor)) return false;
  if (actor.downed) return false;
  if (actor.vaulting) return false;
  if ((actor.passThrough || 0) > 0) return false;
  if ((actor.spawnTimer || 0) > 0) return false;
  return true;
}

export function unitRadius(actor) {
  var scale = actor && actor.scale ? actor.scale : 1;
  return UNIT_RADIUS * Math.max(0.85, Math.min(1.25, scale));
}

export function collectBattleUnits(extras) {
  var list = [];
  if (typeof window === "undefined") {
    return extras || [];
  }
  if (window.__battlePlayer) list.push(window.__battlePlayer);
  (window.__battleAllies || []).forEach(function (a) {
    list.push(a);
  });
  (window.__battleMarines || []).forEach(function (m) {
    list.push(m);
  });
  (window.__battleEnemies || []).forEach(function (e) {
    list.push(e);
  });
  if (extras) {
    extras.forEach(function (item) {
      if (item && list.indexOf(item) < 0) list.push(item);
    });
  }
  return list;
}

function blockedBy(actor, x, y, other) {
  var min = unitRadius(actor) + unitRadius(other);
  return Math.hypot(x - other.x, y - other.y) < min;
}

export function resolveUnitMove(actor, nx, ny, units) {
  if (!actor || actor.vaulting || (actor.passThrough || 0) > 0)
    return { x: nx, y: ny, blocked: false };
  units = units || collectBattleUnits();
  var hit = null;
  for (var i = 0; i < units.length; i++) {
    var other = units[i];
    if (other === actor || !isUnitSolid(other)) continue;
    // Friendly units share movement lanes. Cover-slot ownership remains
    // separate and still prevents two units reserving the same firing point.
    if (friendly(actor) && friendly(other)) continue;
    if (blockedBy(actor, nx, ny, other)) {
      hit = other;
      break;
    }
  }
  if (!hit) return { x: nx, y: ny, blocked: false };
  if (!blockedBy(actor, nx, actor.y, hit))
    return { x: nx, y: actor.y, blocked: true, other: hit };
  if (!blockedBy(actor, actor.x, ny, hit))
    return { x: actor.x, y: ny, blocked: true, other: hit };
  return { x: actor.x, y: actor.y, blocked: true, other: hit };
}

export function applyUnitMove(actor, nx, ny, units) {
  var result = resolveUnitMove(actor, nx, ny, units);
  actor.x = result.x;
  actor.y = result.y;
  return result;
}

function actorId(actor) {
  if (actor.id) return "id:" + actor.id;
  if (actor.name) return "name:" + actor.name;
  if (!actor.__unitId)
    actor.__unitId = "u" + Math.round(actor.x) + ":" + Math.round(actor.y) + ":" + (actor.type || "u");
  return actor.__unitId;
}

function pairKey(a, b) {
  var ida = actorId(a),
    idb = actorId(b);
  return ida < idb ? ida + "|" + idb : idb + "|" + ida;
}

var stuck = new Map();

export function resetUnitUnstick() {
  stuck.clear();
}

export function unstickOverlappingUnits(units, dt) {
  units = units || collectBattleUnits();
  var solids = units.filter(isUnitSolid);
  var seen = {};
  for (var i = 0; i < solids.length; i++) {
    for (var j = i + 1; j < solids.length; j++) {
      var a = solids[i],
        b = solids[j];
      if (friendly(a) && friendly(b)) continue;
      var
        min = unitRadius(a) + unitRadius(b),
        dx = b.x - a.x,
        dy = b.y - a.y,
        d = Math.hypot(dx, dy);
      if (d >= min * 0.92) continue;
      var key = pairKey(a, b);
      seen[key] = true;
      var time = (stuck.get(key) || 0) + dt;
      stuck.set(key, time);
      if (d < 0.001) {
        dx = 1;
        dy = 0;
        d = 1;
      }
      var push = (min - d) * 0.5 + 1.5,
        nx = dx / d,
        ny = dy / d;
      a.x -= nx * push;
      a.y -= ny * push;
      b.x += nx * push;
      b.y += ny * push;
      if (time >= UNSTICK_SECONDS) {
        var passer = a.speed >= (b.speed || 0) ? a : b;
        passer.passThrough = PASS_THROUGH_SECONDS;
        stuck.delete(key);
      }
    }
  }
  stuck.forEach(function (_value, key) {
    if (!seen[key]) stuck.delete(key);
  });
  units.forEach(function (actor) {
    if (!actor) return;
    if ((actor.passThrough || 0) > 0)
      actor.passThrough = Math.max(0, actor.passThrough - dt);
  });
}

export function composeSolidAndUnitMove(coverResult, actor, units) {
  if (!coverResult) return { x: actor.x, y: actor.y, blocked: true };
  if (coverResult.vaulted || actor.vaulting) return coverResult;
  var unit = resolveUnitMove(actor, coverResult.x, coverResult.y, units);
  return {
    x: unit.x,
    y: unit.y,
    blocked: !!(coverResult.blocked || unit.blocked),
    vaulted: false,
    other: unit.other || null,
  };
}
