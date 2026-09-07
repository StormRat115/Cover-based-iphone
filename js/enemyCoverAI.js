import {
  pickTacticalCover,
  applyCoverChoice,
  coverProtects,
  peekPoint,
} from "./combatAI.js?v=20260907-115";
import { seeksCover } from "./enemyStance.js?v=20260907-115";
import {
  isCoverFull,
  occupancyPenalty,
  reserveCoverSlot,
} from "./coverSlots.js?v=20260907-115";

function living(list) {
  return (list || []).filter(function (a) {
    return a && !a.dead && !a.downed && a.hp > 0;
  });
}

export function isCoverUser(enemy) {
  return seeksCover(enemy);
}

export function coverOptionsFor(enemy) {
  var role = enemy && enemy.weapon ? enemy.weapon.role : "assault";
  return {
    desiredRange: role === "precision" ? 980 : role === "marksman" ? 820 : role === "flanker" ? 500 : role === "breach" ? 380 : 640,
    maxTravel: 1700,
    minThreat: role === "breach" ? 140 : role === "flanker" ? 170 : 180,
    maxThreat: role === "precision" ? 1700 : 1550,
    flankSide: role === "flanker" || role === "assault" ? enemy.flankSide || 0 : 0,
    flankWeight: role === "flanker" ? 320 : 140,
  };
}

function fallbackProtectedCover(enemy, threat, covers, friendlies) {
  var best = null,
    bestScore = Infinity;
  for (var i = 0; i < (covers || []).length; i++) {
    var c = covers[i];
    if (!c || c.destroyed) continue;
    if (isCoverFull(c, friendlies || [], enemy)) continue;
    var slot = reserveCoverSlot(c, enemy, threat, friendlies || []);
    if (!slot) continue;
    var travel = Math.hypot(slot.x - enemy.x, slot.y - enemy.y);
    if (travel > 1850) continue;
    var protectedSlot = coverProtects(c, slot, threat);
    var score =
      travel * 0.7 +
      occupancyPenalty(c, friendlies || [], enemy) +
      (protectedSlot ? -380 : 520);
    if (score < bestScore) {
      bestScore = score;
      best = {
        cover: c,
        slot: { x: slot.x, y: slot.y, index: slot.index, side: slot.side },
        protected: protectedSlot,
        score: score,
      };
    }
  }
  return best;
}

export function pickEnemyCover(enemy, threat, covers, friendlies, forceNew) {
  if (!isCoverUser(enemy) || !threat || !covers || !covers.length) return null;
  var opts = coverOptionsFor(enemy);
  opts.forceNew = !!forceNew;
  opts.threats = living(friendlies);
  var choice = pickTacticalCover(enemy, threat, covers, friendlies, opts);
  if (choice && choice.protected) return choice;
  var fallback = fallbackProtectedCover(enemy, threat, covers, friendlies);
  if (fallback && fallback.protected) return fallback;
  return choice || fallback;
}

export function assignEnemyCover(enemy, threat, covers, friendlies, forceNew) {
  var choice = pickEnemyCover(enemy, threat, covers, friendlies, forceNew);
  if (!choice) return false;
  applyCoverChoice(enemy, choice);
  enemy.combatState = "seeking";
  enemy.exposed = true;
  enemy.coverCycles = 0;
  return true;
}

export function threatAwarePeek(enemy, threat) {
  if (!enemy || !enemy.cover) return { x: enemy.x, y: enemy.y };
  return peekPoint(enemy, threat, enemy.cover.type === "wide" ? 58 : 44);
}
