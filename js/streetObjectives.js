import { makeShapedCover } from "./cityMap.js?v=20260908-130";
import { prepareCoverHp } from "./destructibleCover.js?v=20260908-130";
import {
  beginStreetBreath,
  isStreetBreathing,
  streetBreathRemaining,
} from "./streetBeat.js?v=20260908-130";

export const OBJECTIVE_TYPES = [
  "hold_crosswalk",
  "clear_blockade",
  "escort_segment",
  "clear_doorway",
];

export const OBJECTIVE_DEFS = {
  hold_crosswalk: {
    label: "HOLD THE CROSSWALK",
    hint: "Stand in the paint until the clock hits zero",
    color: "#8fd0a4",
    radius: 175,
  },
  clear_blockade: {
    label: "CLEAR THE WRECK",
    hint: "Shoot the wrecks until they break",
    color: "#e08a4a",
    radius: 190,
  },
  escort_segment: {
    label: "ESCORT THE STRETCH",
    hint: "Stay with the marker while it walks the block",
    color: "#8fb7c8",
    radius: 210,
  },
  clear_doorway: {
    label: "CLEAR THE DOOR NEST",
    hint: "Wipe the hostiles stacked in the doorway",
    color: "#d86a5a",
    radius: 200,
  },
};

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

function defFor(type) {
  return OBJECTIVE_DEFS[type] || OBJECTIVE_DEFS.hold_crosswalk;
}

export function createStreetObjectives() {
  return {
    cooldown: 5.5,
    current: null,
    completed: 0,
    nextIndex: 0,
    breath: null,
    resumeForward: false,
  };
}

