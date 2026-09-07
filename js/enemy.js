import {
  createBandits,
  createSurroundSpawnPoints,
  updateBandits as updateBanditsCore,
} from "./enemyCore.js?v=20260907-117";
import {
  drawEnemyMonster,
  drawSoldier,
} from "./soldierAssets.js?v=20260907-117";
import { updateChargers, drawCharger } from "./chargerEnemy.js?v=20260907-117";
export { createBandits, createSurroundSpawnPoints };
var ENEMY_LINES = {
  contact: ["CONTACT!", "THERE!", "I SEE THEM!", "MOVE! MOVE!"],
  fire: ["OPEN FIRE!", "KEEP FIRING!", "LIGHT THEM UP!", "PUT ROUNDS ON THEM!"],
  cover: ["HOLD THIS POSITION!", "STAY LOW!", "WATCH THE FLANK!", "COVERING!"],
  move: ["MOVING!", "PUSH UP!", "GO! GO!", "FLANK THEM!"],
  hurt: ["I'M HIT!", "TAKING FIRE!", "GET ME COVER!", "I'M PINNED!"],
  aggressive: ["RUSH THEM!", "KEEP PRESSURE!", "DON'T LET UP!", "ADVANCE!"],
};
function pick(list) {
  return list[Math.floor(Math.random() * list.length)];
}
function enemySay(e, key, chance) {
  if (e.calloutTimer > 0 || Math.random() > chance) return;
  e.callout = pick(ENEMY_LINES[key]);
  e.calloutTimer = 1.15 + Math.random() * 0.55;
}
export function updateBandits(enemies, dt, player, covers, spawnProjectile) {
  updateBanditsCore(enemies, dt, player, covers, spawnProjectile);
  updateChargers(enemies, dt, player, covers, spawnProjectile);
  enemies.forEach(function (e) {
    if (e.dead) return;
    e.calloutTimer = Math.max(0, (e.calloutTimer || 0) - dt);
  });
}
function drawBubble(ctx, e) {
  if (!e.calloutTimer || e.calloutTimer <= 0 || e.dead) return;
  var text = e.callout || "",
    bw = Math.min(150, Math.max(62, text.length * 5.7 + 18)),
    by = -70;
  ctx.save();
  ctx.font = "900 8px system-ui";
  ctx.fillStyle = "#2a1715e8";
  ctx.strokeStyle = "#e86b5b88";
  ctx.lineWidth = 1;
  ctx.beginPath();
  if (ctx.roundRect) ctx.roundRect(-bw / 2, by - 18, bw, 20, 5);
  else ctx.rect(-bw / 2, by - 18, bw, 20);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "#ffd8d2";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, 0, by - 8);
  ctx.restore();
}
export function drawSniperLasers(ctx, enemies, iso, now) {
  var drawn = 0,
    pulse = 0.72 + Math.sin((now || 0) * 0.012) * 0.18;
  enemies.forEach(function (enemy) {
    var target = enemy.combatTarget;
    if (
      enemy.type !== "sniper" ||
      enemy.dead ||
      enemy.downed ||
      enemy.spawnTimer > 0 ||
      enemy.weapon.reloading ||
      !enemy.exposed ||
      !target ||
      target.dead ||
      target.downed ||
      target.hp <= 0
    )
      return;
    var from = iso(enemy.x, enemy.y),
      to = iso(target.x, target.y);
    ctx.save();
    ctx.globalAlpha = pulse;
    ctx.strokeStyle = "#ff1f2f55";
    ctx.lineWidth = 3;
    ctx.shadowColor = "#ff1028";
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.moveTo(from[0], from[1] - 24);
    ctx.lineTo(to[0], to[1] - 19);
    ctx.stroke();
    ctx.globalAlpha = 0.92;
    ctx.strokeStyle = "#ff3948";
    ctx.lineWidth = 0.9;
    ctx.shadowBlur = 3;
    ctx.stroke();
    ctx.fillStyle = "#ff2638";
    ctx.beginPath();
    ctx.arc(to[0], to[1] - 19, 2.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    drawn++;
  });
  return drawn;
}
export function drawBandit(ctx, e, iso, selected) {
  var p = iso(e.x, e.y),
    x = p[0],
    y = p[1],
    s = e.scale || 1;
  ctx.save();
  ctx.translate(x, y);
  if (selected && !e.dead) {
    ctx.strokeStyle = "#f5d547";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(0, -20, 13 * s, 0, Math.PI * 2);
    ctx.stroke();
  }
  if (!e.dead) {
    ctx.fillStyle = "#111";
    ctx.fillRect(-13 * s, -45 * s, 26 * s, 3);
    ctx.fillStyle =
      e.type === "charger"
        ? "#e07a32"
        : e.type === "heavy"
          ? "#d88c3f"
          : e.type === "shotgunner"
            ? "#b75bd1"
            : e.type === "sniper"
              ? "#79a8d8"
              : e.type === "marksman"
                ? "#d6b84f"
                : e.type === "smg"
                  ? "#61a86b"
                  : e.type === "pistol"
                    ? "#a9a9a9"
                    : "#d84b4b";
    ctx.fillRect(-13 * s, -45 * s, 26 * s * Math.max(0, e.hp / e.maxHp), 3);
  }
  if (e.hit > 0 && !e.dead) {
    ctx.globalAlpha = 0.45;
    ctx.fillStyle = "#fff";
    ctx.beginPath();
    ctx.arc(0, -20, 14 * s, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }
  const spriteOptions = {
    x: 0,
    y: 0,
    team: "enemy",
    scale: 0.3,
    alpha: e.dead ? 0.94 : 1,
  };
  if (e.type === "charger") {
    if (!drawCharger(ctx, e, spriteOptions)) drawSoldier(ctx, e, spriteOptions);
  } else if (!drawEnemyMonster(ctx, e, spriteOptions))
    drawSoldier(ctx, e, spriteOptions);
  drawBubble(ctx, e);
  ctx.restore();
}
