const BUILD = "20260908-137";
const element = (id) => document.getElementById(id);

function showGameError(label, error) {
  const box = element("runtimeError");
  box.textContent = `GAME ERROR [${label}] BUILD ${BUILD}: ${error?.message || String(error)}${error?.stack ? "\n\n" + error.stack : ""}`;
  box.classList.remove("hidden");
}
window.addEventListener("error", (event) =>
  showGameError("RUNTIME", event.error || event),
);
window.addEventListener("unhandledrejection", (event) =>
  showGameError("PROMISE", event.reason || event),
);

function setLoad(percent, status) {
  percent = Math.max(0, Math.min(100, Math.round(percent)));
  element("loadingPercent").textContent = percent + "%";
  element("loadingFill").style.width = percent + "%";
  if (status) element("loadingStatus").textContent = status;
}

function yieldPaint() {
  return new Promise((resolve) => {
    if (typeof requestAnimationFrame === "function") {
      requestAnimationFrame(() => resolve());
      return;
    }
    setTimeout(resolve, 0);
  });
}

async function boot() {
  const start = element("startGame");
  try {
    setLoad(4, "LOADING SYSTEMS");
    await yieldPaint();
    // Independent modules and images download concurrently, using the same URLs
    // as the gameplay imports so atlases are built only once.
    const [menu, soldiers, city, audio, charger, variantArt] = await Promise.all([
      import("./mainMenu.js?v=20260908-137"),
      import("./soldierAssets.js?v=20260908-137"),
      import("./cityAssets.js?v=20260908-137"),
      import("./audio.js?v=20260908-137"),
      import("./chargerEnemy.js?v=20260908-137"),
      import("./variantArt.js?v=20260908-137"),
    ]);
    if (audio && audio.AudioBus) audio.AudioBus.preload();
    const weights = { soldier: 0.5, city: 0.2, charger: 0.12, variant: 0.18 };
    const progress = { soldier: 0, city: 0, charger: 0, variant: 0 };
    const report = (channel, value, status) => {
      progress[channel] = Math.max(0, Math.min(1, value || 0));
      const mixed =
        progress.soldier * weights.soldier +
        progress.city * weights.city +
        progress.charger * weights.charger +
        progress.variant * weights.variant;
      setLoad(
        8 + mixed * 84,
        status || "PREPARING BATTLEFIELD ASSETS",
      );
    };
    setLoad(8, "PREPARING BATTLEFIELD ASSETS");
    await yieldPaint();
    const [characters, environment] = await Promise.all([
      soldiers.preloadSoldierAssets((p, status) => report("soldier", p, status)),
      city.preloadCityAssets((p, status) => report("city", p, status)),
      charger.preloadChargerAssets((p, status) => report("charger", p, status)),
      variantArt.preloadVariantAssets((p, status) =>
        report("variant", p, status),
      ),
    ]);
    if (
      !characters?.soldierAtlas ||
      !characters?.monsterAtlas ||
      !environment
    ) {
      throw new Error("Battlefield art is not ready. Please retry loading.");
    }
    setLoad(95, "LOADING STREET PUSH");
    const game = await import("./game.js?v=20260908-137");
    setLoad(100, "READY");
    start.classList.add("ready");
    let enteredMenu = false;
    start.addEventListener("click", () => {
      element("loadingScreen").classList.add("hidden");
      element("mainMenu").classList.remove("hidden");
      if (enteredMenu) return;
      enteredMenu = true;
      menu.initMainMenu(game.startGame);
    });
  } catch (error) {
    setLoad(0, "FAILED: " + (error?.message || String(error)));
    showGameError("MODULE LOAD", error);
    start.textContent = "RETRY";
    start.classList.add("ready");
    start.addEventListener("click", () => location.reload(), { once: true });
  }
}
boot();
