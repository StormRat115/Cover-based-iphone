import {
  isMeleeFocused,
  ignoresCover,
  inMeleeRange,
  meleeRangeOf,
  swingMelee,
  tickMeleeTimer,
  ensureMeleeWeapon,
} from "./melee.js?v=20260908-132";
import { moveTowardTarget, faceThreat } from "./combatAI.js?v=20260908-132";

export const ENGAGED = {
  chaseRange: 160,
  dogpileRange: 240,
  dogpileInterval: 0.85,
  dogpileChance: 0.42,
};

function living(actor) {
  return !!(actor && !actor.dead && !actor.downed && actor.hp > 0);
}

function opposing(a, b) {
  if (!living(a) || !living(b) || a === b) return false;
  var aFriend = !!(a.isPlayer || a.name || a.isMarine);
  var bFriend = !!(b.isPlayer || b.name || b.isMarine);
  return aFriend !== bFriend;
}

export { isMeleeFocused, ignoresCover, inMeleeRange, meleeRangeOf, ensureMeleeWeapon };

export function isEngaged(actor) {
  return !!(actor && actor.engaged && living(actor));
}

export function canRegen(actor) {
  if (!actor) return false;
  if (isEngaged(actor) && !actor.abilityRegenOverride) return false;
  return true;
}

export function coupleEngaged(a, b) {
  if (!living(a) || !living(b)) return false;
  a.engaged = true;
  b.engaged = true;
  a.engagedWith = b;
  b.engagedWith = a;
  a.cover = null;
  b.cover = null;
  a.exposed = true;
  b.exposed = true;
  return true;
}

export function clearEngaged(actor) {
  if (!actor) return;
  var other = actor.engagedWith;
  actor.engaged = false;
  actor.engagedWith = null;
  if (other && other.engagedWith === actor) {
    var still = false;
    // Keep the partner engaged if someone else is still on them.
    if (other.__engagedBy && other.__engagedBy !== actor) still = living(other.__engagedBy);
    if (!still) {
      other.engaged = false;
      other.engagedWith = null;
    }
  }
}

function hostilesNear(actor, others, range) {
  var list = [];
  (others || []).forEach(function (b) {
    if (!opposing(actor, b)) return;
    if (Math.hypot(actor.x - b.x, actor.y - b.y) <= range) list.push(b);
  });
  return list;
}

export function preferShootTargets(candidates) {
  var live = (candidates || []).filter(function (e) {
    return living(e) && !(e.spawnTimer > 0);
  });
  var free = live.filter(function (e) {
    return !e.engaged;
  });
  return free.length ? free : live;
}

export function engagedTargetPenalty(target) {
  return target && target.engaged ? -120 : 16;
}

export function shouldSkipEngagedTarget(target, candidates) {
  if (!target || !target.engaged) return false;
  return (candidates || []).some(function (e) {
    return living(e) && !(e.spawnTimer > 0) && !e.engaged && e !== target;
  });
}

export function tickEngaged(actor, dt, everyone) {
  tickMeleeTimer(actor, dt);
  if (!living(actor)) {
    clearEngaged(actor);
    return;
  }
  var partner = actor.engagedWith;
  if (partner && !living(partner)) {
    var next = hostilesNear(actor, everyone, meleeRangeOf(actor) + 8)[0];
    if (next) coupleEngaged(actor, next);
    else clearEngaged(actor);
  }
}

export function tryStartMelee(actor, threat, everyone) {
  if (!living(actor) || !living(threat)) return false;
  if (!inMeleeRange(actor, threat)) return false;
  if (isMeleeFocused(actor) || isMeleeFocused(threat) || actor.engaged || threat.engaged)
    return coupleEngaged(actor, threat);
  return false;
}

