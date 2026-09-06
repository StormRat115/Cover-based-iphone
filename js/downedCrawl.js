import { getCoverSlot, isLineBlocked } from "./cover.js?v=20260906-103";
import { moveTowardTarget } from "./combatAI.js?v=20260906-103";

function livingCover(c) {
  return !!(c && !c.destroyed);
}

function nearestThreat(actor, threats) {
  var best = null,
    bestD = Infinity;
  (threats || []).forEach(function (e) {
    if (!e || e.dead || e.downed || (e.spawnTimer || 0) > 0) return;
    var d = Math.hypot(e.x - actor.x, e.y - actor.y);
    if (d < bestD) {
      bestD = d;
      best = e;
    }
  });
  return best;
}

export function pickSaferCover(actor, covers, threats) {
  if (!actor || !covers || !covers.length) return null;
  if (livingCover(actor.cover)) {
    var stay = getCoverSlot(actor.cover, actor, nearestThreat(actor, threats));
    if (stay) {
      return {
        cover: actor.cover,
        x: stay.x,
        y: stay.y,
        already: true,
      };
    }
  }
  var threat = nearestThreat(actor, threats);
  var best = null,
    bestScore = Infinity;
  for (var i = 0; i < covers.length; i++) {
    var c = covers[i];
    if (!livingCover(c)) continue;
    var slot = getCoverSlot(c, actor, threat);
    var travel = Math.hypot(slot.x - actor.x, slot.y - actor.y);
    if (travel > 720) continue;
    var protectedSpot = threat
      ? isLineBlocked({ x: slot.x, y: slot.y }, threat, [c])
      : true;
    var score = travel * (protectedSpot ? 0.7 : 1.35);
    if (c.type === "wide" || c.theme === "jersey") score -= 40;
    if (score < bestScore) {
      bestScore = score;
      best = { cover: c, x: slot.x, y: slot.y, already: travel < 22 };
    }
  }
  return best;
}

export function updateDownedCrawl(actor, dt, covers, threats) {
  if (!actor || actor.dead || !actor.downed) return false;
  actor.downTimer = (actor.downTimer || 0) + dt;
  var goal = pickSaferCover(actor, covers, threats);
  if (!goal) {
    actor.crawlSettled = true;
    actor.targetX = actor.x;
    actor.targetY = actor.y;
    return true;
  }
  actor.cover = goal.cover;
  actor.coverAnchorX = goal.x;
  actor.coverAnchorY = goal.y;
  actor.targetX = goal.x;
  actor.targetY = goal.y;
  actor.tx = goal.x;
  actor.ty = goal.y;
  var dist = Math.hypot(actor.x - goal.x, actor.y - goal.y);
  if (dist <= 16 || goal.already) {
    actor.x = goal.x;
    actor.y = goal.y;
    actor.crawlSettled = true;
    actor.exposed = false;
    actor.state = "downed";
    return true;
  }
  actor.crawlSettled = false;
  actor.exposed = false;
  actor.state = "downed";
  var prevSpeed = actor.speed;
  actor.speed = Math.max(38, (prevSpeed || 180) * 0.28);
  actor.vaulting = false;
  moveTowardTarget(actor, dt, 1, covers);
  actor.speed = prevSpeed;
  return true;
}
