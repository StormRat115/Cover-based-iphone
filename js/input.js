const keys = new Set();
const movementKeys = new Set([
  "w",
  "a",
  "s",
  "d",
  "arrowup",
  "arrowdown",
  "arrowleft",
  "arrowright",
  " ",
  "r",
]);
let initialized = false;

export function clearKeyboard() {
  keys.clear();
}

export function initKeyboard({ onFire, onReload } = {}) {
  if (initialized) return;
  initialized = true;
  addEventListener("keydown", (e) => {
    // Keep loadout selects, buttons and editable fields keyboard-accessible.
    const tag = e.target?.tagName;
    if (
      e.target?.isContentEditable ||
      ["INPUT", "SELECT", "TEXTAREA", "BUTTON"].includes(tag)
    )
      return;
    const key = e.key.toLowerCase();
    if (!movementKeys.has(key)) return;
    e.preventDefault();
    keys.add(key);
    if (!e.repeat && key === " ") onFire?.();
    if (!e.repeat && key === "r") onReload?.();
  });
  addEventListener("keyup", (e) => keys.delete(e.key.toLowerCase()));
  addEventListener("blur", clearKeyboard);
  document.addEventListener("visibilitychange", clearKeyboard);
}

export function getKeyboardMove() {
  const x =
    Number(keys.has("d") || keys.has("arrowright")) -
    Number(keys.has("a") || keys.has("arrowleft"));
  const y =
    Number(keys.has("s") || keys.has("arrowdown")) -
    Number(keys.has("w") || keys.has("arrowup"));
  const length = Math.hypot(x, y);
  return length ? { x: x / length, y: y / length } : null;
}
export function isKeyboardFireHeld() {
  return keys.has(" ");
}
export function hasKeyboardFocus() {
  return keys.size > 0;
}
