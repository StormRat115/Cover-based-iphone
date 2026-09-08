/* Light incoming-fire suppression. Enemies get a short pin; friendlies barely flinch. */

import { notifySuppressionPin } from "./combatVfx.js?v=20260908-133";

export const SUPPRESSION = {
  enemyRadius: 210,
  enemyDuration: 0.78,
  enemyCap: 3,
  enemyPeekPerStack: 0.18,
  enemyAccPerStack: 4,
  friendlyRadius: 150,
  friendlyDuration: 0.26,
  friendlyCap: 1,
  friendlyPeekPerStack: 0.05,
  friendlyAccPerStack: 1,
  hardStacks: 2,
};

function living(actor) {
  return !!(actor && !actor.dead && !actor.downed && actor.hp > 0);
}

function isFriendly(actor) {
  return !!(actor && (actor.isPlayer || actor.isMarine || actor.name));
}

export function resetSuppression(actor) {
  if (!actor) return;
  actor.suppressStacks = 0;
  actor.suppressTimer = 0;
}

export function tickSuppression(actor, dt) {
  if (!actor) return 0;
  actor.suppressTimer = Math.max(0, (actor.suppressTimer || 0) - dt);
  if (actor.suppressTimer <= 0) actor.suppressStacks = 0;
  return actor.suppressStacks || 0;
}

export function applySuppression(actor, stacks, duration, cap) {
  if (!living(actor)) return 0;
  cap = cap == null ? 3 : cap;
  actor.suppressStacks = Math.min(cap, (actor.suppressStacks || 0) + stacks);
  actor.suppressTimer = Math.max(actor.suppressTimer || 0, duration);
  return actor.suppressStacks;
}

export function spraySuppression(origin, impact, victims, friendlyFire) {
  if (!origin || !impact || !victims) return 0;
  var spec = friendlyFire
    ? {
        radius: SUPPRESSION.enemyRadius,
        duration: SUPPRESSION.enemyDuration,
        cap: SUPPRESSION.enemyCap,
        stacks: 1,
      }
    : {
        radius: SUPPRESSION.friendlyRadius,
        duration: SUPPRESSION.friendlyDuration,
        cap: SUPPRESSION.friendlyCap,
        stacks: 1,
      };
  var pinned = 0;
  for (var i = 0; i < victims.length; i++) {
    var v = victims[i];
    if (!living(v) || v === origin) continue;
    if ((v.spawnTimer || 0) > 0 || v.pendingSegment) continue;
    var d = Math.hypot(v.x - impact.x, v.y - impact.y);
    if (d > spec.radius) continue;
    applySuppression(v, spec.stacks, spec.duration, spec.cap);
    pinned++;
  }
  if (pinned) notifySuppressionPin(origin, impact, victims);
  return pinned;
}

export function suppressionPeekScale(actor) {
  var stacks = actor && actor.suppressTimer > 0 ? actor.suppressStacks || 0 : 0;
  if (stacks <= 0) return 1;
  var per = isFriendly(actor)
    ? SUPPRESSION.friendlyPeekPerStack
    : SUPPRESSION.enemyPeekPerStack;
  return Math.max(0.42, 1 - per * stacks);
}

export function suppressionAccuracyDelta(actor) {
  var stacks = actor && actor.suppressTimer > 0 ? actor.suppressStacks || 0 : 0;
  if (stacks <= 0) return 0;
  var per = isFriendly(actor)
    ? SUPPRESSION.friendlyAccPerStack
    : SUPPRESSION.enemyAccPerStack;
  return -(per * stacks);
}

export function isHardSuppressed(actor) {
  return !!(
    actor &&
    (actor.suppressTimer || 0) > 0 &&
    (actor.suppressStacks || 0) >= SUPPRESSION.hardStacks
  );
}

export function suppressionMoveScale(actor) {
  if (!actor || (actor.suppressTimer || 0) <= 0) return 1;
  if (isFriendly(actor)) return 0.96;
  return Math.max(0.72, 1 - 0.09 * (actor.suppressStacks || 0));
}
