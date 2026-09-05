const BUILD = "20260905-61";
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
  element("loadingStatus").textContent = status;
}

async function boot() {
  const start = element("startGame");
  try {
    setLoad(3, "LOADING SYSTEMS");
    // Independent modules and images download concurrently, using the same URLs
    // as the gameplay imports so atlases are built only once.
    const [menu, soldiers, city] = await Promise.all([
      import("./mainMenu.js?v=20260905-61"),
      import("./soldierAssets.js?v=20260905-61"),
      import("./cityAssets.js?v=20260905-61"),
    ]);
    let soldierProgress = 0,
      cityProgress = 0;
    const report = () =>
      setLoad(
        10 + soldierProgress * 40 + cityProgress * 40,
        "PREPARING BATTLEFIELD ASSETS",
      );
    const [characters, environment] = await Promise.all([
      soldiers.preloadSoldierAssets((p) => {
        soldierProgress = p;
        report();
      }),
      city.preloadCityAssets((p) => {
        cityProgress = p;
        report();
      }),
    ]);
    if (
      !characters?.soldierAtlas ||
      !characters?.monsterAtlas ||
      !environment
    ) {
      throw new Error("Battlefield art is not ready. Please retry loading.");
    }
    setLoad(95, "LOADING WAVE DEFENSE");
    const game = await import("./game.js?v=20260905-61");
    setLoad(100, "READY");
    start.classList.add("ready");
    start.addEventListener(
      "click",
      () => {
        element("loadingScreen").classList.add("hidden");
        element("mainMenu").classList.remove("hidden");
        menu.initMainMenu(game.startGame);
      },
      { once: true },
    );
  } catch (error) {
    setLoad(0, "FAILED: " + (error?.message || String(error)));
    showGameError("MODULE LOAD", error);
    start.textContent = "RETRY";
    start.classList.add("ready");
    start.addEventListener("click", () => location.reload(), { once: true });
  }
}
boot();
