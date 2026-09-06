const keys = new Set();
let firePressed = false;
let reloadPressed = false;

/** Virtual joystick state (phone-friendly). */
const joy = {
  active: false,
  id: null,
  ox: 0,
  oy: 0,
  x: 0,
  y: 0,
  dx: 0,
  dy: 0,
  radius: 56,
};

export function initKeyboard({ onFire, onReload } = {}) {
  addEventListener('keydown', (e) => {
    const k = e.key.toLowerCase();
    if (
      ['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' ', 'r'].includes(
        k
      )
    )
      e.preventDefault();
    if (k === ' ' && !e.repeat) {
      firePressed = true;
      onFire?.();
    }
    if (k === 'r' && !e.repeat) {
      reloadPressed = true;
      onReload?.();
    }
    keys.add(k);
  });
  addEventListener('keyup', (e) => keys.delete(e.key.toLowerCase()));
  addEventListener('blur', () => keys.clear());
}

export function initJoystick(el) {
  if (!el) return;
  const base = el.querySelector('.joy-base') || el;
  const knob = el.querySelector('.joy-knob');

  const setKnob = (nx, ny) => {
    if (!knob) return;
    knob.style.transform = `translate(${nx}px, ${ny}px)`;
  };

  const onDown = (e) => {
    if (joy.active) return;
    e.preventDefault();
    const r = base.getBoundingClientRect();
    joy.active = true;
    joy.id = e.pointerId;
    joy.ox = r.left + r.width / 2;
    joy.oy = r.top + r.height / 2;
    joy.x = e.clientX;
    joy.y = e.clientY;
    updateVec();
    try {
      base.setPointerCapture(e.pointerId);
    } catch (_) {}
  };

  const updateVec = () => {
    let vx = joy.x - joy.ox;
    let vy = joy.y - joy.oy;
    const len = Math.hypot(vx, vy);
    const max = joy.radius;
    if (len > max) {
      vx = (vx / len) * max;
      vy = (vy / len) * max;
    }
    joy.dx = vx / max;
    joy.dy = vy / max;
    setKnob(vx, vy);
  };

  const onMove = (e) => {
    if (!joy.active || e.pointerId !== joy.id) return;
    joy.x = e.clientX;
    joy.y = e.clientY;
    updateVec();
  };

  const onUp = (e) => {
    if (!joy.active || (e.pointerId != null && e.pointerId !== joy.id)) return;
    joy.active = false;
    joy.id = null;
    joy.dx = 0;
    joy.dy = 0;
    setKnob(0, 0);
  };

  base.addEventListener('pointerdown', onDown);
  base.addEventListener('pointermove', onMove);
  base.addEventListener('pointerup', onUp);
  base.addEventListener('pointercancel', onUp);
  base.addEventListener('lostpointercapture', onUp);
}

export function getKeyboardMove() {
  let x = 0;
  let y = 0;
  if (keys.has('a') || keys.has('arrowleft')) x -= 1;
  if (keys.has('d') || keys.has('arrowright')) x += 1;
  if (keys.has('w') || keys.has('arrowup')) y -= 1;
  if (keys.has('s') || keys.has('arrowdown')) y += 1;
  const len = Math.hypot(x, y);
  return len ? { x: x / len, y: y / len } : null;
}

/** Prefer joystick when active; else keyboard. */
export function getMoveVector() {
  if (joy.active && (Math.abs(joy.dx) > 0.08 || Math.abs(joy.dy) > 0.08)) {
    return { x: joy.dx, y: joy.dy };
  }
  return getKeyboardMove();
}

export function hasKeyboardFocus() {
  return keys.size > 0;
}

export function getJoystick() {
  return joy;
}
