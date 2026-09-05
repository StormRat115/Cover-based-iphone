import {
  updateBlood,
  drawBlood,
  resetBlood,
} from "./bloodEffects.js?v=20260905-66";
var game = document.getElementById("game"),
  overlay = document.createElement("canvas");
overlay.id = "bloodCanvas";
overlay.style.cssText =
  "position:fixed;inset:0;width:100vw;height:100vh;pointer-events:none;z-index:2";
game.parentNode.insertBefore(overlay, game.nextSibling);
var g = overlay.getContext("2d"),
  last = performance.now(),
  cameraX = 0,
  cameraY = 0,
  minX = -2300,
  maxX = 2300,
  minY = -1900,
  maxY = 1900;
function clamp(v, a, b) {
  return Math.max(a, Math.min(b, v));
}
function resize() {
  var d = Math.min(devicePixelRatio || 1, 2);
  overlay.width = innerWidth * d;
  overlay.height = innerHeight * d;
  g.setTransform(d, 0, 0, d, 0, 0);
}
addEventListener("resize", resize);
resize();
function updateCamera() {
  var p = window.__battlePlayer;
  if (!p) return;
  cameraX += (clamp(p.x, minX + 430, maxX - 430) - cameraX) * 0.09;
  cameraY += (clamp(p.y, minY + 330, maxY - 330) - cameraY) * 0.09;
}
function iso(x, y) {
  return [
    innerWidth / 2 + (x - cameraX - y + cameraY) * 0.25,
    innerHeight / 2 + (x - cameraX + y - cameraY) * 0.125 - 40,
  ];
}
function clearActor(a) {
  if (!a) return;
  var q = iso(a.x, a.y);
  g.save();
  g.globalCompositeOperation = "destination-out";
  g.beginPath();
  g.ellipse(q[0], q[1] - 22, 18, 31, 0, 0, Math.PI * 2);
  g.fill();
  g.restore();
}
function clearCover(c) {
  if (!c) return;
  var q = iso(c.x, c.y),
    w = c.type === "wide" ? 42 : c.type === "car" ? 38 : 30,
    h = c.type === "wide" ? 28 : c.type === "car" ? 25 : 22;
  g.save();
  g.globalCompositeOperation = "destination-out";
  g.beginPath();
  g.moveTo(q[0], q[1] - h - 18);
  g.lineTo(q[0] + w, q[1] - 18);
  g.lineTo(q[0] + w, q[1] + 8);
  g.lineTo(q[0], q[1] + h);
  g.lineTo(q[0] - w, q[1] + 8);
  g.lineTo(q[0] - w, q[1] - 18);
  g.closePath();
  g.fill();
  g.restore();
}
function depthMask() {
  (window.__battleCovers || []).forEach(clearCover);
  (window.__battleAllies || []).forEach(clearActor);
  (window.__battleEnemies || []).forEach(clearActor);
  clearActor(window.__battlePlayer);
}
function frame(now) {
  var dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  updateCamera();
  updateBlood(dt);
  g.clearRect(0, 0, innerWidth, innerHeight);
  drawBlood(g, iso);
  depthMask();
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
window.__resetBlood = resetBlood;
