// One clock owns simulation, effects and HUD refreshes. No work runs before PLAY.
export function createGameLoop({
  update,
  draw,
  isActive,
  requestFrame = requestAnimationFrame,
}) {
  const step = 1 / 60;
  let started = false;
  let last = null;
  let accumulator = 0;
  let dirty = true;

  function frame(now) {
    const elapsed =
      last === null ? 0 : Math.max(0, Math.min(0.1, (now - last) / 1000));
    last = now;
    if (isActive()) {
      accumulator += elapsed;
      // Bound catch-up after a slow frame; never replay time spent in another tab.
      let steps = 0;
      while (accumulator + 1e-10 >= step && steps < 6 && isActive()) {
        update(step);
        accumulator = Math.max(0, accumulator - step);
        steps++;
      }
      // On 120/144 Hz displays, don't repaint identical 60 Hz simulation states.
      if (steps > 0) dirty = true;
    } else {
      accumulator = 0;
    }
    if (dirty) {
      draw(now);
      dirty = false;
    }
    requestFrame(frame);
  }

  return {
    start() {
      if (started) return;
      started = true;
      requestFrame(frame);
    },
    invalidate() {
      dirty = true;
    },
    resetClock() {
      last = null;
      accumulator = 0;
      dirty = true;
    },
  };
}
