import { sampledLineIntersectsRect } from "./geometry.js?v=20260906-79";
const collisionPieces = new WeakMap();
import { drawShapedCover, drawCityAsset } from "./cityAssets.js?v=20260906-79";
import { createCityCoverLayout } from "./cityMap.js?v=20260906-79";

/* Tactical cover: explicit square / rect / T / U / L segments. */
export function createCover(random) {
  const layout = createCityCoverLayout(random).map(function (item) {
    return {
      id: item.id,
      x: item.x,
      y: item.y,
      w: item.w || 120,
      h: item.h || 34,
      type: item.coverType || "low",
      asset: item.asset,
      shape: item.shape || "rect",
      theme: item.theme || "jersey",
      facing: item.facing || 0,
      scale: item.scale || 0.24,
      segments: item.segments || null,
    };
  });
  for (const cover of layout) collisionPieces.set(cover, pieces(cover));
  if (typeof window !== "undefined") window.__battleCovers = layout;
  return layout;
}

export function coverPieces(c) {
  return pieces(c);
}

function pieces(c) {
  const cached = collisionPieces.get(c);
  if (cached) return cached;
  return c.segments && c.segments.length
    ? c.segments.map(function (s) {
        return {
          x: c.x + (s.dx || 0),
          y: c.y + (s.dy || 0),
          w: s.w,
          h: s.h,
          type: c.type,
        };
      })
    : [{ x: c.x, y: c.y, w: c.w, h: c.h, type: c.type }];
}

function inside(p, x, y, padX, padY) {
  return (
    Math.abs(x - p.x) < p.w / 2 + padX && Math.abs(y - p.y) < p.h / 2 + padY
  );
}

export function findCoverForPoint(x, y, covers) {
  for (const c of covers) {
    const ps = pieces(c);
    for (const p of ps) if (inside(p, x, y, 24, 18)) return c;
  }
  return null;
}

function coverStandoff(c) {
  return c.type === "low" ? 16 : 18;
}

function facingSegment(c, side) {
  const ps = pieces(c);
  if (ps.length === 1) return ps[0];
  return ps.reduce(function (best, p) {
    if (side === "top")
      return p.y - p.h / 2 < best.y - best.h / 2 ? p : best;
    if (side === "bottom")
      return p.y + p.h / 2 > best.y + best.h / 2 ? p : best;
    if (side === "left")
      return p.x - p.w / 2 < best.x - best.w / 2 ? p : best;
    return p.x + p.w / 2 > best.x + best.w / 2 ? p : best;
  }, ps[0]);
}

function secondarySegment(c, side, primary) {
  const ps = pieces(c);
  if (ps.length < 2) return null;
  var best = null,
    bestScore = -Infinity;
  for (var i = 0; i < ps.length; i++) {
    var p = ps[i];
    if (p === primary) continue;
    var score =
      side === "top" || side === "bottom"
        ? Math.abs(p.x - primary.x) + p.h
        : Math.abs(p.y - primary.y) + p.w;
    if (score > bestScore) {
      bestScore = score;
      best = p;
    }
  }
  return best;
}

export function getCoverSlot(c, actor, threat) {
  var side = "bottom";
  if (threat) {
    var dx = threat.x - c.x,
      dy = threat.y - c.y;
    if (Math.abs(dx) > Math.abs(dy) * 1.15) side = dx < 0 ? "right" : "left";
    else side = dy < 0 ? "bottom" : "top";
  } else if (actor) {
    var adx = actor.x - c.x,
      ady = actor.y - c.y;
    if (Math.abs(adx) > Math.abs(ady) * 1.15) side = adx < 0 ? "left" : "right";
    else side = ady < 0 ? "top" : "bottom";
  }

  var slot =
    actor && Number.isFinite(actor.coverSlotIndex)
      ? Math.max(0, Math.min(2, actor.coverSlotIndex))
      : 0;
  var primary = facingSegment(c, side);
  var wall = slot === 2 ? secondarySegment(c, side, primary) || primary : primary;
  var inset = c.type === "wide" ? 20 : 16;
  var standoff = coverStandoff(c);
  var offsets = [-1, 0, 1];
  var x = wall.x,
    y = wall.y;

  if (side === "top" || side === "bottom") {
    var usableX = Math.max(14, wall.w / 2 - inset);
    var spreadX =
      c.type === "wide"
        ? Math.min(52, usableX * 0.78)
        : Math.min(38, usableX * 0.78);
    x = Math.max(
      wall.x - wall.w / 2 + inset,
      Math.min(wall.x + wall.w / 2 - inset, wall.x + offsets[slot] * spreadX),
    );
    y = side === "top" ? wall.y - wall.h / 2 - standoff : wall.y + wall.h / 2 + standoff;
  } else {
    var usableY = Math.max(12, wall.h / 2 - 8);
    var spreadY = Math.min(34, usableY * 0.72);
    y = Math.max(
      wall.y - wall.h / 2 + 10,
      Math.min(wall.y + wall.h / 2 - 10, wall.y + offsets[slot] * spreadY),
    );
    x = side === "left" ? wall.x - wall.w / 2 - standoff : wall.x + wall.w / 2 + standoff;
  }
  return { x: x, y: y, side: side, segment: wall };
}

