var canvas = document.getElementById("game"),
  overlay = document.createElement("canvas");
overlay.id = "autoTracerCanvas";
overlay.style.cssText =
  "position:fixed;inset:0;width:100vw;height:100vh;pointer-events:none;z-index:3";
canvas.parentNode.insertBefore(overlay, canvas.nextSibling);
var g = overlay.getContext("2d"),
  shots = [],
  cameraX = 0,
  cameraY = 0,
  minX = -2300,
  maxX = 2300,
  minY = -1900,
  maxY = 1900,
  last = performance.now();
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
function iso(x, y) {
  return [
    innerWidth / 2 + (x - cameraX - y + cameraY) * 0.25,
    innerHeight / 2 + (x - cameraX + y - cameraY) * 0.125 - 40,
  ];
}
function updateCamera() {
  var p = window.__battlePlayer;
  if (!p) return;
  cameraX += (clamp(p.x, minX + 430, maxX - 430) - cameraX) * 0.09;
  cameraY += (clamp(p.y, minY + 330, maxY - 330) - cameraY) * 0.09;
}
window.__spawnAutoTracer = function (from, to, hit) {
  if (!from || !to) return;
  var dx = to.x - from.x,
    dy = to.y - from.y,
    d = Math.hypot(dx, dy) || 1,
    tx = to.x,
    ty = to.y;
  if (!hit) {
    var miss = 45 + Math.min(130, d * 0.11),
      px = -dy / d,
      py = dx / d,
      side = Math.random() < 0.5 ? -1 : 1;
    tx += px * miss * side + (Math.random() - 0.5) * 44;
    ty += py * miss * side + (Math.random() - 0.5) * 44;
  }
  shots.push({ sx: from.x, sy: from.y, tx: tx, ty: ty, t: 0, life: 0.16 });
};
function frame(now) {
  var dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  updateCamera();
  g.clearRect(0, 0, innerWidth, innerHeight);
  for (var i = shots.length - 1; i >= 0; i--) {
    var s = shots[i];
    s.t += dt;
    if (s.t >= s.life) {
      shots.splice(i, 1);
      continue;
    }
    var a = iso(s.sx, s.sy),
      b = iso(s.tx, s.ty),
      progress = Math.min(1, s.t / 0.075),
      x = a[0] + (b[0] - a[0]) * progress,
      y = a[1] + (b[1] - a[1]) * progress,
      dx = b[0] - a[0],
      dy = b[1] - a[1],
      len = Math.hypot(dx, dy) || 1;
    g.save();
    g.globalAlpha = Math.max(0.3, 1 - s.t / s.life);
    g.strokeStyle = "#ffe36b";
    g.lineWidth = 2.4;
    g.lineCap = "round";
    g.shadowColor = "#ffe36b";
    g.shadowBlur = 7;
    g.beginPath();
    g.moveTo(x - (dx / len) * 38, y - (dy / len) * 38);
    g.lineTo(x, y);
    g.stroke();
    g.restore();
  }
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
