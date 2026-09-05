import {
  createBandits,
  updateBandits as updateBanditsCore,
} from "./enemyCore.js?v=20260905-60";
import { drawSoldier } from "./soldierAssets.js?v=20260905-60";
export { createBandits };
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
  enemies.forEach(function (e) {
    if (e.dead) return;
    e.calloutTimer = Math.max(0, (e.calloutTimer || 0) - dt);
    e.flavorClock = (e.flavorClock || 0.7 + Math.random() * 2.5) - dt;
    e.lastFlavorState = e.lastFlavorState || "";
    if (e.hit > 0) enemySay(e, "hurt", 0.18);
    if (e.combatState !== e.lastFlavorState) {
      if (e.combatState === "seeking") enemySay(e, "move", 0.16);
      else if (e.combatState === "covered") enemySay(e, "cover", 0.1);
      else if (e.combatState === "exposed") enemySay(e, "fire", 0.17);
      e.lastFlavorState = e.combatState;
    }
    if (e.flavorClock <= 0) {
      e.flavorClock = 4.5 + Math.random() * 7;
      enemySay(e, e.exposed ? "aggressive" : "contact", 0.24);
    }
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
      e.type === "heavy"
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
  drawSoldier(ctx, e, {
    x: 0,
    y: 0,
    team: "enemy",
    scale: 0.3,
    alpha: e.dead ? 0.94 : 1,
  });
  drawBubble(ctx, e);
  ctx.restore();
}
