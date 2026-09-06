import { isLineBlocked } from "./cover.js?v=20260906-92";
import { drawSoldier } from "./soldierAssets.js?v=20260906-92";
import { mitigateDamage } from "./combatStats.js?v=20260906-92";

export function createSupportVehicle(objective) {
  const vehicle = {
    name: "FORT GUARD",
    x: objective.x + 125,
    y: objective.y + 155,
    hp: 200,
    maxHp: 200,
    defense: 20,
    dead: false,
    downed: false,
    permanentDeath: true,
    exposed: true,
    hit: 0,
    muzzle: 0,
    facingX: 1,
    facingY: 0,
    target: null,
    fireCooldown: 0.2,
    weapon: {
      name: "SUPPORT TURRET",
      damage: 3,
      range: 2700,
      cooldown: 0.075,
    },
    isSupportVehicle: true,
  };
  vehicle.gunner = {
    x: vehicle.x,
    y: vehicle.y,
    hp: 100,
    maxHp: 100,
    dead: false,
    downed: false,
    exposed: true,
    facingX: 1,
    facingY: 0,
    state: "shoot",
    muzzle: 0,
    hit: 0,
    weapon: { role: "assault" },
  };
  return vehicle;
}

function nearestTarget(vehicle, enemies) {
  let best = null;
  let bestDistance = vehicle.weapon.range;
  for (const enemy of enemies) {
    if (enemy.dead || enemy.downed || enemy.hp <= 0) continue;
    const distance = Math.hypot(enemy.x - vehicle.x, enemy.y - vehicle.y);
    if (distance < bestDistance) {
      bestDistance = distance;
      best = enemy;
    }
  }
  return best;
}

export function updateSupportVehicle(
  vehicle,
  dt,
  enemies,
  covers,
  spawnProjectile,
) {
  if (!vehicle) return;
  vehicle.hit = Math.max(0, vehicle.hit - dt);
  vehicle.muzzle = Math.max(0, vehicle.muzzle - dt);
  if (vehicle.hp <= 0) {
    vehicle.hp = 0;
    vehicle.dead = true;
  }
  if (vehicle.dead) return;
  vehicle.fireCooldown = Math.max(0, vehicle.fireCooldown - dt);
  if (
    !vehicle.target ||
    vehicle.target.dead ||
    vehicle.target.hp <= 0 ||
    Math.hypot(vehicle.target.x - vehicle.x, vehicle.target.y - vehicle.y) >
      vehicle.weapon.range
  )
    vehicle.target = nearestTarget(vehicle, enemies);
  const target = vehicle.target;
  if (!target) return;
  const dx = target.x - vehicle.x;
  const dy = target.y - vehicle.y;
  const distance = Math.hypot(dx, dy) || 1;
  vehicle.facingX = dx / distance;
  vehicle.facingY = dy / distance;
  Object.assign(vehicle.gunner, {
    facingX: vehicle.facingX,
    facingY: vehicle.facingY,
    muzzle: vehicle.muzzle,
  });
  if (vehicle.fireCooldown > 0 || isLineBlocked(vehicle, target, covers)) return;
  vehicle.fireCooldown = vehicle.weapon.cooldown;
  vehicle.muzzle = 0.09;
  vehicle.gunner.muzzle = 0.09;
  const hit = Math.random() < 0.72;
  if (spawnProjectile) spawnProjectile(vehicle, target, "ally", hit ? 1 : 0);
  if (!hit) return;
  const dealt = mitigateDamage(vehicle.weapon.damage, target.defense);
  target.hp = Math.max(0, target.hp - dealt);
  target.lastDamageTaken = dealt;
  target.hit = 0.12;
  if (target.hp <= 0) {
    target.dead = true;
    target.deathTimer = 0;
  }
}

export function drawSupportVehicle(ctx, vehicle, iso) {
  const point = iso(vehicle.x, vehicle.y);
  ctx.save();
  ctx.translate(point[0], point[1]);
  ctx.globalAlpha = vehicle.dead ? 0.62 : 1;
  ctx.fillStyle = "#172019";
  ctx.fillRect(-31, -10, 62, 22);
  ctx.fillStyle = vehicle.dead ? "#3d463d" : "#3f6c42";
  ctx.strokeStyle = "#a4bf7a";
  ctx.lineWidth = 2;
  ctx.fillRect(-28, -18, 56, 24);
  ctx.strokeRect(-28, -18, 56, 24);
  ctx.fillStyle = "#1a211b";
  ctx.fillRect(-24, 6, 14, 6);
  ctx.fillRect(10, 6, 14, 6);
  if (!vehicle.dead) {
    drawSoldier(ctx, vehicle.gunner, {
      team: "player",
      scale: 0.22,
      x: 0,
      y: -18,
    });
    ctx.strokeStyle = "#202820";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(0, -18);
    ctx.lineTo(vehicle.facingX * 25, -18 + vehicle.facingY * 12);
    ctx.stroke();
  }
  ctx.fillStyle = "#111";
  ctx.fillRect(-28, -43, 56, 4);
  ctx.fillStyle = "#83bd63";
  ctx.fillRect(-28, -43, 56 * Math.max(0, vehicle.hp / vehicle.maxHp), 4);
  ctx.fillStyle = vehicle.dead ? "#a09f96" : "#d6efbd";
  ctx.font = "900 8px system-ui";
  ctx.textAlign = "center";
  ctx.fillText(vehicle.dead ? "VEHICLE LOST" : "FORT GUARD", 0, -48);
  ctx.restore();
}
