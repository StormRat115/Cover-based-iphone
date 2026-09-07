// Auto Play camera: PLAYER CAM vs FRONT-LINE CAM.
// Street "forward" is decreasing Y toward the fort (objective y ≈ -5700).

export var CAM_PLAYER = "player";
export var CAM_FRONT_LINE = "frontLine";
export var CAMERA_EASE = 0.09;
// Keep the same edge protection after the 2x field-of-view increase.
export var CAMERA_PAD_X = 860;
export var CAMERA_PAD_Y = 660;
var CLUSTER_DEPTH = 480;
var FIGHT_RANGE = 880;

export function livingUnit(actor) {
  return !!(
    actor &&
    !actor.dead &&
    !actor.downed &&
    actor.hp > 0 &&
    !(actor.spawnTimer > 0) &&
    !actor.pendingSegment
  );
}

export function livingFriendlies(player, allies, marines) {
  return [player]
    .concat(allies || [])
    .concat(marines || [])
    .filter(livingUnit);
}

export function camModeLabel(frontLine) {
  return frontLine ? "FRONT-LINE" : "PLAYER CAM";
}

export function frontLineFocus(player, allies, marines, enemies) {
  var friendlies = livingFriendlies(player, allies, marines);
  if (!friendlies.length) {
    return player ? { x: player.x, y: player.y } : { x: 0, y: 0 };
  }
  var leadY = friendlies[0].y,
    i;
  for (i = 1; i < friendlies.length; i++) {
    if (friendlies[i].y < leadY) leadY = friendlies[i].y;
  }
  var cluster = [];
  for (i = 0; i < friendlies.length; i++) {
    if (friendlies[i].y <= leadY + CLUSTER_DEPTH) cluster.push(friendlies[i]);
  }
  var hostiles = (enemies || []).filter(livingUnit);
  var fighting = [];
  if (hostiles.length) {
    for (i = 0; i < cluster.length; i++) {
      var unit = cluster[i],
        j,
        engaged = false;
      for (j = 0; j < hostiles.length; j++) {
        if (
          Math.hypot(hostiles[j].x - unit.x, hostiles[j].y - unit.y) <=
          FIGHT_RANGE
        ) {
          engaged = true;
          break;
        }
      }
      if (engaged) fighting.push(unit);
    }
  }
  var focus = fighting.length ? fighting : cluster;
  var sx = 0,
    sy = 0,
    weight = 0;
  for (i = 0; i < focus.length; i++) {
    var member = focus[i],
      wt = 1.15 + Math.max(0, (leadY + 520 - member.y) / 520);
    sx += member.x * wt;
    sy += member.y * wt;
    weight += wt;
  }
  return { x: sx / weight, y: sy / weight };
}

export function clampCameraTarget(world, targetX, targetY) {
  return {
    x: Math.max(
      world.minX + CAMERA_PAD_X,
      Math.min(world.maxX - CAMERA_PAD_X, targetX),
    ),
    y: Math.max(
      world.minY + CAMERA_PAD_Y,
      Math.min(world.maxY - CAMERA_PAD_Y, targetY),
    ),
  };
}

export function easeCameraToward(world, targetX, targetY, ease) {
  var goal = clampCameraTarget(world, targetX, targetY),
    k = ease == null ? CAMERA_EASE : ease;
  world.cameraX += (goal.x - world.cameraX) * k;
  world.cameraY += (goal.y - world.cameraY) * k;
  return world;
}

export function cameraLookAt(world, player, allies, marines, enemies, frontLine) {
  if (frontLine) return frontLineFocus(player, allies, marines, enemies);
  return { x: player.x, y: player.y };
}
