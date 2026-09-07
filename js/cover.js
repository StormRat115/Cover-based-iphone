import { sampledLineIntersectsRect } from "./geometry.js?v=20260907-111";
const collisionPieces = new WeakMap();
import { drawShapedCover, drawCityAsset } from "./cityAssets.js?v=20260907-111";
import { createCityCoverLayout } from "./cityMap.js?v=20260907-111";
import {
  coverSlotCount,
  slotWorldPoint,
} from "./coverSlots.js?v=20260907-111";
import {
  prepareCoverHp,
  drawCoverWear,
} from "./destructibleCover.js?v=20260907-111";
import {
  COVER_BLOCK_SIZE,
  livingBlocks,
  syncCoverGeometry,
} from "./coverBlocks.js?v=20260907-111";
export {
  resolveSolidMove,
  updateVault,
  planRoute,
  continueRoute,
  isCoverJumpable,
  coverSolidClass,
  overlapsSolid,
  firstCoverOnSegment,
  VAULT_DURATION,
} from "./coverCollision.js?v=20260907-111";

/* Tactical cover: uniform square blocks assembled into random shapes. */
export function createCover(random) {
  const layout = createCityCoverLayout(random).map(function (item) {
    var cover = {
      id: item.id,
      x: item.x,
      y: item.y,
      w: item.w || COVER_BLOCK_SIZE,
      h: item.h || COVER_BLOCK_SIZE,
      type: item.coverType || item.type || "low",
      asset: item.asset,
      shape: item.shape || "rect",
      theme: item.theme || "jersey",
      facing: item.facing || 0,
      scale: item.scale || 0.24,
      blockSize: item.blockSize || COVER_BLOCK_SIZE,
      blocks: (item.blocks || []).map(function (b) {
        return Object.assign({}, b);
      }),
      segments: item.segments || null,
      grid: true,
      setPiece: item.setPiece || null,
    };
    syncCoverGeometry(cover);
    cover.slotCount = coverSlotCount(cover);
    return cover;
  });
  for (const cover of layout) {
    prepareCoverHp(cover);
    collisionPieces.set(cover, pieces(cover));
  }
  if (typeof window !== "undefined") window.__battleCovers = layout;
  return layout;
}

export function coverPieces(c) {
  return pieces(c);
}

export function registerCover(cover) {
  prepareCoverHp(cover);
  syncCoverGeometry(cover);
  collisionPieces.delete(cover);
  if (!cover.destroyed) collisionPieces.set(cover, pieces(cover));
  return cover;
}

function pieces(c) {
  if (c && c.destroyed) {
    collisionPieces.delete(c);
    return [];
  }
  if (c && c.blocks && c.blocks.length) {
    var size = c.blockSize || COVER_BLOCK_SIZE;
    return livingBlocks(c).map(function (b) {
      return {
        x: c.x + b.dx,
        y: c.y + b.dy,
        w: size,
        h: size,
        type: c.type,
        gx: b.gx,
        gy: b.gy,
        theme: b.theme || c.theme,
      };
    });
  }
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
    if (c && c.destroyed) continue;
    const ps = pieces(c);
    for (const p of ps) if (inside(p, x, y, 24, 18)) return c;
  }
  return null;
}

export function getCoverSlot(c, actor, threat) {
  if (!c || c.destroyed)
    return { x: (c && c.x) || 0, y: (c && c.y) || 0, side: "bottom" };
  var count = coverSlotCount(c);
  var index =
    actor && Number.isFinite(actor.coverSlotIndex)
      ? Math.max(0, Math.min(count - 1, actor.coverSlotIndex))
      : 0;
  return slotWorldPoint(c, index, threat, actor);
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
  var peekBlocks = c.blocks && c.blocks.length ? livingBlocks(c) : null;
  if (peekBlocks && peekBlocks.length > 1) {
    var used = 0;
    for (const b of peekBlocks) {
      if (used >= 6) break;
      const cx = c.x + b.dx,
        cy = c.y + b.dy,
        sx = Math.max(20, (c.blockSize || COVER_BLOCK_SIZE) * 0.48),
        sy = sx;
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
      used++;
    }
  } else if (c.segments && c.segments.length > 1) {
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
    if (cover && cover.destroyed) continue;
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
    if (
      (cover.blocks && livingBlocks(cover).length > 1) ||
      (cover.segments && cover.segments.length > 1)
    )
      chance -= 4;
  }
  if (target.exposed) chance += 5;
  if (shooter.cover && !shooter.exposed) chance += 3;
  return Math.round(Math.max(8, Math.min(95, chance)));
}

export function drawCover(ctx, c, iso) {
  if (c.destroyed) {
    drawCoverWear(ctx, c, iso);
    return;
  }
  if (c.shape || (c.segments && c.segments.length)) {
    drawShapedCover(ctx, c, iso);
    drawCoverWear(ctx, c, iso);
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
