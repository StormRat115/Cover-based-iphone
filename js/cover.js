import { images } from './assets.js';

export function createCover() {
  return [
    { id: 'c1', x: -150, y: -30, w: 170, h: 40 },
    { id: 'c2', x: 90, y: -75, w: 190, h: 40 },
    { id: 'c3', x: 150, y: 100, w: 150, h: 40 },
    { id: 'c4', x: -40, y: 145, w: 180, h: 40 },
    { id: 'c5', x: -260, y: 80, w: 140, h: 36 },
  ];
}

export function findCoverForPoint(x, y, covers) {
  return (
    covers.find(
      (c) => Math.abs(x - c.x) < c.w / 2 + 24 && Math.abs(y - c.y) < c.h / 2 + 18
    ) || null
  );
}

export function isLineBlocked(a, b, covers) {
  for (const c of covers) {
    const left = c.x - c.w / 2;
    const right = c.x + c.w / 2;
    const top = c.y - c.h / 2;
    const bottom = c.y + c.h / 2;
    const steps = 20;
    for (let i = 1; i < steps; i++) {
      const t = i / steps;
      const x = a.x + (b.x - a.x) * t;
      const y = a.y + (b.y - a.y) * t;
      if (x > left && x < right && y > top && y < bottom) return true;
    }
  }
  return false;
}

export function drawCover(ctx, c, iso) {
  const [x, y] = iso(c.x, c.y);
  const img = images.jersey;
  ctx.save();
  ctx.translate(x, y);
  if (img) {
    const drawW = c.w * 0.85;
    const drawH = drawW * (img.height / img.width) * 1.15;
    ctx.drawImage(img, -drawW / 2, -drawH * 0.72, drawW, drawH);
  } else {
    ctx.fillStyle = '#59636a';
    ctx.fillRect(-c.w * 0.36, -20, c.w * 0.72, 40);
    ctx.fillStyle = '#778188';
    ctx.fillRect(-c.w * 0.36, -20, c.w * 0.72, 8);
    ctx.strokeStyle = '#1b2226';
    ctx.strokeRect(-c.w * 0.36, -20, c.w * 0.72, 40);
  }
  ctx.restore();
}
