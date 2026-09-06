import { sampledLineIntersectsRect } from "./geometry.js?v=20260906-89";

export const ACTOR_RADIUS = 11;
export const VAULT_DURATION = 0.46;

export function coverPiecesOf(c) {
  if (c && c.destroyed) return [];
  if (c && c.segments && c.segments.length)
    return c.segments.map(function (s) {
      return {
        x: c.x + (s.dx || 0),
        y: c.y + (s.dy || 0),
        w: s.w,
        h: s.h,
        type: c.type,
      };
    });
  return [{ x: c.x, y: c.y, w: c.w || 40, h: c.h || 28, type: c.type }];
}

export function coverSolidClass(cover) {
  var theme = (cover && cover.theme) || "";
  var type = (cover && cover.type) || "";
  if (type === "low" || theme === "sandbags" || theme === "crates") return "low";
  if (type === "car" || theme === "wreck") return "medium";
  return "tall";
}

export function isCoverJumpable(cover) {
  return !!cover && coverSolidClass(cover) !== "tall";
}

function sameCover(a, b) {
  return !!(a && b && (a === b || (a.id && b.id && a.id === b.id)));
}

export function pieceContains(piece, x, y, pad) {
  pad = pad == null ? 0 : pad;
  return (
    Math.abs(x - piece.x) < piece.w / 2 + pad &&
    Math.abs(y - piece.y) < piece.h / 2 + pad
  );
}

export function overlapsSolid(x, y, covers, opts) {
  opts = opts || {};
  var pad = opts.pad == null ? ACTOR_RADIUS : opts.pad;
  var ignore = opts.ignore || null;
  for (var i = 0; i < (covers || []).length; i++) {
    var c = covers[i];
    if (sameCover(c, ignore) || (c && c.destroyed)) continue;
    var ps = coverPiecesOf(c);
    for (var j = 0; j < ps.length; j++) {
      if (pieceContains(ps[j], x, y, pad)) return { cover: c, piece: ps[j] };
    }
  }
  return null;
}

export function firstCoverOnSegment(from, to, covers, ignore) {
  var hit = null,
    best = Infinity;
  for (var i = 0; i < (covers || []).length; i++) {
    var c = covers[i];
    if (sameCover(c, ignore) || (c && c.destroyed)) continue;
    var ps = coverPiecesOf(c);
    for (var j = 0; j < ps.length; j++) {
      var p = ps[j];
      var inflated = {
        x: p.x,
        y: p.y,
        w: p.w + ACTOR_RADIUS * 2,
        h: p.h + ACTOR_RADIUS * 2,
      };
      if (!sampledLineIntersectsRect(from, to, inflated)) continue;
      var d = Math.hypot(p.x - from.x, p.y - from.y);
      if (d < best) {
        best = d;
        hit = { cover: c, piece: p };
      }
    }
  }
  return hit;
}

export function ignoreCoverFor(actor) {
  if (!actor) return null;
  if (actor.vaulting && actor.vaultCover) return actor.vaultCover;
  if (
    actor.cover &&
    (actor.exposed ||
      (actor.peek || 0) > 0 ||
      actor.combatState === "exposed" ||
      actor.combatState === "peeking" ||
      actor.combatState === "covered")
  )
    return actor.cover;
  if (
    actor.cover &&
    Number.isFinite(actor.coverAnchorX) &&
    Math.hypot(actor.x - actor.coverAnchorX, actor.y - actor.coverAnchorY) < 36
  )
    return actor.cover;
  if (
    actor.coverTarget &&
    Math.hypot(actor.x - (actor.tx || actor.targetX || actor.x), actor.y - (actor.ty || actor.targetY || actor.y)) <
      28
  )
    return actor.coverTarget;
  return null;
}

export function vaultLanding(actor, cover, piece, dest) {
  var dx = dest.x - actor.x,
    dy = dest.y - actor.y,
    d = Math.hypot(dx, dy) || 1,
    nx = dx / d,
    ny = dy / d,
    ext = Math.abs(nx) * (piece.w / 2) + Math.abs(ny) * (piece.h / 2),
    standoff = 16;
  return {
    x: piece.x + nx * (ext + standoff),
    y: piece.y + ny * (ext + standoff),
  };
}

export function startVault(actor, cover, landing) {
  actor.vaulting = true;
  actor.vaultT = 0;
  actor.vaultCover = cover;
  actor.vaultFromX = actor.x;
  actor.vaultFromY = actor.y;
  actor.vaultToX = landing.x;
  actor.vaultToY = landing.y;
  actor.vaultZ = 0;
  actor.state = "vault";
  actor.cover = null;
  actor.coverTarget = null;
  actor.exposed = true;
}

export function updateVault(actor, dt) {
  if (!actor || !actor.vaulting) return false;
  actor.vaultT = (actor.vaultT || 0) + dt;
  var u = Math.min(1, actor.vaultT / VAULT_DURATION);
  var travel =
    u < 0.22
      ? (u * 0.16) / 0.22
      : u < 0.58
        ? 0.16 + ((u - 0.22) * 0.66) / 0.36
        : 0.82 + ((u - 0.58) * 0.18) / 0.42;
  actor.x = actor.vaultFromX + (actor.vaultToX - actor.vaultFromX) * travel;
  actor.y = actor.vaultFromY + (actor.vaultToY - actor.vaultFromY) * travel;
  var rise = u < 0.48 ? u / 0.48 : Math.max(0, 1 - (u - 0.48) / 0.36);
  if (u > 0.86) rise = 0;
  actor.vaultZ = rise * (coverSolidClass(actor.vaultCover) === "medium" ? 22 : 15);
  actor.facingX = actor.vaultToX - actor.vaultFromX;
  actor.facingY = actor.vaultToY - actor.vaultFromY;
  actor.state = "vault";
  if (u >= 1) {
    actor.vaulting = false;
    actor.vaultZ = 0;
    actor.x = actor.vaultToX;
    actor.y = actor.vaultToY;
    if (actor.state === "vault") actor.state = "idle";
    return true;
  }
  return false;
}

