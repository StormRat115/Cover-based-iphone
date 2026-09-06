import { isLineBlocked } from "./cover.js?v=20260906-102";
import {
  resolveSolidMove,
  updateVault,
  findDetour,
  firstCoverOnSegment,
  ignoreCoverFor,
} from "./coverCollision.js?v=20260906-102";
import { composeSolidAndUnitMove } from "./unitCollision.js?v=20260906-102";
import {
  coverSlotCount,
  isCoverFull,
  occupancyPenalty,
  reserveCoverSlot,
} from "./coverSlots.js?v=20260906-102";
import {
  suppressionPeekScale,
  suppressionMoveScale,
} from "./suppression.js?v=20260906-102";
function dist(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}
function clamp(v, a, b) {
  return Math.max(a, Math.min(b, v));
}
function candidateSlot(cover, actor, threat, actors) {
  return reserveCoverSlot(cover, actor, threat, actors || []);
}
function flankValue(actor, threat, slot) {
  var ax = actor.x - threat.x,
    ay = actor.y - threat.y,
    bx = slot.x - threat.x,
    by = slot.y - threat.y,
    al = Math.hypot(ax, ay) || 1,
    bl = Math.hypot(bx, by) || 1;
  return clamp((ax * by - ay * bx) / (al * bl), -1, 1);
}
export function coverProtects(cover, slot, threat) {
  if (!cover || !slot || !threat) return false;
  return isLineBlocked({ x: slot.x, y: slot.y }, threat, [cover]);
}
export function pickTacticalCover(actor, threat, covers, friendlies, options) {
  options = options || {};
  if (!actor || !threat || !covers || !covers.length) return null;
  var desired = options.desiredRange || 560,
    maxTravel = options.maxTravel || 1150,
    minThreat = options.minThreat || 220,
    maxThreat = options.maxThreat || Math.max(desired * 1.9, 1100),
    flankSide = options.flankSide || 0,
    flankWeight = options.flankWeight == null ? 150 : options.flankWeight,
    anchor = options.anchor || null,
    anchorWeight = options.anchorWeight == null ? 0.18 : options.anchorWeight,
    threats = options.threats || [],
    forceNew = !!options.forceNew,
    best = null,
    bestScore = Infinity;
  for (var i = 0; i < covers.length; i++) {
    var c = covers[i];
    if (!c || c.destroyed) continue;
    var travel = Math.hypot(c.x - actor.x, c.y - actor.y);
    if (travel > maxTravel) continue;
    if (isCoverFull(c, friendlies || [], actor)) continue;
    var slot = candidateSlot(c, actor, threat, friendlies || []);
    if (!slot) continue;
    var threatDist = Math.hypot(slot.x - threat.x, slot.y - threat.y);
    if (threatDist < minThreat || threatDist > maxThreat) continue;
    var protection = coverProtects(c, slot, threat),
      midpoint = { x: (actor.x + slot.x) * 0.5, y: (actor.y + slot.y) * 0.5 },
      routeCovered = isLineBlocked(midpoint, threat, covers);
    var score = travel * 0.62 + Math.abs(threatDist - desired) * 0.38;
    score += protection ? -330 : 420;
    if (!routeCovered && travel > 170) score += Math.min(260, travel * 0.26);
    if (routeCovered) score -= 45;
    score += occupancyPenalty(c, friendlies || [], actor);
    score += coverSlotCount(c) <= 1 ? 40 : 0;
    if (c.type === "wide" || c.type === "car") score -= 70;
    else if (c.type === "low") score += 20;
    if (c.segments && c.segments.length > 1) score -= 55;
    var lateral = flankValue(actor, threat, slot);
    var orderFlank = actor.orderFlank || 0;
    if (flankSide || orderFlank)
      score -= lateral * (flankSide || orderFlank) * flankWeight;
    else score -= Math.abs(lateral) * 55;
    if (anchor)
      score += Math.hypot(slot.x - anchor.x, slot.y - anchor.y) * anchorWeight;
    if (threats.length > 1) {
      var crossfireExposure = 0;
      for (var k = 0; k < threats.length; k++) {
        var secondary = threats[k];
        if (
          !secondary ||
          secondary === threat ||
          secondary.dead ||
          secondary.downed
        )
          continue;
        if (!coverProtects(c, slot, secondary)) crossfireExposure++;
      }
      score += crossfireExposure * 135;
    }
    if (actor.cover === c) score += forceNew ? 420 : -150;
    if (actor.lastCoverId && actor.lastCoverId === c.id && forceNew)
      score += 180;
    score += (Math.random() - 0.5) * 36;
    if (score < bestScore) {
      bestScore = score;
      best = {
        cover: c,
        slot: slot,
        score: score,
        protected: protection,
        threatDistance: threatDist,
      };
    }
  }
  return best;
}
export function applyCoverChoice(actor, choice) {
  if (!actor || !choice) return false;
  if (actor.cover && actor.cover !== choice.cover)
    actor.lastCoverId = actor.cover.id || null;
  actor.cover = choice.cover;
  actor.coverSlotIndex = choice.slot.index;
  actor.coverAnchorX = choice.slot.x;
  actor.coverAnchorY = choice.slot.y;
  actor.targetX = choice.slot.x;
  actor.targetY = choice.slot.y;
  actor.exposed = false;
  actor.suppressionTimer = 0;
  return true;
}
export function moveTowardTarget(actor, dt, speedScale, covers) {
  covers =
    covers ||
    (typeof window !== "undefined" && window.__battleCovers) ||
    [];
  if (actor.vaulting) {
    updateVault(actor, dt);
    return false;
  }
  if (actor.hit > 0) {
    var pin = actor.isPlayer || actor.name || actor.isMarine ? 0.35 : 1.15;
    actor.suppressionTimer = Math.max(actor.suppressionTimer || 0, pin);
  } else actor.suppressionTimer = Math.max(0, (actor.suppressionTimer || 0) - dt);
  if (
    Number.isFinite(actor.detourX) &&
    Math.hypot(actor.x - actor.targetX, actor.y - actor.targetY) <= 8
  ) {
    actor.targetX = actor.detourX;
    actor.targetY = actor.detourY;
    actor.detourX = undefined;
    actor.detourY = undefined;
  }
  var dx = actor.targetX - actor.x,
    dy = actor.targetY - actor.y,
    d = Math.hypot(dx, dy);
  if (d <= 6) {
    actor.x = actor.targetX;
    actor.y = actor.targetY;
    return true;
  }
  var anchorDistance =
    actor.cover &&
    Number.isFinite(actor.coverAnchorX) &&
    Number.isFinite(actor.coverAnchorY)
      ? Math.hypot(actor.x - actor.coverAnchorX, actor.y - actor.coverAnchorY)
      : 999;
  var movingToDifferentCover =
    actor.cover &&
    Math.hypot(
      actor.targetX - actor.coverAnchorX,
      actor.targetY - actor.coverAnchorY,
    ) < 8 &&
    anchorDistance > 70;
  if (
    (actor.suppressionTimer || 0) > 0 &&
    actor.cover &&
    anchorDistance < 42 &&
    !movingToDifferentCover
  )
    return false;
  actor.facingX = dx / d;
  actor.facingY = dy / d;
  var step = Math.min(
    d,
    actor.speed *
      (speedScale || 1) *
      (actor.orderSpeed || 1) *
      suppressionMoveScale(actor) *
      dt,
  );
  var ox = actor.x,
    oy = actor.y,
    nx = actor.x + (dx / d) * step,
    ny = actor.y + (dy / d) * step,
    walkingToOwnCover =
      actor.cover &&
      Math.hypot(actor.targetX - actor.coverAnchorX, actor.targetY - actor.coverAnchorY) <
        10,
    result = composeSolidAndUnitMove(
      resolveSolidMove(actor, nx, ny, covers, {
        target: { x: actor.targetX, y: actor.targetY },
        allowVault: !walkingToOwnCover,
      }),
      actor,
    );
  actor.x = result.x;
  actor.y = result.y;
  if (result.vaulted) return false;
  if (result.blocked && result.x === ox && result.y === oy) {
    var hit = firstCoverOnSegment(
      actor,
      { x: actor.targetX, y: actor.targetY },
      covers,
      ignoreCoverFor(actor),
    );
    if (hit) {
      var detour = findDetour(
        actor,
        { x: actor.targetX, y: actor.targetY },
        hit.cover,
        covers,
      );
      if (detour) {
        actor.detourX = actor.targetX;
        actor.detourY = actor.targetY;
        actor.targetX = detour.x;
        actor.targetY = detour.y;
      }
    }
  }
  return Math.hypot(actor.x - actor.targetX, actor.y - actor.targetY) <= 10;
}
export function faceThreat(actor, threat) {
  if (!actor || !threat) return;
  var dx = threat.x - actor.x,
    dy = threat.y - actor.y,
    d = Math.hypot(dx, dy) || 1;
  actor.facingX = dx / d;
  actor.facingY = dy / d;
}
export function coverStillUseful(actor, threat, covers, minRange, maxRange) {
  if (!actor || !actor.cover || !threat) return false;
  var slot = { x: actor.coverAnchorX, y: actor.coverAnchorY };
  if (!Number.isFinite(slot.x) || !Number.isFinite(slot.y)) return false;
  var d = Math.hypot(slot.x - threat.x, slot.y - threat.y);
  if (d < (minRange || 180) || d > (maxRange || 1400)) return false;
  return coverProtects(actor.cover, slot, threat);
}
export function isCoverFlanked(actor, threat, covers) {
  if (!actor || !actor.cover || !threat) return true;
  var slot = { x: actor.coverAnchorX, y: actor.coverAnchorY };
  if (!coverProtects(actor.cover, slot, threat)) return true;
  return Math.hypot(slot.x - threat.x, slot.y - threat.y) < 170;
}
export function peekPoint(actor, threat, amount) {
  if (!actor || !actor.cover) return { x: actor.x, y: actor.y };
  var ax = actor.coverAnchorX,
    ay = actor.coverAnchorY;
  if (
    (actor.suppressionTimer || 0) > 0 ||
    (Number.isFinite(actor.timeSinceDamage) && actor.timeSinceDamage < 1.35)
  )
    return { x: ax, y: ay };
  var tx = threat ? threat.x - ax : 1,
    ty = threat ? threat.y - ay : 0,
    len = Math.hypot(tx, ty) || 1,
    px = -ty / len,
    py = tx / len,
    side = (actor.coverSlotIndex || 0) === 0 ? -1 : 1,
    step =
      (amount || (actor.cover.type === "wide" ? 50 : 38)) *
      suppressionPeekScale(actor);
  return { x: ax + px * step * side, y: ay + py * step * side };
}