export function updateEngagedFight(actor, dt, everyone) {
  if (!living(actor)) return false;
  var partner = living(actor.engagedWith) ? actor.engagedWith : null;
  if (!partner) {
    var near = hostilesNear(actor, everyone, meleeRangeOf(actor) + 12);
    partner = near[0] || null;
    if (partner) coupleEngaged(actor, partner);
  }
  if (!partner) {
    if (actor.engaged) clearEngaged(actor);
    return false;
  }
  actor.engaged = true;
  actor.engagedWith = partner;
  actor.cover = null;
  actor.exposed = true;
  actor.blocking = isMeleeFocused(actor);
  actor.combatState = "melee";
  faceThreat(actor, partner);
  actor.targetX = partner.x;
  actor.targetY = partner.y;
  var d = Math.hypot(actor.x - partner.x, actor.y - partner.y);
  if (d > 28) moveTowardTarget(actor, dt, isMeleeFocused(actor) ? 1.22 : 1.08);
  if (inMeleeRange(actor, partner)) swingMelee(actor, partner);
  if (!living(partner)) clearEngaged(actor);
  return true;
}

export function maybeDogpile(enemies, friendlies, dt) {
  var engagedAllies = (friendlies || []).filter(function (a) {
    return living(a) && a.engaged;
  });
  if (!engagedAllies.length) return;
  (enemies || []).forEach(function (e) {
    if (!living(e) || e.spawnTimer > 0) return;
    if (e.engaged) return;
    e.dogpileTimer = Math.max(0, (e.dogpileTimer || 0) - dt);
    var best = null,
      bestD = Infinity;
    engagedAllies.forEach(function (a) {
      var d = Math.hypot(e.x - a.x, e.y - a.y);
      if (d < bestD) {
        bestD = d;
        best = a;
      }
    });
    if (!best || bestD > ENGAGED.dogpileRange) return;
    if (e.dogpileTimer > 0) return;
    e.dogpileTimer = ENGAGED.dogpileInterval;
    if (Math.random() > ENGAGED.dogpileChance) return;
    e.joiningMelee = best;
    e.combatTarget = best;
    e.cover = null;
    e.exposed = true;
    e.coverBehavior = "rush";
  });
}

export function closeForMelee(actor, threat, dt, speed) {
  if (!living(actor) || !living(threat)) return false;
  actor.cover = null;
  actor.exposed = true;
  faceThreat(actor, threat);
  actor.targetX = threat.x;
  actor.targetY = threat.y;
  moveTowardTarget(actor, dt, speed || 1.2);
  return tryStartMelee(actor, threat, [threat]);
}

export function drawSwordMark(ctx, y) {
  if (!ctx) return;
  y = y == null ? -62 : y;
  ctx.save();
  ctx.translate(0, y);
  ctx.fillStyle = "#e8d48a";
  ctx.strokeStyle = "#2a1c0c";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, -13);
  ctx.lineTo(3.4, -1);
  ctx.lineTo(0, 1);
  ctx.lineTo(-3.4, -1);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "#c4a46a";
  ctx.fillRect(-5.2, -1.2, 10.4, 2.2);
  ctx.fillStyle = "#5a4030";
  ctx.fillRect(-1.15, 0.6, 2.3, 6);
  ctx.fillStyle = "#d8c47a";
  ctx.beginPath();
  ctx.arc(0, 7.4, 1.7, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

export function drawGreenPlus(ctx, y) {
  if (!ctx) return;
  y = y == null ? -70 : y;
  ctx.save();
  ctx.fillStyle = "#3ee36a";
  ctx.strokeStyle = "#0b3a18";
  ctx.lineWidth = 1.4;
  ctx.lineJoin = "round";
  ctx.beginPath();
  ctx.rect(-2.2, y - 9, 4.4, 18);
  ctx.rect(-7.5, y - 2.2, 15, 4.4);
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

export function drawCombatMarks(ctx, actor) {
  if (!ctx || !living(actor)) return;
  if (actor.engaged) drawSwordMark(ctx, -64);
  if ((actor.stemMark || 0) > 0 || (actor.legionaryTimer || 0) > 0)
    drawGreenPlus(ctx, actor.engaged ? -82 : -70);
  if ((actor.heatRounds || 0) > 0) {
    ctx.save();
    ctx.font = "900 8px system-ui";
    ctx.textAlign = "center";
    ctx.fillStyle = "#ffb040";
    ctx.strokeStyle = "#3a1800";
    ctx.lineWidth = 3;
    ctx.strokeText("HEAT", 0, -78);
    ctx.fillText("HEAT", 0, -78);
    ctx.restore();
  }
}
