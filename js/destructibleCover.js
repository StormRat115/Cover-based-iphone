/* Soft street pieces break. Tall jersey stays up. Block-grid HP for soft cover. */

import {
  findBlockAtPiece,
  livingBlocks,
  syncCoverGeometry,
} from "./coverBlocks.js?v=20260906-107";

export const COVER_HP = {
  sandbags: 78,
  crates: 88,
  wreck: 110,
  rubble: 64,
  jersey: Infinity,
};

export function isSoftCover(cover) {
  if (!cover) return false;
  var theme = cover.theme || "";
  return (
    theme === "sandbags" ||
    theme === "crates" ||
    theme === "wreck" ||
    theme === "rubble"
  );
}

export function isHardCover(cover) {
  return !!(cover && !isSoftCover(cover));
}

export function prepareCoverHp(cover) {
  if (!cover) return cover;
  var theme = cover.theme || "jersey";
  var hp = COVER_HP[theme];
  if (hp == null) hp = isSoftCover(cover) ? 80 : Infinity;
  cover.maxHp = hp;
  cover.hp = hp;
  cover.destroyed = false;
  cover.destructible = Number.isFinite(hp);
  cover.damageFlash = 0;
  if (cover.blocks && cover.blocks.length) {
    cover.blocks.forEach(function (b) {
      var blockTheme = b.theme || theme;
      var blockHp = COVER_HP[blockTheme];
      if (blockHp == null) blockHp = Number.isFinite(hp) ? hp : Infinity;
      b.maxHp = blockHp;
      b.hp = blockHp;
      b.destroyed = false;
    });
  }
  return cover;
}

export function coverHealthRatio(cover) {
  if (!cover || !Number.isFinite(cover.maxHp) || cover.maxHp <= 0) return 1;
  return Math.max(0, Math.min(1, (cover.hp || 0) / cover.maxHp));
}

export function livingCovers(covers) {
  return (covers || []).filter(function (c) {
    return c && !c.destroyed;
  });
}

export function evictCoverUsers(cover, units) {
  var freed = 0;
  (units || []).forEach(function (u) {
    if (!u) return;
    if (u.cover === cover) {
      u.cover = null;
      u.coverTarget = null;
      u.exposed = true;
      u.combatState = "seeking";
      freed++;
    }
  });
  return freed;
}

export function damageCover(cover, amount, occupants, piece) {
  if (!cover || cover.destroyed || !cover.destructible) return false;
  var dmg = Math.max(0, Number(amount) || 0);
  if (dmg <= 0) return false;
  cover.damageFlash = 0.22;
  if (piece && cover.blocks && cover.blocks.length) {
    var block = findBlockAtPiece(cover, piece);
    if (block && !block.destroyed && Number.isFinite(block.hp)) {
      block.hp = Math.max(0, block.hp - dmg);
      if (block.hp <= 0) {
        block.destroyed = true;
        block.hp = 0;
      }
      var live = livingBlocks(cover);
      cover.hp = live.reduce(function (sum, b) {
        return sum + (Number.isFinite(b.hp) ? b.hp : 0);
      }, 0);
      syncCoverGeometry(cover);
      if (!live.length || cover.destroyed) {
        cover.destroyed = true;
        cover.hp = 0;
        cover.rubbleT = 0;
        evictCoverUsers(cover, occupants);
        return true;
      }
      return false;
    }
  }
  cover.hp = Math.max(0, (cover.hp || 0) - dmg);
  if (cover.hp > 0) return false;
  cover.destroyed = true;
  cover.hp = 0;
  cover.rubbleT = 0;
  if (cover.blocks) {
    cover.blocks.forEach(function (b) {
      b.destroyed = true;
      b.hp = 0;
    });
    syncCoverGeometry(cover);
  }
  evictCoverUsers(cover, occupants);
  return true;
}

export function tickCoverVisuals(covers, dt) {
  (covers || []).forEach(function (c) {
    if (!c) return;
    if (c.damageFlash > 0) c.damageFlash = Math.max(0, c.damageFlash - dt);
    if (c.destroyed) c.rubbleT = (c.rubbleT || 0) + dt;
  });
}

export function firstLivingCoverOnSegment(from, to, covers, firstCoverOnSegment) {
  var alive = livingCovers(covers);
  return firstCoverOnSegment(from, to, alive);
}

export function drawCoverWear(ctx, cover, iso) {
  if (!cover) return;
  var q = iso(cover.x, cover.y);
  if (cover.destroyed) {
    ctx.save();
    ctx.translate(q[0], q[1]);
    ctx.globalAlpha = 0.88;
    ctx.fillStyle = "#4a4034";
    ctx.beginPath();
    ctx.ellipse(0, 4, Math.max(10, cover.w * 0.08), Math.max(5, cover.h * 0.05), 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#6a5a44";
    ctx.fillRect(-10, -3, 8, 5);
    ctx.fillRect(2, -2, 7, 4);
    ctx.fillStyle = "#2c261c";
    ctx.fillRect(-4, 0, 11, 3);
    ctx.restore();
    return;
  }
  var ratio = coverHealthRatio(cover);
  if (!cover.destructible || ratio > 0.84) {
    if (cover.damageFlash > 0) {
      ctx.save();
      ctx.globalAlpha = cover.damageFlash * 0.45;
      ctx.strokeStyle = "#ffd36a";
      ctx.lineWidth = 2;
      ctx.strokeRect(q[0] - 14, q[1] - 10, 28, 16);
      ctx.restore();
    }
    return;
  }
  ctx.save();
  ctx.translate(q[0], q[1]);
  ctx.globalAlpha = 0.55 + (1 - ratio) * 0.25;
  ctx.strokeStyle = ratio < 0.35 ? "#c45a3a" : "#c9a15a";
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(-12, -2);
  ctx.lineTo(-2, 4);
  ctx.lineTo(8, -3);
  ctx.stroke();
  if (ratio < 0.5) {
    ctx.beginPath();
    ctx.moveTo(-8, 5);
    ctx.lineTo(4, -5);
    ctx.stroke();
  }
  ctx.restore();
}