export function resetStreetObjectives(state) {
  if (!state) return createStreetObjectives();
  state.cooldown = 5.5;
  state.current = null;
  state.completed = 0;
  state.nextIndex = 0;
  state.breath = null;
  state.resumeForward = false;
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

function spawnDoorNest(obj, opts) {
  var random = opts.random || Math.random;
  var n = 3 + (random() > 0.55 ? 1 : 0);
  var nest = [];
  for (var i = 0; i < n; i++) {
    var hx = obj.x + (i - (n - 1) / 2) * 38;
    var hy = obj.y - 26;
    var hostile = opts.createHostile
      ? opts.createHostile(hx, hy, i, obj)
      : {
          x: hx,
          y: hy,
          hp: 45,
          maxHp: 45,
          dead: false,
          downed: false,
          type: "rifleman",
        };
    if (!hostile) continue;
    hostile.nestId = obj.id;
    nest.push(hostile);
    if (opts.enemies) opts.enemies.push(hostile);
  }
  obj.nest = nest;
  return nest;
}

function nestAlive(obj) {
  return (obj.nest || []).filter(function (e) {
    return e && !e.dead && e.hp > 0;
  }).length;
}

export function spawnStreetObjective(state, opts) {
  opts = opts || {};
  var random = opts.random || Math.random;
  var type = opts.type || nextType(state, random);
  if (!OBJECTIVE_DEFS[type]) type = "hold_crosswalk";
  var def = defFor(type);
  var actors = opts.actors || [];
  var y = clamp(frontY(actors, 80) - (420 + random() * 260), -5200, 400);
  var side = random() > 0.5 ? 1 : -1;
  var x =
    type === "clear_doorway"
      ? clamp(side * (210 + random() * 40), -260, 260)
      : clamp((random() - 0.5) * 220, -260, 260);
  var obj = {
    id: "obj-" + (state.completed + 1),
    type: type,
    x: x,
    y: y,
    radius: def.radius,
    holdNeed: type === "hold_crosswalk" ? 7.5 : 0,
    hold: 0,
    destY: y - 380,
    speed: 46,
    label: def.label,
    hint: def.hint,
    wrecks: [],
    nest: [],
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
  if (type === "clear_doorway") spawnDoorNest(obj, opts);
  state.current = obj;
  state.resumeForward = false;
  state.cooldown = 22 + random() * 12;
  return obj;
}

export function defaultForwardGoal(mission) {
  if (mission && mission.objective) {
    return {
      x: mission.objective.x,
      y: mission.objective.y,
      radius: mission.objective.radius,
      source: "fort",
      id: "fort",
      label: "CAPTURE THE FORT",
    };
  }
  return null;
}

export function currentPushGoal(mission, streetState) {
  var obj = streetState && streetState.current;
  if (obj && !obj.done) {
    return {
      x: obj.x,
      y: obj.y,
      radius: obj.radius,
      source: "street",
      type: obj.type,
      id: obj.id,
      label: obj.label,
    };
  }
  return defaultForwardGoal(mission);
}

export function pushGoalKey(goal) {
  if (!goal) return "";
  return (
    (goal.source || "") +
    ":" +
    (goal.id || "") +
    ":" +
    Math.round(goal.x) +
    ":" +
    Math.round(goal.y)
  );
}

export function releaseStreetObjectiveHold(actors) {
  if (typeof window !== "undefined" && window.__streetObjectives)
    window.__streetObjectives.breath = null;
  (actors || []).forEach(function (a) {
    if (!a || a.dead) return;
    a.missionPause = 0;
    a.objectiveAdvancePaused = false;
    a.repositionCooldown = 0;
    a.objectiveHold = false;
    a.lastPushGoalKey = "";
    var parked =
      Math.hypot(
        (a.targetX == null ? a.x : a.targetX) - a.x,
        (a.targetY == null ? a.y : a.targetY) - a.y,
      ) < 14;
    if (parked || a.combatState === "covered") {
      a.combatState = "seeking";
      a.exposed = true;
    }
  });
}

function completeStreetObjective(state, obj, opts) {
  obj.done = true;
  state.completed++;
  state.current = null;
  state.resumeForward = true;
  state.cooldown = 22 + Math.random() * 12;
  var breath = beginStreetBreath(state, obj, opts && opts.random);
  return { justCompleted: obj, current: null, breath: breath };
}

export function updateStreetObjectives(state, dt, opts) {
  opts = opts || {};
  if (!state) return null;
  var actors = []
    .concat(opts.player ? [opts.player] : [])
    .concat(opts.squad || [])
    .concat(opts.marines || []);
  if (!state.current) {
    if (isStreetBreathing(state)) return null;
    state.cooldown = Math.max(0, (state.cooldown || 0) - dt);
    if (state.cooldown <= 0)
      spawnStreetObjective(state, {
        actors: actors,
        covers: opts.covers,
        enemies: opts.enemies,
        createHostile: opts.createHostile,
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
    if (obj.hold >= obj.holdNeed) return completeStreetObjective(state, obj, opts);
  } else if (obj.type === "clear_blockade") {
    var left = obj.wrecks.filter(function (w) {
      return w && !w.destroyed;
    }).length;
    if (left <= 0) return completeStreetObjective(state, obj, opts);
  } else if (obj.type === "escort_segment") {
    if (inside.length) {
      obj.y = Math.max(obj.destY, obj.y - obj.speed * dt);
    }
    if (obj.y <= obj.destY + 8 && inside.length)
      return completeStreetObjective(state, obj, opts);
  } else if (obj.type === "clear_doorway") {
    if (nestAlive(obj) <= 0) return completeStreetObjective(state, obj, opts);
  }
  obj.marinesPresent = marinesHere;
  obj.occupants = inside.length;
  obj.progressLine = objectiveProgress(obj);
  return obj;
}

function wrecksLeft(obj) {
  return (obj.wrecks || []).filter(function (w) {
    return w && !w.destroyed;
  }).length;
}

function objectiveProgress(obj) {
  if (!obj) return "";
  if (obj.type === "hold_crosswalk") {
    return (
      Math.max(0, obj.holdNeed - obj.hold).toFixed(1) +
      "s LEFT  •  " +
      (obj.occupants || 0) +
      " IN ZONE"
    );
  }
  if (obj.type === "clear_blockade") {
    return wrecksLeft(obj) + " WRECKS LEFT";
  }
  if (obj.type === "escort_segment") {
    var meters = Math.max(0, Math.round((obj.y - obj.destY) / 10));
    return meters + "m LEFT  •  STAY WITH THE MARKER";
  }
  if (obj.type === "clear_doorway") {
    return nestAlive(obj) + " HOSTILES LEFT";
  }
  return obj.hint || "";
}

export function objectiveStatusLine(state) {
  if (isStreetBreathing(state)) {
    return (
      "MAG CHECK  •  " + streetBreathRemaining(state).toFixed(1) + "s"
    );
  }
  if (!state || !state.current) {
    return state && state.completed
      ? "PUSH FORWARD  •  CAPTURE THE FORT"
      : "PUSH FORWARD  •  CAPTURE THE FORT";
  }
  var obj = state.current;
  return obj.label + "  •  " + objectiveProgress(obj);
}

export function objectiveTitle(state, mission) {
  if (isStreetBreathing(state)) return "MAG CHECK";
  if (state && state.current) return state.current.label;
  if (mission && mission.captured) return "FORTIFICATION SECURED";
  return "CAPTURE THE FORT";
}

export function drawStreetTask(ctx, iso, state) {
  if (!state || !state.current) return;
  var obj = state.current;
  var def = defFor(obj.type);
  var p = iso(obj.x, obj.y);
  ctx.save();
  ctx.globalAlpha = 0.55;
  ctx.strokeStyle = def.color || "#8fd0a4";
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
  ctx.font = "800 8px system-ui";
  ctx.fillStyle = "#c9d6c8";
  ctx.fillText(objectiveProgress(obj), p[0], p[1] - 16);
  ctx.restore();
}
