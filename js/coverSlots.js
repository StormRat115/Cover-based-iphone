import {
  describeOuterSlots,
  livingBlocks,
  slotCountFromBlocks,
} from "./coverBlocks.js?v=20260906-103";

function segmentsOf(cover) {
  if (cover && cover.blocks && cover.blocks.length) {
    var size = cover.blockSize || 40;
    return livingBlocks(cover).map(function (b) {
      return {
        x: cover.x + b.dx,
        y: cover.y + b.dy,
        w: size,
        h: size,
        gx: b.gx,
        gy: b.gy,
      };
    });
  }
  if (cover && cover.segments && cover.segments.length)
    return cover.segments.map(function (s) {
      return {
        x: cover.x + (s.dx || 0),
        y: cover.y + (s.dy || 0),
        w: s.w,
        h: s.h,
      };
    });
  return [
    {
      x: cover.x,
      y: cover.y,
      w: cover.w || 120,
      h: cover.h || 34,
    },
  ];
}

function nearSquare(seg) {
  var long = Math.max(seg.w, seg.h),
    short = Math.min(seg.w, seg.h);
  return long < 110 && short > 50 && long / short < 1.45;
}

function slotsOnSegment(seg, shape) {
  var long = Math.max(seg.w, seg.h);
  if (shape === "square" || nearSquare(seg)) return long >= 80 ? 2 : 1;
  if (long < 90) return 1;
  if (long < 150) return 2;
  if (long < 210) return 3;
  return 4;
}

export function coverSlotPlan(cover) {
  if (cover && cover.blocks && cover.blocks.length) {
    var live = livingBlocks(cover);
    var n = slotCountFromBlocks(live);
    var segs = segmentsOf(cover);
    if (!segs.length) return [{ segment: { x: cover.x, y: cover.y, w: 40, h: 40 }, count: 1 }];
    var per = Math.max(1, Math.floor(n / segs.length));
    var rem = n;
    return segs.map(function (seg, i) {
      var count = i === segs.length - 1 ? rem : Math.min(per, rem);
      rem -= count;
      return { segment: seg, count: Math.max(0, count) };
    });
  }
  var segs = segmentsOf(cover),
    shape = cover.shape || (segs.length === 1 && nearSquare(segs[0]) ? "square" : "rect"),
    counts,
    i;
  if (shape === "square" && segs.length === 1) counts = [slotsOnSegment(segs[0], "square")];
  else if (segs.length === 1) counts = [slotsOnSegment(segs[0], shape)];
  else
    counts = segs.map(function (seg) {
      return Math.max(seg.w, seg.h) >= 200 ? 2 : 1;
    });
  var plan = [];
  for (i = 0; i < segs.length; i++) {
    plan.push({ segment: segs[i], count: counts[i] });
  }
  return plan;
}

export function coverSlotCount(cover) {
  if (!cover) return 1;
  if (cover.blocks && cover.blocks.length)
    return Math.max(1, slotCountFromBlocks(cover.blocks));
  if (Number.isFinite(cover.slotCount) && cover.slotCount > 0) return cover.slotCount;
  var plan = coverSlotPlan(cover),
    n = 0,
    i;
  for (i = 0; i < plan.length; i++) n += plan[i].count;
  return Math.max(1, n);
}

function facingSide(cover, threat, actor) {
  var dx, dy;
  if (threat) {
    dx = threat.x - cover.x;
    dy = threat.y - cover.y;
    if (Math.abs(dx) > Math.abs(dy) * 1.15) return dx < 0 ? "right" : "left";
    return dy < 0 ? "bottom" : "top";
  }
  if (actor) {
    dx = actor.x - cover.x;
    dy = actor.y - cover.y;
    if (Math.abs(dx) > Math.abs(dy) * 1.15) return dx < 0 ? "left" : "right";
    return dy < 0 ? "top" : "bottom";
  }
  return "bottom";
}

