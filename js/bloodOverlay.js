import { updateBlood, resetBlood } from './bloodEffects.js?v=20260905-54';
var last=performance.now();function frame(now){var dt=Math.min(.05,(now-last)/1000);last=now;updateBlood(dt);requestAnimationFrame(frame)}requestAnimationFrame(frame);window.__resetBlood=resetBlood;