export function getCoverPeekOptions(c, actor, threat) {
  const anchor = getCoverSlot(c, actor, threat);
  if (!threat)
    return [
      { x: anchor.x - 36, y: anchor.y },
      { x: anchor.x + 36, y: anchor.y },
    ];
  const dx = threat.x - anchor.x,
    dy = threat.y - anchor.y,
    d = Math.hypot(dx, dy) || 1;
  const nx = dx / d,
    ny = dy / d,
    px = -ny,
    py = nx;
  const sideAmt =
    c.type === "wide" ? 58 : c.type === "car" ? 54 : c.type === "low" ? 42 : 48;
  const toward = c.type === "low" ? 12 : 18;
  let opts = [
    {
      x: anchor.x + px * sideAmt + nx * toward,
      y: anchor.y + py * sideAmt + ny * toward,
      side: -1,
    },
    {
      x: anchor.x - px * sideAmt + nx * toward,
      y: anchor.y - py * sideAmt + ny * toward,
      side: 1,
    },
  ];
  if (c.segments && c.segments.length > 1) {
    for (const s of c.segments) {
      const cx = c.x + (s.dx || 0),
        cy = c.y + (s.dy || 0),
        sx = Math.max(28, (s.w || c.w) * 0.48),
        sy = Math.max(28, (s.h || c.h) * 0.48);
      opts.push({
        x: cx + px * sx + nx * 14,
        y: cy + py * sy + ny * 14,
        side: -1,
      });
      opts.push({
        x: cx - px * sx + nx * 14,
        y: cy - py * sy + ny * 14,
        side: 1,
      });
    }
  }
  return opts;
}

export function chooseCoverPeek(c, actor, threat, covers) {
  const opts = getCoverPeekOptions(c, actor, threat);
  let best = opts[0],
    bestScore = Infinity;
  for (const p of opts) {
    const blocked = isLineBlocked(p, threat, covers || []),
      travel = Math.hypot(p.x - actor.x, p.y - actor.y);
    const preferred =
      actor && Number.isFinite(actor.coverSlotIndex)
        ? (actor.coverSlotIndex % 2 === 0 && p.side < 0) ||
          (actor.coverSlotIndex % 2 === 1 && p.side > 0)
        : false;
    const score = (blocked ? 10000 : 0) + travel + (preferred ? -25 : 0);
    if (score < bestScore) {
      bestScore = score;
      best = p;
    }
  }
  return best;
}

export function isLineBlocked(a, b, covers) {
  for (const cover of covers) {
    for (const rect of pieces(cover)) {
      if (sampledLineIntersectsRect(a, b, rect)) return true;
    }
  }
  return false;
}

export function getHitChance(shooter, target, covers) {
  if (!target) return 0;
  const d = Math.hypot(target.x - shooter.x, target.y - shooter.y);
  let chance = 96 - Math.max(0, d - 120) * 0.055;
  const blocked = isLineBlocked(shooter, target, covers || []);
  if (blocked && !target.exposed) chance -= 34;
  const cover = target.cover;
  if (cover && !target.exposed) {
    if (cover.type === "low") chance -= 14;
    else if (cover.type === "wide") chance -= 25;
    else if (cover.type === "car") chance -= 20;
    else chance -= 22;
    if (cover.segments && cover.segments.length > 1) chance -= 4;
  }
  if (target.exposed) chance += 5;
  if (shooter.cover && !shooter.exposed) chance += 3;
  return Math.round(Math.max(8, Math.min(95, chance)));
}

export function drawCover(ctx, c, iso) {
  if (c.shape || (c.segments && c.segments.length)) {
    drawShapedCover(ctx, c, iso);
    return;
  }
  if (c.asset && drawCityAsset(ctx, c.asset, iso(c.x, c.y)[0], iso(c.x, c.y)[1], {
    scale: c.scale || 0.24,
  }))
    return;
  const q = iso(c.x, c.y);
  ctx.save();
  ctx.translate(q[0], q[1]);
  ctx.fillStyle = c.type === "low" ? "#6f6652" : "#5a6264";
  ctx.fillRect(-c.w * 0.14, -c.h * 0.28, c.w * 0.28, c.h * 0.28);
  ctx.restore();
}
