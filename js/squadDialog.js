var GLOBAL_GAP = 2.6;
var SPEAKER_GAP = 7.5;
var MAX_LIVE = 2;

var LINES = {
  contact: [
    "Contact front. Hostiles in the lane.",
    "Eyes up. Monsters on the street.",
    "I have movement. Call it.",
    "There they are. Hold the line.",
  ],
  callout: [
    "Left curb is hot.",
    "Watch the rubble line.",
    "They're pushing the center.",
    "Flank right is open.",
    "Keep off the middle of the road.",
  ],
  strategy: [
    "Hold cover. Don't bunch up.",
    "I'll pin them. Bound forward.",
    "Two on the left, one in the open.",
    "Stay staggered. Watch sectors.",
    "Let them come to the barriers.",
  ],
  squad: [
    "I have you, keep moving.",
    "Set. Covering your bound.",
    "Reloading — hold them.",
    "On your six. Stay tight.",
  ],
  taunt: [
    "Come on, you animals.",
    "That's as far as you get.",
    "Burn in the street.",
    "Keep coming. We have ammo.",
  ],
  marine: [
    "Marine team holding this block.",
    "Pushing the next piece of cover.",
    "Don't let them past the curb.",
    "Horde incoming. Stand fast.",
  ],
  danger: [
    "Taking fire. Stay down.",
    "Man's in the open — get him back.",
    "Rounds inbound. Tuck in.",
  ],
  push: [
    "Push left — I'll pin them.",
    "Bound left. I have the street.",
    "Flank left, I have you.",
    "Sweep the left curb. Move.",
  ],
  hold: [
    "Hold this piece.",
    "Stay on the bags. Don't give it up.",
    "Hold. I'll cover the lane.",
    "Keep this cover. Nobody folds.",
  ],
  focus: [
    "Focus fire, drop that one.",
    "All guns on the heavy.",
    "Focus. Put him down.",
    "Same target. Break him.",
  ],
};

export var SQUAD_ORDERS = {
  push: { type: "push", duration: 5.2, speed: 1.14, flank: 1, acc: 3, defense: 0 },
  hold: { type: "hold", duration: 6, speed: 1, flank: 0, acc: 0, defense: 16 },
  focus: { type: "focus", duration: 4.8, speed: 1, flank: 0, acc: 8, defense: 0 },
};

function isSquadSpeaker(actor) {
  return !!(actor && !actor.isMarine && (actor.isPlayer || actor.name));
}

export function applyOrderBuff(actor, spec) {
  if (!actor || !spec) return;
  actor.orderType = spec.type;
  actor.orderTimer = spec.duration;
  actor.orderAcc = spec.acc || 0;
  actor.orderDefense = spec.defense || 0;
  actor.orderSpeed = spec.speed || 1;
  actor.orderFlank = spec.flank || 0;
}

export function applySquadOrder(type, speaker, squad, player) {
  var spec = SQUAD_ORDERS[type];
  if (!spec || !isSquadSpeaker(speaker)) return false;
  var units = (squad || []).concat(player ? [player] : []);
  units.forEach(function (a) {
    if (!living(a) || a.isMarine) return;
    applyOrderBuff(a, spec);
  });
  return true;
}

export function tickOrderBuffs(units, dt) {
  (units || []).forEach(function (a) {
    if (!a) return;
    a.orderTimer = Math.max(0, (a.orderTimer || 0) - dt);
    if (a.orderTimer <= 0) {
      a.orderAcc = 0;
      a.orderDefense = 0;
      a.orderSpeed = 1;
      a.orderFlank = 0;
      a.orderType = "";
    }
  });
}

export function orderAccuracy(actor) {
  return (actor && actor.orderTimer > 0 && actor.orderAcc) || 0;
}

export function orderDefense(actor) {
  if (!actor || (actor.orderTimer || 0) <= 0) return 0;
  if (actor.orderType === "hold" && !actor.cover) return 0;
  return actor.orderDefense || 0;
}

export function orderSpeedScale(actor) {
  if (!actor || (actor.orderTimer || 0) <= 0) return 1;
  return actor.orderSpeed || 1;
}

function pick(list) {
  return list[Math.floor(Math.random() * list.length)];
}

function living(actor) {
  return !!(actor && !actor.dead && !actor.downed && actor.hp > 0);
}

function roster() {
  if (typeof window === "undefined") return [];
  var list = [];
  if (window.__battlePlayer) list.push(window.__battlePlayer);
  (window.__battleAllies || []).forEach(function (a) {
    list.push(a);
  });
  (window.__battleMarines || []).forEach(function (m) {
    list.push(m);
  });
  return list;
}

var state = {
  cooldown: 1.4,
  lastSpeaker: null,
};

export function resetSquadDialog() {
  state.cooldown = 0;
  state.lastSpeaker = null;
}

export function liveDialogCount(units) {
  var n = 0;
  (units || roster()).forEach(function (a) {
    if (living(a) && (a.calloutTimer || 0) > 0) n++;
  });
  return n;
}

