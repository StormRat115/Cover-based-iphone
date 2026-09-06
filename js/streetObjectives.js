import { makeShapedCover } from "./cityMap.js?v=20260906-108";
import { prepareCoverHp } from "./destructibleCover.js?v=20260906-108";

export const OBJECTIVE_TYPES = ["hold_crosswalk", "clear_blockade", "escort_segment"];

function living(actor) {
  return !!(actor && !actor.dead && !actor.downed && actor.hp > 0);
}

function clamp(v, a, b) {
  return Math.max(a, Math.min(b, v));
}

function occupantsIn(zone, actors) {
  return (actors || []).filter(function (a) {
    return living(a) && Math.hypot(a.x - zone.x, a.y - zone.y) <= zone.radius;
  });
}

export function createStreetObjectives() {
  return {
    cooldown: 5.5,
    current: null,
    completed: 0,
    nextIndex: 0,
  };
}

export function resetStreetObjectives(state) {
  if (!state) return createStreetObjectives();
  state.cooldown = 5.5;
  state.current = null;
  state.completed = 0;
  state.nextIndex = 0;
  return state;
}

function nextType(state, random) {
  random = random || Math.random;
  var ordered = OBJECTIVE_TYPES;
  var type = ordered[state.nextIndex % ordered.length];
  if (random() < 0.18) type = ordered[Math.floor(random() * ordered.length)];
  state.nextIndex++;
  return type;
}

function frontY(actors, fallback) {
  var y = fallback == null ? 80 : fallback;
  (actors || []).forEach(function (a) {
    if (living(a) && a.y < y) y = a.y;
  });
  return y;
}

export function spawnStreetObjective(state, opts) {
  opts = opts || {};
  var random = opts.random || Math.random;
  var type = opts.type || nextType(state, random);
  var actors = opts.actors || [];
  var y = clamp(frontY(actors, 80) - (420 + random() * 260), -5200, 400);
  var x = clamp((random() - 0.5) * 220, -260, 260);
  var obj = {
    id: "obj-" + (state.completed + 1),
    type: type,
    x: x,
    y: y,
    radius: type === "escort_segment" ? 210 : 175,
    holdNeed: 7.5,
    hold: 0,
    destY: y - 380,
    speed: 46,
    label:
      type === "hold_crosswalk"
        ? "HOLD THE CROSSWALK"
        : type === "clear_blockade"
          ? "CLEAR THE WRECK LINE"
          : "ESCORT THE ADVANCE",
    wrecks: [],
    done: false,
    failed: false,
  };
  if (type === "clear_blockade" && opts.covers) {
    for (var i = 0; i < 3; i++) {
      var wreck = makeShapedCover({
        id: obj.id + "-wreck-" + i,
        x: x + (i - 1) * 118,
        y: y,
        shape: i === 1 ? "rect" : "L",
        theme: "wreck",
        facing: i === 2 ? 90 : 0,
        coverType: "car",
        scale: 0.26,
      });
      prepareCoverHp(wreck);
      wreck.blockade = true;
      opts.covers.push(wreck);
      obj.wrecks.push(wreck);
    }
  }
  state.current = obj;
  state.cooldown = 20 + random() * 8;
  return obj;
}

export function currentPushGoal(mission, streetState) {
  var active = streetState && streetState.current && !streetState.current.done;
  if (active) {
    return {
      x: streetState.current.x,
      y: streetState.current.y,
      radius: streetState.current.radius,
      source: "street",
      type: streetState.current.type,
    };
  }
  if (mission && mission.objective) {
    return {
      x: mission.objective.x,
      y: mission.objective.y,
      radius: mission.objective.radius,
      source: "fort",
    };
  }
  return null;
}

export function updateStreetObjectives(state, dt, opts) {
  opts = opts || {};
  if (!state) return null;
  var actors = []
    .concat(opts.player ? [opts.player] : [])
    .concat(opts.squad || [])
    .concat(opts.marines || []);
  if (!state.current) {
    state.cooldown = Math.max(0, (state.cooldown || 0) - dt);
    if (state.cooldown <= 0) spawnStreetObjective(state, {
      actors: actors,
      covers: opts.covers,
      random: opts.random,
    });
    return state.current;
  }
  var obj = state.current;
  var inside = occupantsIn(obj, actors);
  var marinesHere = inside.filter(function (a) {
    return a.isMarine;
  }).length;
  if (obj.type === "hold_crosswalk") {
    if (inside.length) obj.hold = Math.min(obj.holdNeed, obj.hold + dt);
    else obj.hold = Math.max(0, obj.hold - dt * 0.35);
    if (obj.hold >= obj.holdNeed) obj.done = true;
  } else if (obj.type === "clear_blockade") {
    var left = obj.wrecks.filter(function (w) {
      return w && !w.destroyed;
    }).length;
    if (left <= 0) obj.done = true;
  } else if (obj.type === "escort_segment") {
    if (inside.length) {
      obj.y = Math.max(obj.destY, obj.y - obj.speed * dt);
    }
    if (obj.y <= obj.destY + 8 && inside.length) obj.done = true;
  }
  if (obj.done) {
    state.completed++;
    state.current = null;
    state.cooldown = 16 + Math.random() * 10;
    return { justCompleted: obj, current: null };
  }
  obj.marinesPresent = marinesHere;
  obj.occupants = inside.length;
  return obj;
}

export function objectiveStatusLine(state) {
  if (!state || !state.current) {
    return state && state.completed
      ? "STREET CLEAR  •  NEXT TASK SOON"
      : "WAIT FOR THE NEXT STREET TASK";
  }
  var obj = state.current;
  if (obj.type === "hold_crosswalk") {
    return (
      obj.label +
      "  •  " +
      Math.max(0, obj.holdNeed - obj.hold).toFixed(1) +
      "s"
    );
  }
  if (obj.type === "clear_blockade") {
    var left = obj.wrecks.filter(function (w) {
      return w && !w.destroyed;
    }).length;
    return obj.label + "  •  " + left + " WRECKS";
  }
  return obj.label + "  •  STAY WITH THE MARKER";
}

export function drawStreetTask(ctx, iso, state) {
  if (!state || !state.current) return;
  var obj = state.current;
  var p = iso(obj.x, obj.y);
  ctx.save();
  ctx.globalAlpha = 0.55;
  ctx.strokeStyle = obj.type === "clear_blockade" ? "#e08a4a" : "#8fd0a4";
  ctx.lineWidth = 2;
  ctx.setLineDash([7, 5]);
  ctx.beginPath();
  ctx.ellipse(p[0], p[1], 46, 22, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.globalAlpha = 0.92;
  ctx.fillStyle = "#f2f6ea";
  ctx.font = "900 10px system-ui";
  ctx.textAlign = "center";
  ctx.fillText(obj.label, p[0], p[1] - 28);
  ctx.restore();
}
