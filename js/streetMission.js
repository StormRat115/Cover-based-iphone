export const STREET_OBJECTIVE = {
  x: 0,
  y: -5700,
  radius: 265,
  captureDuration: 30,
};

export function createStreetMission() {
  return {
    objective: Object.assign({}, STREET_OBJECTIVE),
    captureProgress: 0,
    captured: false,
    capturing: false,
    justCaptured: false,
  };
}

function active(actor) {
  return !!actor && !actor.dead && !actor.downed && actor.hp > 0;
}

export function updateStreetMission(mission, dt, player, squad) {
  mission.justCaptured = false;
  if (mission.captured) {
    mission.capturing = false;
    return;
  }
  const objective = mission.objective;
  const occupants = [player].concat(squad || []).filter(active);
  mission.capturing = occupants.some(function (actor) {
    return Math.hypot(actor.x - objective.x, actor.y - objective.y) <= objective.radius;
  });
  if (!mission.capturing) {
    mission.captureProgress = 0;
    return;
  }
  mission.captureProgress = Math.min(
    objective.captureDuration,
    mission.captureProgress + dt,
  );
  if (mission.captureProgress >= objective.captureDuration) {
    mission.captured = true;
    mission.capturing = false;
    mission.justCaptured = true;
  }
}

export function captureSecondsRemaining(mission) {
  return Math.max(
    0,
    mission.objective.captureDuration - mission.captureProgress,
  );
}
