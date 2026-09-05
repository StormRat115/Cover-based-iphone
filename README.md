# Cover Shooter

Mobile-first isometric squad shooter, built with native JavaScript modules and Canvas 2D. No production dependencies or build step.

[Play the development build](https://stormrat115.github.io/Cover-based-iphone/)

## Development workflow

Keep `main` stable. Work and test on `development`; pushes to that branch deploy through the existing GitHub Pages workflow. Do not merge into `main` without reviewing the tested changes.

Serve the repository through an HTTP server to play locally; opening `index.html` as a `file:` URL will not load ES modules.

Controls: tap/click the battlefield to move, tap an enemy to lock a target, hold FIRE or Space to shoot, and use WASD/arrow keys to move on desktop. R reloads. AUTO PLAY pilots the player, and the side drawer contains squad commands and squad health. Switching away from the page pauses the mission; use RESUME when returning.

## Active code

- `index.html`, `css/`: markup and styles, with loading/menu styles separated into `menu.css`.
- `js/boot.js`: error reporting, shared asset preloading, menu, and explicit PLAY startup.
- `js/game.js`: mission state, input wiring, combat orchestration, camera, depth ordering, and drawing.
- `js/gameLoop.js`: one bounded 60 Hz simulation clock; HUD and effects follow that clock. Paused frames do not redraw continuously.
- `js/geometry.js`, `js/cover.js`: coordinate conversion, nearest-target lookup, and cached static cover geometry.
- `js/player.js`, `js/ally.js` + `js/allyCore2.js`, `js/enemy.js` + `js/enemyCore.js`: actors, AI, and rendering.
- `js/assets.js`, `js/soldierAssets.js`, `js/cityAssets.js`: shared image loading and atlas preparation.
- `js/combatHud.js`, `js/squadHud.js`, `js/bloodEffects.js`: explicit updates from the main loop, not independent timers.

`gameWave.js` is a compatibility re-export. Older experimental AI and overlay files remain in the repository for reference but are not loaded by the current entrypoint. In particular, do not re-add the independent timers in `playerAggression.js`, `autoplayTracers.js`, or `bloodOverlay.js` to the active import graph.

Cover geometry is static after `createCover()` for the duration of a mission. If moving/destructible cover is added, its cached collision geometry must be invalidated or rebuilt.

## Checks

Requires Node.js 22 or newer. No test dependencies need installing.

```sh
node --experimental-vm-modules --test tests/regression.mjs
node --experimental-vm-modules scripts/benchmark.mjs
```

The regression suite checks asset/module paths, the full loading-to-PLAY flow, pause/restart/waves, camera coordinate conversion, cover-rule equivalence, ammo/reload behavior, input cleanup, failed-asset fallback, and sustained simulated play at portrait, landscape, and desktop dimensions.

These are deterministic logic checks using lightweight DOM/canvas doubles, not browser screenshots or device FPS measurements. An actual Safari/iPhone playtest is still needed for visual layout, GPU performance, touch feel, and asset appearance.

The benchmark compares the optimization baseline commit `a0dd8aa75f2b13c3ccc13509ffdb61d5a7b7d8c8`. It counts canvas drawing API calls for a stationary starting frame and times identical cover queries. Retain Git history to run the before/after comparison. Timing varies by machine.

## Cache versions

Every active import must use the same module URL. After changing JavaScript or CSS, bump the build stamp and all module references together:

```sh
node scripts/version.mjs YYYYMMDD-N
```

When replacing an image, also bump that image's source URL in the relevant asset module. Do not create separate query versions of a stateful module: browsers treat them as separate instances.

## Optimization pass: 20260905-59

- Replaced the global animation-frame override and competing autoplay/effect clocks with explicit startup and one loop.
- Fixed full squad/mission reset, pause/background behavior, held Space firing, stale key states, enemy magazine consumption, and camera-relative tap targeting.
- Removed approximately 1,248 ground-tile draw calls that were covered by the map; culled offscreen scenery/actors and reused depth-sort records.
- Throttled HUD refreshes, avoided unchanged panel rebuilds, bounded blood stains, and rendered effects with the game camera.
- Preserved the previous 35-sample cover-blocking rule with equivalent interval calculations and cached static collision pieces; deferred enemy accuracy checks until a shot is due.
- Removed duplicate module URLs and redundant preload requests.

## Visibility and asset fix: 20260905-60

- Required character and environment art now finishes decoding before the game opens, with retry and a visible load failure instead of silently starting without sprites.
- Player bullets use bright yellow, longer, glowing tracers in manual and auto play.
- Auto play fires whenever a clear target is inside the equipped weapon's full range while continuing to advance.
- A player-only yellow engagement ring scales to the range of the currently equipped weapon.

## Expanded cover set: 20260905-62

- Added four transparent source sheets for concrete, sandbag/rubble, large industrial, and prop cover assets.
- Added a 164 KB runtime atlas containing 12 selected cover sprites to keep mobile startup lightweight.
- Expanded the battlefield with straight, corner, curved, U-shaped, vehicle, container, pipe, crate, brick, and planter cover.
- Added compound collision segments for corner, curved, and U-shaped cover so tactical movement follows their silhouettes.

## Procedural missions: 20260905-63

- Each mission now generates a different selection and arrangement of 27–33 cover objects across balanced inner, middle, and outer combat rings.
- Placement protects squad and enemy spawn zones, avoids decorative props, and prevents cover overlap.
- Starting or restarting a mission creates a fresh battlefield while preserving accurate compound collision shapes.

## Marine support team: 20260905-64

- Added five independent Marines: four riflemen and one LMG support gunner.
- Marines fight enemies and coordinate cover with the squad, but ignore squad commands and do not occupy squad slots.
- Marines have no health regeneration, downed state, revival, or mid-mission respawn; a Marine who reaches zero health is permanently KIA for that mission.
- Enemy target selection and the mission display now account for surviving Marines.
