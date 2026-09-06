import { createPlayer, drawPlayer } from './player.js';
import { createBandits, updateBandits, drawBandit } from './enemy.js';
import { createCover, findCoverForPoint, drawCover, isLineBlocked } from './cover.js';
import { initKeyboard, initJoystick, getMoveVector } from './input.js';
import { createDylan, updateDylan, drawDylan, resetDylan } from './ally.js';
import { loadAssets, images } from './assets.js';

const canvas = document.querySelector('#game');
const ctx = canvas.getContext('2d');
const status = document.querySelector('#status');
const hint = document.querySelector('#hint');
const fireButton = document.querySelector('#fire');
const reloadButton = document.querySelector('#reload');
const restartButton = document.querySelector('#restart');
const message = document.querySelector('#message');
const messageTitle = document.querySelector('#messageTitle');
const messageText = document.querySelector('#messageText');
const messageButton = document.querySelector('#messageButton');
const waveBanner = document.querySelector('#waveBanner');

let W = 0;
let H = 0;
let dpr = 1;
let last = 0;
let gameOver = false;
let won = false;
let target = null;
let kills = 0;
let wave = 1;
let waveBannerTimer = 0;
let firing = false;
const deadSeen = new Set();

const world = { scaleX: 0.72, scaleY: 0.38, offsetY: -40 };
const player = createPlayer();
const dylan = createDylan();
const covers = createCover();
let enemies = createBandits(1);

const buildings = [
  { x: -430, y: -260, kind: 'ruinA', s: 1.12 },
  { x: -210, y: -340, kind: 'ruinB', s: 1.0 },
  { x: 40, y: -360, kind: 'ruinA', s: 0.95 },
  { x: 280, y: -300, kind: 'ruinB', s: 1.18 },
  { x: 430, y: -120, kind: 'ruinA', s: 1.05 },
  { x: 440, y: 80, kind: 'ruinB', s: 0.92 },
  { x: 380, y: 250, kind: 'ruinA', s: 0.88 },
  { x: 80, y: 320, kind: 'ruinB', s: 0.9 },
  { x: -180, y: 330, kind: 'ruinA', s: 0.86 },
  { x: -420, y: 160, kind: 'ruinB', s: 1.08 },
  { x: -450, y: -40, kind: 'ruinA', s: 1.0 },
];

function resize() {
  dpr = Math.min(devicePixelRatio || 1, 2);
  W = innerWidth;
  H = innerHeight;
  canvas.width = W * dpr;
  canvas.height = H * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}
addEventListener('resize', resize);
resize();

export function iso(x, y) {
  return [W / 2 + (x - y) * world.scaleX, H / 2 + (x + y) * world.scaleY + world.offsetY];
}