function pointOnSegment(seg, side, localIndex, localCount, cover) {
  var inset = cover.type === "wide" ? 20 : 16,
    standoff = cover.type === "low" ? 16 : 18,
    t = localCount <= 1 ? 0.5 : localIndex / (localCount - 1),
    x = seg.x,
    y = seg.y;
  if (side === "top" || side === "bottom") {
    var usableX = Math.max(16, seg.w - inset * 2);
    x = seg.x - usableX / 2 + usableX * t;
    y = side === "top" ? seg.y - seg.h / 2 - standoff : seg.y + seg.h / 2 + standoff;
  } else {
    var usableY = Math.max(14, seg.h - 16);
    y = seg.y - usableY / 2 + usableY * t;
    x = side === "left" ? seg.x - seg.w / 2 - standoff : seg.x + seg.w / 2 + standoff;
  }
  return { x: x, y: y, side: side, segment: seg };
}

export function slotWorldPoint(cover, index, threat, actor) {
  var side = facingSide(cover, threat, actor);
  if (cover && cover.blocks && cover.blocks.length) {
    var count = coverSlotCount(cover);
    var slots = describeOuterSlots(cover, side, count);
    var idx = Math.max(0, Math.min(slots.length - 1, index || 0));
    return slots[idx] || pointOnSegment(segmentsOf(cover)[0], side, 0, 1, cover);
  }
  var plan = coverSlotPlan(cover),
    count = coverSlotCount(cover),
    idx = Math.max(0, Math.min(count - 1, index || 0)),
    cursor = 0,
    i,
    local;
  for (i = 0; i < plan.length; i++) {
    if (idx < cursor + plan[i].count) {
      local = idx - cursor;
      return pointOnSegment(plan[i].segment, side, local, plan[i].count, cover);
    }
    cursor += plan[i].count;
  }
  return pointOnSegment(plan[0].segment, side, 0, plan[0].count, cover);
}

export function describeCoverSlots(cover, threat, actor) {
  var count = coverSlotCount(cover),
    slots = [],
    i,
    p;
  for (i = 0; i < count; i++) {
    p = slotWorldPoint(cover, i, threat, actor);
    slots.push({
      index: i,
      x: p.x,
      y: p.y,
      side: p.side,
      segment: p.segment,
    });
  }
  return slots;
}

export function claimedIndexes(cover, actors, ignore) {
  var used = {},
    i,
    a;
  for (i = 0; i < (actors || []).length; i++) {
    a = actors[i];
    if (!a || a === ignore || a.dead || a.downed || a.hp <= 0) continue;
    if (a.cover !== cover) continue;
    if (!Number.isFinite(a.coverSlotIndex)) continue;
    used[a.coverSlotIndex] = true;
  }
  return used;
}

export function claimedCount(cover, actors, ignore) {
  var used = claimedIndexes(cover, actors, ignore),
    n = 0,
    key;
  for (key in used) if (used[key]) n++;
  return n;
}

export function isCoverFull(cover, actors, ignore) {
  return claimedCount(cover, actors, ignore) >= coverSlotCount(cover);
}

export function firstFreeSlotIndex(cover, actors, ignore) {
  var used = claimedIndexes(cover, actors, ignore),
    count = coverSlotCount(cover),
    i;
  for (i = 0; i < count; i++) if (!used[i]) return i;
  return -1;
}

export function reserveCoverSlot(cover, actor, threat, actors) {
  var idx = firstFreeSlotIndex(cover, actors, actor);
  if (idx < 0) return null;
  var point = slotWorldPoint(cover, idx, threat, actor);
  return {
    index: idx,
    x: point.x,
    y: point.y,
    side: point.side,
    segment: point.segment,
  };
}

export function nearestFreeSlot(cover, point, threat, actors, ignore) {
  var used = claimedIndexes(cover, actors, ignore),
    slots = describeCoverSlots(cover, threat, point),
    best = null,
    bestD = Infinity,
    i,
    slot,
    d;
  for (i = 0; i < slots.length; i++) {
    slot = slots[i];
    if (used[slot.index]) continue;
    d = Math.hypot(slot.x - point.x, slot.y - point.y);
    if (d < bestD) {
      bestD = d;
      best = slot;
    }
  }
  return best;
}

export function occupancyPenalty(cover, actors, ignore) {
  var count = coverSlotCount(cover),
    n = claimedCount(cover, actors, ignore);
  if (n >= count) return 3200;
  return n * 520 + (n / count) * 260;
}
