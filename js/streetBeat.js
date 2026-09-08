/* Post-objective breath, then a directed breach beat. */

import { tryFacadeDoorBurst } from "./facadeDoors.js?v=20260908-128";
import { spawnWreckDetonation } from "./combatVfx.js?v=20260908-128";
import { damageCover, isSoftCover } from "./destructibleCover.js?v=20260908-128";

export const STREET_BREATH = {
  min: 2.15,
  max: 3.55,
};

export function beginStreetBreath(state, completed, random) {
  if (!state || !completed) return null;
  random = random || Math.random;
  state.breath = {
    t: 0,
    duration: STREET_BREATH.min + random() * (STREET_BREATH.max - STREET_BREATH.min),
    x: completed.x,
    y: completed.y,
    id: completed.id,
    type: completed.type,
    breached: false,
  };
  return state.breath;
}

export function isStreetBreathing(state) {
  return !!(state && state.breath && state.breath.t < state.breath.duration);
}

export function streetBreathRemaining(state) {
  if (!isStreetBreathing(state)) return 0;
  return Math.max(0, state.breath.duration - state.breath.t);
}

export function tickStreetBreath(state, dt) {
  if (!state || !state.breath) return null;
  state.breath.t += dt;
  if (state.breath.t >= state.breath.duration) {
    var done = state.breath;
    state.breath = null;
    return { finished: done };
  }
  return { breathing: state.breath };
}

export function applyStreetBreathHold(actors) {
  var held = 0;
  (actors || []).forEach(function (a) {
    if (!a || a.dead || a.downed) return;
    a.objectiveHold = true;
    a.missionPause = Math.max(a.missionPause || 0, 0.35);
    a.repositionCooldown = Math.max(a.repositionCooldown || 0, 0.2);
    if (a.weapon && !a.reloading && !a.weapon.infinite) {
      var mag = a.weapon.magazine || 0;
      if (mag && a.weapon.ammo < mag) {
        if (typeof a.startReload === "function") a.startReload();
        else {
          a.reloading = true;
          a.reloadTimer = a.weapon.reload || 1.15;
        }
      }
    }
    if (a.cover && Number.isFinite(a.coverAnchorX)) {
      a.targetX = a.coverAnchorX;
      a.targetY = a.coverAnchorY;
      a.combatState = "covered";
      a.exposed = false;
    }
    if (a.calloutTimer <= 0 || !a.callout) {
      a.callout = a.isMarine ? "CHECK AMMO." : "MAG CHECK.";
      a.calloutTimer = 1.15;
    }
    held++;
  });
  return held;
}

function nearestSoftWreck(covers, x, y) {
  var best = null;
  var bestD = 720;
  (covers || []).forEach(function (c) {
    if (!c || c.destroyed || !isSoftCover(c)) return;
    if (c.theme !== "wreck" && !c.blockade) return;
    var d = Math.hypot(c.x - x, c.y - y);
    if (d < bestD) {
      bestD = d;
      best = c;
    }
  });
  return best;
}

export function triggerBreachBeat(opts) {
  opts = opts || {};
  var x = opts.x || 0;
  var y = opts.y || 0;
  var door = tryFacadeDoorBurst(opts.director, {
    force: true,
    wave: opts.wave,
    waveState: "active",
    enemies: opts.enemies,
    world: opts.world,
    onScreen: opts.onScreen,
    rebuildLayers: opts.rebuildLayers,
    random: opts.random,
  });
  var wreck = nearestSoftWreck(opts.covers, x, y);
  var boomAt = wreck ? { x: wreck.x, y: wreck.y } : { x: x, y: y - 50 };
  spawnWreckDetonation(boomAt.x, boomAt.y);
  if (wreck) {
    damageCover(wreck, 999, opts.occupants || [], null);
  }
  if (opts.actors) {
    opts.actors.forEach(function (a) {
      if (!a || a.dead || a.downed) return;
      if ((a.calloutTimer || 0) > 0.4) return;
      a.callout = a.isMarine ? "BREACHING!" : "PUSH UP!";
      a.calloutTimer = 1.2;
    });
  }
  return { door: door, wreck: wreck, x: boomAt.x, y: boomAt.y };
}
