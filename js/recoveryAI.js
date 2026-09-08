import {
  pickTacticalCover,
  applyCoverChoice,
  moveTowardTarget,
  coverStillUseful,
  repathIfSlotContested,
} from "./combatAI.js?v=20260908-129";

export function recoverThreshold(actor) {
  if (!actor || actor.isPlayer || actor.isMarine) return 0.2;
  var mode =
    (typeof window !== "undefined" && window.squadMode) || "";
  if (mode === "AGGRESSIVE" || mode === "ASSAULT") return 0.1;
  return 0.2;
}

export function shouldRecover(actor) {
  if (!actor || actor.dead || actor.downed) return false;
  var pct = actor.maxHp > 0 ? actor.hp / actor.maxHp : 1;
  if (actor.recovering) {
    if (pct >= 0.5) {
      actor.recovering = false;
      actor.recoveryCoverChosen = false;
      return false;
    }
    return true;
  }
  if (pct <= recoverThreshold(actor)) {
    actor.recovering = true;
    actor.recoveryCoverChosen = false;
    actor.exposed = false;
    return true;
  }
  return false;
}

export function recoverInCover(actor, threat, covers, friendlies, dt) {
  if (!shouldRecover(actor)) return false;
  if (!threat) {
    actor.targetX = actor.x;
    actor.targetY = actor.y;
    return true;
  }
  var useful =
    actor.cover && coverStillUseful(actor, threat, covers, 120, 2600);
  if (!useful && !actor.recoveryCoverChosen) {
    var choice = pickTacticalCover(actor, threat, covers, friendlies || [], {
      maxTravel: 850,
      desiredRange: Math.min(
        ((actor.weapon && actor.weapon.range) || 1200) * 0.82,
        1350,
      ),
      anchor: { x: actor.x, y: actor.y },
      anchorWeight: 0.28,
    });
    if (choice) {
      applyCoverChoice(actor, choice);
      actor.combatState = "seeking";
      actor.recoveryCoverChosen = true;
    }
  }
  if (actor.cover) {
    repathIfSlotContested(actor, threat, covers, friendlies || [], {
      maxTravel: 850,
      desiredRange: Math.min(
        ((actor.weapon && actor.weapon.range) || 1200) * 0.82,
        1350,
      ),
    });
  }
  if (actor.cover) {
    actor.exposed = false;
    actor.targetX = actor.coverAnchorX;
    actor.targetY = actor.coverAnchorY;
    if (
      Math.hypot(actor.x - actor.coverAnchorX, actor.y - actor.coverAnchorY) > 8
    )
      moveTowardTarget(actor, dt, 1.12);
    else {
      actor.x = actor.coverAnchorX;
      actor.y = actor.coverAnchorY;
      actor.combatState = "covered";
    }
  }
  return true;
}
