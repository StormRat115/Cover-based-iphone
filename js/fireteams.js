/* Bounding-overwatch fireteams: one element peeks, the other leapfrogs. */

export const FIRETEAM = {
  holdMin: 0.58,
  holdMax: 1.12,
  boundMax: 1.28,
  hopMin: 88,
  hopMax: 500,
  boundSpeed: 1.2,
  plantSlack: 22,
};

function living(actor) {
  return !!(actor && !actor.dead && !actor.downed && actor.hp > 0);
}

function makeTeam(id, members) {
  var team = {
    id: id,
    members: members,
    phase: "hold",
    boundId: null,
    timer: 0.28 + Math.random() * 0.5,
  };
  members.forEach(function (m, i) {
    if (!m) return;
    m.fireteamId = id;
    m.fireteamIndex = i;
    m.fireteamBound = false;
    m.fireteamOverwatch = true;
    m.boundTimer = 0;
  });
  return team;
}

function isKnight(actor) {
  return !!(
    actor &&
    (actor.role === "knight" || actor.meleePrefer || actor.name === "Leo")
  );
}

export function tagSquadFireteams(squad) {
  var teams = [];
  if (!squad || !squad.length) return teams;
  var rest = squad;
  if (
    squad.length >= 2 &&
    !isKnight(squad[0]) &&
    !isKnight(squad[1])
  ) {
    teams.push(makeTeam("squad-alpha", [squad[0], squad[1]]));
    rest = squad.slice(2);
  }
  var pending = [];
  rest.forEach(function (m, i) {
    if (isKnight(m)) {
      if (pending.length) {
        teams.push(makeTeam("squad-" + teams.length, pending));
        pending = [];
      }
      teams.push(makeTeam("squad-knight-" + (m.name || i), [m]));
    } else pending.push(m);
  });
  if (pending.length) teams.push(makeTeam("squad-" + teams.length, pending));
  return teams;
}

export function tagMarineFireteams(marines) {
  var teams = [];
  if (!marines || !marines.length) return teams;
  for (var i = 0; i < marines.length; i += 2) {
    teams.push(makeTeam("marine-" + i, marines.slice(i, i + 2)));
  }
  return teams;
}

export function assignFireteams(squad, marines) {
  var teams = tagSquadFireteams(squad).concat(tagMarineFireteams(marines));
  if (typeof window !== "undefined") window.__fireteams = teams;
  return teams;
}

function liveMembers(team) {
  return (team.members || []).filter(living);
}

function rearOf(members) {
  var rear = members[0];
  for (var i = 1; i < members.length; i++) {
    if (members[i].y > rear.y) rear = members[i];
  }
  return rear;
}

function planted(actor) {
  if (!actor || !actor.cover) return false;
  if (!Number.isFinite(actor.coverAnchorX)) return false;
  return (
    Math.hypot(actor.x - actor.coverAnchorX, actor.y - actor.coverAnchorY) <=
    FIRETEAM.plantSlack
  );
}

function clearFlags(members) {
  members.forEach(function (m) {
    m.fireteamBound = false;
    m.fireteamOverwatch = true;
  });
}

function beginBound(team, actor) {
  team.phase = "bound";
  team.boundId = actor.name || actor.fireteamId + "-" + actor.fireteamIndex;
  team.timer = FIRETEAM.boundMax;
  actor.fireteamBound = true;
  actor.fireteamOverwatch = false;
  actor.boundTimer = 0;
  actor.repositionCooldown = 0;
  liveMembers(team).forEach(function (m) {
    if (m === actor) return;
    m.fireteamBound = false;
    m.fireteamOverwatch = true;
  });
}

function beginHold(team, members) {
  team.phase = "hold";
  team.boundId = null;
  team.timer =
    FIRETEAM.holdMin + Math.random() * (FIRETEAM.holdMax - FIRETEAM.holdMin);
  clearFlags(members);
}

function boundActor(team, members) {
  var id = team.boundId;
  for (var i = 0; i < members.length; i++) {
    var m = members[i];
    var key = m.name || team.id + "-" + m.fireteamIndex;
    if (key === id) return m;
  }
  return null;
}

var lastTickAt = -1;

export function updateFireteams(squad, marines, dt) {
  var now =
    typeof performance !== "undefined" && performance.now
      ? performance.now()
      : null;
  if (now != null && lastTickAt >= 0 && now - lastTickAt < 12) {
    return (typeof window !== "undefined" && window.__fireteams) || [];
  }
  lastTickAt = now == null ? 0 : now;
  var roster = [].concat(squad || []).concat(marines || []);
  var stale = roster.some(function (u) {
    return living(u) && !u.fireteamId;
  });
  var teams =
    !stale && typeof window !== "undefined" && window.__fireteams
      ? window.__fireteams
      : assignFireteams(squad, marines);
  teams.forEach(function (team) {
    var members = liveMembers(team);
    if (!members.length) return;
    if (members.length === 1) {
      members[0].fireteamBound = true;
      members[0].fireteamOverwatch = false;
      team.phase = "solo";
      return;
    }
    team.timer = Math.max(0, (team.timer || 0) - dt);
    if (team.phase === "bound") {
      var mover = boundActor(team, members);
      if (!mover) {
        beginHold(team, members);
        return;
      }
      mover.boundTimer = (mover.boundTimer || 0) + dt;
      mover.fireteamBound = true;
      mover.fireteamOverwatch = false;
      var overwatch = members.filter(function (m) {
        return m !== mover;
      })[0];
      var pastBuddy =
        overwatch && mover.y < overwatch.y - 36 && planted(mover);
      if (planted(mover) && (pastBuddy || mover.boundTimer > 0.55)) {
        beginHold(team, members);
        return;
      }
      if (mover.boundTimer >= FIRETEAM.boundMax || team.timer <= 0) {
        beginHold(team, members);
      }
      return;
    }
    clearFlags(members);
    if (team.timer <= 0) beginBound(team, rearOf(members));
  });
  return teams;
}

export function isFireteamOverwatch(actor) {
  return !!(actor && actor.fireteamOverwatch && !actor.fireteamBound);
}

export function isFireteamBounding(actor) {
  return !!(actor && actor.fireteamBound);
}

export function boundSpeedScale(actor) {
  return isFireteamBounding(actor) ? FIRETEAM.boundSpeed : 1;
}

export function hopCoversAhead(actor, covers) {
  if (!actor || !covers) return covers || [];
  var ahead = covers.filter(function (c) {
    if (!c || c.destroyed) return false;
    var dy = actor.y - c.y;
    var travel = Math.hypot(c.x - actor.x, c.y - actor.y);
    return dy >= FIRETEAM.hopMin * 0.55 && travel >= FIRETEAM.hopMin && travel <= FIRETEAM.hopMax;
  });
  return ahead.length ? ahead : covers;
}
