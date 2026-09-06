const SFX_BASE = "./assets/sfx/";
const FIRE_FILES = {
  rifle: "rifle_fire.mp3",
  smg: "smg_fire.mp3",
  dmr: "dmr_fire.mp3",
  sniper: "sniper_fire.mp3",
  shotgun: "shotgun_fire.mp3",
  pistol: "pistol_fire.mp3",
  lmg: "lmg_fire.mp3",
};
const POOL_SIZE = 4;

function makeAudio(src) {
  const a = new Audio(src);
  a.preload = "auto";
  a.volume = 0.75;
  return a;
}

function jitter(base, amount) {
  return base * (1 + (Math.random() * 2 - 1) * amount);
}

const pools = Object.create(null);
let unlocked = false;
let preloaded = false;

function poolFor(key, file) {
  if (pools[key]) return pools[key];
  const src = SFX_BASE + file;
  const list = [];
  for (let i = 0; i < POOL_SIZE; i++) list.push(makeAudio(src));
  pools[key] = list;
  return list;
}

function playFromPool(key, file, opts) {
  opts = opts || {};
  if (typeof Audio === "undefined") return;
  const list = poolFor(key, file);
  let slot = list.find((a) => a.paused || a.ended);
  if (!slot) {
    slot = list[0];
    try {
      slot.pause();
    } catch (e) {}
  }
  try {
    slot.currentTime = 0;
  } catch (e) {}
  const vol = Math.max(
    0.05,
    Math.min(1, jitter(opts.volume == null ? 0.72 : opts.volume, 0.08)),
  );
  slot.volume = vol;
  try {
    slot.playbackRate = Math.max(
      0.85,
      Math.min(1.15, jitter(opts.rate == null ? 1 : opts.rate, 0.06)),
    );
  } catch (e) {
    slot.playbackRate = 1;
  }
  const p = slot.play();
  if (p && typeof p.catch === "function") p.catch(function () {});
}

export const AudioBus = {
  unlock() {
    if (unlocked) return;
    unlocked = true;
    this.preload();
    Object.keys(pools).forEach(function (key) {
      const a = pools[key][0];
      if (!a) return;
      const prev = a.volume;
      a.volume = 0.001;
      const play = a.play();
      if (play && typeof play.then === "function") {
        play
          .then(function () {
            a.pause();
            try {
              a.currentTime = 0;
            } catch (e) {}
            a.volume = prev;
          })
          .catch(function () {
            a.volume = prev;
          });
      } else a.volume = prev;
    });
  },
  preload() {
    if (preloaded || typeof Audio === "undefined") return;
    preloaded = true;
    Object.keys(FIRE_FILES).forEach(function (id) {
      poolFor("fire:" + id, FIRE_FILES[id]);
    });
    poolFor("reload", "reload.mp3");
    poolFor("empty", "empty.mp3");
  },
  playFire(weaponOrId, opts) {
    const id =
      typeof weaponOrId === "string"
        ? weaponOrId
        : (weaponOrId && (weaponOrId.id || "")).toLowerCase();
    const key = FIRE_FILES[id] ? id : "rifle";
    const volumeMul =
      (weaponOrId && typeof weaponOrId === "object" && weaponOrId.sfxVolume) ||
      1;
    const base = opts && opts.volume != null ? opts.volume : 0.72;
    playFromPool("fire:" + key, FIRE_FILES[key], {
      volume: base * volumeMul,
      rate: opts && opts.rate,
    });
  },
  playReload(opts) {
    playFromPool("reload", "reload.mp3", opts || { volume: 0.7 });
  },
  playEmpty(opts) {
    playFromPool("empty", "empty.mp3", opts || { volume: 0.55 });
  },
};

function bindUnlock() {
  if (typeof window === "undefined" || typeof document === "undefined") return;
  const once = function () {
    AudioBus.unlock();
    window.removeEventListener("pointerdown", once, true);
    window.removeEventListener("keydown", once, true);
    window.removeEventListener("touchstart", once, true);
  };
  window.addEventListener("pointerdown", once, true);
  window.addEventListener("keydown", once, true);
  window.addEventListener("touchstart", once, true);
}

bindUnlock();
export default AudioBus;