export function canSpeak(actor, nowRoster) {
  if (!living(actor)) return false;
  if ((actor.calloutTimer || 0) > 0) return false;
  if ((actor.dialogLock || 0) > 0) return false;
  if (state.cooldown > 0) return false;
  if (liveDialogCount(nowRoster) >= MAX_LIVE) return false;
  return true;
}

export function speak(actor, line, duration) {
  if (!actor || !line) return false;
  if (!canSpeak(actor)) return false;
  actor.callout = line;
  actor.calloutTimer = duration || 2.15;
  actor.dialogLock = SPEAKER_GAP;
  state.cooldown = GLOBAL_GAP;
  state.lastSpeaker = actor;
  return true;
}

export function speakFrom(actor, key, duration) {
  var bank = LINES[key] || LINES.callout;
  return speak(actor, pick(bank), duration);
}

function nearestHostile(actor, enemies) {
  var best = null,
    bestD = Infinity;
  (enemies || []).forEach(function (e) {
    if (!living(e) || (e.spawnTimer || 0) > 0) return;
    var d = Math.hypot(e.x - actor.x, e.y - actor.y);
    if (d < bestD) {
      bestD = d;
      best = e;
    }
  });
  return best ? { enemy: best, dist: bestD } : null;
}

export function updateSquadDialog(dt, player, allies, marines, enemies) {
  var units = [player].concat(allies || []).concat(marines || []);
  state.cooldown = Math.max(0, state.cooldown - dt);
  units.forEach(function (a) {
    if (!a) return;
    a.calloutTimer = Math.max(0, (a.calloutTimer || 0) - dt);
    a.dialogLock = Math.max(0, (a.dialogLock || 0) - dt);
    if ((a.calloutTimer || 0) <= 0) a.callout = "";
  });
  (enemies || []).forEach(function (e) {
    if (!e) return;
    e.calloutTimer = Math.max(0, (e.calloutTimer || 0) - dt);
  });
  tickOrderBuffs(units, dt);
  if (!canSpeak(player, units)) return null;
  var hostiles = (enemies || []).filter(function (e) {
    return living(e) && (e.spawnTimer || 0) <= 0;
  });
  var speakers = units.filter(living);
  if (!speakers.length) return null;
  var event = null;
  speakers.forEach(function (a) {
    if (event) return;
    if ((a.hit || 0) > 0 && Math.random() < 0.35) event = { actor: a, key: "danger" };
  });
  if (!event && hostiles.length && Math.random() < 0.55) {
    var scout = speakers[Math.floor(Math.random() * speakers.length)];
    var near = nearestHostile(scout, hostiles);
    if (near && near.dist < 920) {
      var roll = Math.random();
      event = {
        actor: scout,
        key:
          roll < 0.2
            ? "contact"
            : roll < 0.38
              ? "callout"
              : roll < 0.52
                ? "strategy"
                : roll < 0.64
                  ? scout.isMarine
                    ? "marine"
                    : "squad"
                  : roll < 0.76
                    ? "taunt"
                    : scout.isMarine
                      ? "marine"
                      : roll < 0.85
                        ? "push"
                        : roll < 0.93
                          ? "hold"
                          : "focus",
      };
    }
  } else if (!event && !hostiles.length && Math.random() < 0.2) {
    event = {
      actor: speakers[Math.floor(Math.random() * speakers.length)],
      key: speakers[0] && speakers[0].isMarine ? "marine" : "strategy",
    };
  }
  if (!event) return null;
  if (speakFrom(event.actor, event.key)) {
    if (
      !event.actor.isMarine &&
      (event.key === "push" || event.key === "hold" || event.key === "focus")
    ) {
      applySquadOrder(event.key, event.actor, allies, player);
    }
    return event;
  }
  return null;
}

export function drawDialogBubbles(ctx, iso, units) {
  units = units || roster();
  units.forEach(function (a) {
    if (!living(a) || (a.calloutTimer || 0) <= 0 || !a.callout) return;
    var p = iso(a.x, a.y),
      text = a.callout,
      fade = Math.min(1, a.calloutTimer / 0.2, (2.2 - Math.min(2.2, a.calloutTimer)) / 0.18 + 0.7);
    ctx.save();
    ctx.globalAlpha = Math.max(0.2, Math.min(1, fade));
    ctx.font = "800 11px system-ui";
    var measured = ctx.measureText ? ctx.measureText(text) : null,
      w = Math.min(
        220,
        Math.max(72, ((measured && measured.width) || text.length * 6.2) + 18),
      ),
      x = p[0],
      y = p[1] - 78;
    ctx.fillStyle = a.isMarine ? "#1b2418e8" : "#151b20ee";
    ctx.strokeStyle = a.isMarine ? "#b7d48a99" : "#d7e4c888";
    ctx.lineWidth = 1;
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(x - w / 2, y - 16, w, 22, 6);
    else ctx.rect(x - w / 2, y - 16, w, 22);
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x - 5, y + 6);
    ctx.lineTo(x, y + 13);
    ctx.lineTo(x + 5, y + 6);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "#f3f6ef";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(text, x, y - 5);
    ctx.restore();
  });
}