export function findDetour(from, to, cover, covers) {
  var ps = coverPiecesOf(cover),
    minX = Infinity,
    maxX = -Infinity,
    minY = Infinity,
    maxY = -Infinity;
  for (var i = 0; i < ps.length; i++) {
    var p = ps[i];
    minX = Math.min(minX, p.x - p.w / 2);
    maxX = Math.max(maxX, p.x + p.w / 2);
    minY = Math.min(minY, p.y - p.h / 2);
    maxY = Math.max(maxY, p.y + p.h / 2);
  }
  var pad = 30,
    midX = (minX + maxX) / 2,
    midY = (minY + maxY) / 2,
    corners = [
      { x: minX - pad, y: minY - pad },
      { x: maxX + pad, y: minY - pad },
      { x: minX - pad, y: maxY + pad },
      { x: maxX + pad, y: maxY + pad },
      { x: minX - pad, y: midY },
      { x: maxX + pad, y: midY },
      { x: midX, y: minY - pad },
      { x: midX, y: maxY + pad },
    ],
    best = null,
    bestScore = Infinity;
  for (var j = 0; j < corners.length; j++) {
    var q = corners[j];
    if (overlapsSolid(q.x, q.y, covers, { pad: 10 })) continue;
    var score =
      Math.hypot(q.x - from.x, q.y - from.y) +
      Math.hypot(q.x - to.x, q.y - to.y);
    if (score < bestScore) {
      bestScore = score;
      best = q;
    }
  }
  return best;
}

function sideFlipped(from, to, piece) {
  var a = (from.x - piece.x) * (to.x - piece.x);
  var b = (from.y - piece.y) * (to.y - piece.y);
  return a < 0 || b < 0;
}

export function resolveSolidMove(actor, nx, ny, covers, opts) {
  opts = opts || {};
  covers = covers || [];
  if (actor.vaulting)
    return { x: actor.x, y: actor.y, blocked: false, vaulted: true };
  var ignore = opts.ignore !== undefined ? opts.ignore : ignoreCoverFor(actor);
  var dest = opts.target || { x: nx, y: ny };
  var hit =
    overlapsSolid(nx, ny, covers, { pad: ACTOR_RADIUS, ignore: ignore }) ||
    firstCoverOnSegment(actor, { x: nx, y: ny }, covers, ignore);
  if (!hit) return { x: nx, y: ny, blocked: false, vaulted: false };
  if (
    opts.allowVault !== false &&
    isCoverJumpable(hit.cover) &&
    !actor.downed &&
    !actor.dead &&
    sideFlipped(actor, dest, hit.piece)
  ) {
    var land = vaultLanding(actor, hit.cover, hit.piece, dest);
    if (!overlapsSolid(land.x, land.y, covers, { pad: 8, ignore: hit.cover })) {
      startVault(actor, hit.cover, land);
      return { x: actor.x, y: actor.y, blocked: true, vaulted: true };
    }
  }
  if (!overlapsSolid(nx, actor.y, covers, { pad: ACTOR_RADIUS, ignore: ignore }))
    return { x: nx, y: actor.y, blocked: true, vaulted: false };
  if (!overlapsSolid(actor.x, ny, covers, { pad: ACTOR_RADIUS, ignore: ignore }))
    return { x: actor.x, y: ny, blocked: true, vaulted: false };
  return { x: actor.x, y: actor.y, blocked: true, vaulted: false };
}

export function planRoute(actor, x, y, covers, coverTarget) {
  covers = covers || [];
  actor.routeGoalX = x;
  actor.routeGoalY = y;
  var from = { x: actor.x, y: actor.y },
    to = { x: x, y: y },
    hit = firstCoverOnSegment(from, to, covers, coverTarget || null);
  if (!hit) {
    actor.tx = x;
    actor.ty = y;
    return "clear";
  }
  if (
    !coverTarget &&
    isCoverJumpable(hit.cover) &&
    Math.hypot(hit.piece.x - actor.x, hit.piece.y - actor.y) < 130
  ) {
    startVault(actor, hit.cover, vaultLanding(actor, hit.cover, hit.piece, to));
    actor.tx = x;
    actor.ty = y;
    return "vault";
  }
  var detour = findDetour(from, to, hit.cover, covers);
  if (detour) {
    actor.tx = detour.x;
    actor.ty = detour.y;
    return "detour";
  }
  actor.tx = x;
  actor.ty = y;
  return "direct";
}

export function continueRoute(actor, covers) {
  if (!actor || !Number.isFinite(actor.routeGoalX)) return;
  if (actor.vaulting) return;
  if (Math.hypot(actor.x - actor.tx, actor.y - actor.ty) > 10) return;
  if (Math.hypot(actor.x - actor.routeGoalX, actor.y - actor.routeGoalY) < 12) {
    actor.x = actor.routeGoalX;
    actor.y = actor.routeGoalY;
    actor.tx = actor.routeGoalX;
    actor.ty = actor.routeGoalY;
    actor.routeGoalX = undefined;
    actor.routeGoalY = undefined;
    return;
  }
  planRoute(actor, actor.routeGoalX, actor.routeGoalY, covers, actor.coverTarget);
}