export function distance(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

export function nearestEnemy() {
  return (
    enemies
      .filter((e) => !e.dead)
      .sort((a, b) => distance(player, a) - distance(player, b))[0] || null
  );
}

function screenToWorld(sx, sy) {
  const a = (sx - W / 2) / world.scaleX;
  const b = (sy - (H / 2 + world.offsetY)) / world.scaleY;
  return { x: (a + b) / 2, y: (b - a) / 2 };
}

function setTarget(e) {
  target = e;
  player.aimTarget = e;
}

function tallyKills() {
  for (const e of enemies) {
    if (e.dead && !deadSeen.has(e)) {
      deadSeen.add(e);
      kills += 1;
    }
  }
}

function showWaveBanner(text, seconds = 2.2) {
  if (!waveBanner) return;
  waveBanner.textContent = text;
  waveBanner.classList.remove('hidden');
  waveBannerTimer = seconds;
}

function spawnWave(n) {
  wave = n;
  enemies = createBandits(n);
  target = null;
  player.aimTarget = null;
}

function attemptFire() {
  if (gameOver || won || player.reloading) return;
  const e = target && !target.dead ? target : nearestEnemy();
  if (!e) return;
  if (distance(player, e) > player.weapon.range) return;
  if (player.weapon.ammo <= 0) {
    reload();
    return;
  }
  const blocked = isLineBlocked(player, e, covers);
  if (blocked && !player.cover) return;
  player.fireAt(e);
  tallyKills();
}

function reload() {
  if (!player.reloading && player.weapon.ammo < player.weapon.magazine) player.startReload();
}

function finish(win) {
  won = win;
  gameOver = !win;
  messageTitle.textContent = win ? 'AREA CLEAR' : 'MISSION FAILED';
  messageText.textContent = win
    ? 'Wave 2 cleared. All hostiles eliminated.'
    : 'The soldier was killed.';
  message.classList.remove('hidden');
}

function reset() {
  player.reset();
  resetDylan(dylan);
  spawnWave(1);
  kills = 0;
  deadSeen.clear();
  gameOver = false;
  won = false;
  waveBannerTimer = 0;
  if (waveBanner) waveBanner.classList.add('hidden');
  message.classList.add('hidden');
}

fireButton.addEventListener('pointerdown', (e) => {
  e.preventDefault();
  firing = true;
  fireButton.classList.add('active');
  attemptFire();
});
addEventListener('pointerup', () => {
  firing = false;
  fireButton.classList.remove('active');
});
addEventListener('pointercancel', () => {
  firing = false;
  fireButton.classList.remove('active');
});
reloadButton.addEventListener('pointerdown', (e) => {
  e.preventDefault();
  reload();
});
restartButton.addEventListener('pointerdown', reset);
messageButton.addEventListener('pointerdown', reset);

canvas.addEventListener('pointerdown', (e) => {
  if (gameOver || won) return;
  const r = canvas.getBoundingClientRect();
  const sx = e.clientX - r.left;
  const sy = e.clientY - r.top;
  for (const enemy of enemies) {
    if (enemy.dead) continue;
    const [x, y] = iso(enemy.x, enemy.y);
    if (Math.hypot(sx - x, sy - (y - 28)) < 38) {
      setTarget(enemy);
      return;
    }
  }
  const p = screenToWorld(sx, sy);
  const cover = findCoverForPoint(p.x, p.y, covers);
  player.setDestination(p.x, p.y, cover);
});

initKeyboard({ onFire: attemptFire, onReload: reload });
initJoystick(document.querySelector('#joystick'));

function advanceWaves() {
  if (!enemies.length || !enemies.every((e) => e.dead)) return;
  if (wave === 1) {
    spawnWave(2);
    showWaveBanner('WAVE 2');
    return;
  }
  finish(true);
}

function update(dt) {
  if (gameOver || won) return;
  if (waveBannerTimer > 0) {
    waveBannerTimer -= dt;
    if (waveBannerTimer <= 0 && waveBanner) waveBanner.classList.add('hidden');
  }
  const mv = getMoveVector();
  if (mv) player.setKeyboardMove(mv);
  else player.keyboardMove = null;
  if (firing) attemptFire();
  player.update(dt, covers);
  if (player.hp <= 0) {
    finish(false);
    return;
  }
  updateDylan(dylan, dt, enemies, covers, player);
  if (dylan.hp <= 0) dylan.dead = true;
  updateBandits(enemies, dt, player, covers, [dylan]);
  if (target?.dead) target = null;
  tallyKills();
  advanceWaves();
}

function diamondPath(x, y, w, h) {
  const p = iso(x, y);
  ctx.beginPath();
  ctx.moveTo(p[0], p[1] - h);
  ctx.lineTo(p[0] + w, p[1]);
  ctx.lineTo(p[0], p[1] + h);
  ctx.lineTo(p[0] - w, p[1]);
  ctx.closePath();
  return p;
}

function drawAsphalt() {
  const step = 80;
  const w = 38;
  const h = 20;
  for (let x = -920; x <= 920; x += step) {
    for (let y = -720; y <= 720; y += step) {
      const p = diamondPath(x, y, w, h);
      if (images.asphalt) {
        ctx.save();
        ctx.clip();
        ctx.drawImage(images.asphalt, p[0] - w, p[1] - h, w * 2, h * 2);
        ctx.restore();
      } else {
        ctx.fillStyle = (x + y) % 160 === 0 ? '#303a3f' : '#2c353a';
        ctx.fill();
      }
    }
  }
}

function drawBuilding(b) {
  const [sx, sy] = iso(b.x, b.y);
  const img = b.kind === 'ruinB' ? images.ruinB : images.ruinA;
  const scale = b.s || 1;
  if (img) {
    const drawW = 150 * scale;
    const drawH = drawW * (img.height / img.width);
    ctx.drawImage(img, sx - drawW / 2, sy - drawH * 0.86, drawW, drawH);
    return;
  }
  ctx.save();
  ctx.translate(sx, sy);
  ctx.fillStyle = b.kind === 'ruinB' ? '#4a4038' : '#3d3834';
  ctx.fillRect(-48 * scale, -110 * scale, 96 * scale, 110 * scale);
  ctx.fillStyle = '#1a1614';
  ctx.fillRect(-28 * scale, -88 * scale, 22 * scale, 28 * scale);
  ctx.fillRect(8 * scale, -70 * scale, 18 * scale, 24 * scale);
  ctx.restore();
}

function drawWorld() {
  ctx.fillStyle = '#1c2328';
  ctx.fillRect(0, 0, W, H);
  drawAsphalt();
  const scenery = [
    ...buildings.map((b) => ({ kind: 'building', depth: b.x + b.y, item: b })),
    ...covers.map((c) => ({ kind: 'cover', depth: c.x + c.y, item: c })),
  ].sort((a, b) => a.depth - b.depth);
  for (const s of scenery) {
    if (s.kind === 'building') drawBuilding(s.item);
    else drawCover(ctx, s.item, iso);
  }
  if (target && !target.dead) {
    const a = iso(player.x, player.y);
    const b = iso(target.x, target.y);
    ctx.strokeStyle = '#f5d54799';
    ctx.setLineDash([5, 6]);
    ctx.beginPath();
    ctx.moveTo(a[0], a[1] - 30);
    ctx.lineTo(b[0], b[1] - 30);
    ctx.stroke();
    ctx.setLineDash([]);
  }
}

function drawUnits() {
  const units = [];
  for (const e of enemies) {
    if (!e.dead) units.push({ depth: e.x + e.y, draw: () => drawBandit(ctx, e, iso, target === e) });
  }
  if (!dylan.dead) units.push({ depth: dylan.x + dylan.y, draw: () => drawDylan(ctx, dylan, iso) });
  units.push({ depth: player.x + player.y, draw: () => drawPlayer(ctx, player, iso) });
  units.sort((a, b) => a.depth - b.depth);
  for (const u of units) u.draw();
}

function drawHud() {
  const hp = Math.max(0, Math.ceil(player.hp));
  const ammo = player.weapon.ammo;
  const mag = player.weapon.magazine;
  const cover = player.cover ? ' <span class="cover">IN COVER</span>' : '';
  const lock = target && !target.dead ? ' · TARGET' : '';
  status.innerHTML =
    `<span class="hp">HP ${hp}</span> · ` +
    `<span class="ammo">AMMO ${ammo}/${mag}</span> · ` +
    `<span class="kills">KILLS ${kills}</span> · ` +
    `W${wave}${cover}${lock}`;
  hint.textContent = player.reloading
    ? 'RELOADING…'
    : 'Joystick / WASD move · FIRE / SPACE shoot · tap bandit to lock';
  reloadButton.classList.toggle(
    'hidden',
    player.weapon.ammo === player.weapon.magazine && !player.reloading
  );
}

function draw() {
  drawWorld();
  drawUnits();
  drawHud();
}

function loop(t) {
  const dt = Math.min(0.033, (t - last) / 1000 || 0);
  last = t;
  update(dt);
  draw();
  requestAnimationFrame(loop);
}

loadAssets().then(() => {
  showWaveBanner('WAVE 1', 1.6);
  requestAnimationFrame(loop);
});
