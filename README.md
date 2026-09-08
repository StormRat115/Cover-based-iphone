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

Cover collision is cached per piece. Soft/destructible cover invalidates that cache through `registerCover` when a piece is damaged or destroyed.

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

## Squadmate Leo (tactical knight): 20260908-126

Fourth named ally beside Rook / Viper / Doc. Default **defense 200**, sword melee preference, infinite personal sidearm while closing. Rebased onto BUILD 124 exclusive-slot repath + façade street flow.

- Loadout tab, HUD kills/DEF, crawl-revive, green cover shields, team XP, and autoplay include Leo.
- AI knobs live on `LEO_AGGRO` in `js/leoKit.js`: `meleeRange` (82), `engageDistance` (520), `abandonCover` (300), `sidearmRange` (780), `shieldDefense` (+80 DEF while blocking / in melee).
- When Leo hop-closes through a slot he uses `repathIfSlotContested` so leapfrog occupancy stays exclusive.
- Art: kit-locked Phone Art `leo-atlas` from `chore/leo-heavy-knight` (`523fd40`) under `assets/generated/soldier/`. States: idle, run, standShoot, shieldRaise, meleeSwing, shieldBlock, reload, death. Temp recolor + drawn props only if that sheet fails to decode.

## Combat / command pack: 20260908-128

Sidewalks restored along both street edges; iso-flow façades stay **behind** the walk (`clipBehindSidewalk` at `sidewalkOuterX`). Buildings are backdrop only. Road fill is unchanged.

Melee-focused units (Leo, chargers, `role: melee`) **ignore cover** and close in the open. Every actor carries a melee weapon (`actor.melee`): Leo sword / charger rushblade, otherwise a weak combat knife (`MELEE` in `js/melee.js`). Melee **always hits**.

**Engaged** (`js/engaged.js`, knobs on `ENGAGED`): when a melee unit enters melee range, both units lock, show a sword mark, cannot use normal regen, and melee until one drops. Shooters skip engaged targets unless no one else is viable. Nearby monsters may **dogpile** (`dogpileRange` 240, `dogpileChance` 0.42 / `dogpileInterval` 0.85s).

Squad HUD is **Aggressive / Follow / Hold** (`SQUAD_MODES`). Old ASSAULT maps to Aggressive, FOCUS maps to Follow.

- Aggressive (`SQUAD_AGGRO`): longer peeks, 10% HP recovery, keep bounding forward. Melee still ignore cover.
- Follow: routine AI, catch up if they lag (`followLag` 56 world units).
- Hold: sit in cover and fire with unchanged peek timing. Melee still ignore cover.

Independent abilities (`js/squadAbilities.js`, `ABILITY_KNOBS`):

| Ally | Ability | Default knobs |
| --- | --- | --- |
| Doc | Stem shot (revive first, else lowest HP). Green + on target. | cooldown 16s, range 560, heal 48, revive 45% |
| Rook | MG88: take cover, 200 ultra-fast unlimited-range shots, then cooldown. | cooldown 26s, fire 0.048s, damage 14 |
| Viper | Heat rounds: Viper + player 100% hit for 10s. | cooldown 20s, duration 10s |
| Leo | Legionary: 2 HP/s and green +; overrides engaged regen lock. | cooldown 22s, duration 12s, 2 HP/s |

Rebased onto BUILD 127 (leapfrog fireteams, suppression VFX, MAG CHECK breath → door/wreck breach). Those systems stay.

## Street combat pack: 20260908-130

Rebased onto latest `development` (BUILD 129 player scale 0.275). Sidewalks, engaged melee, Aggressive/Follow/Hold, abilities, and the player draw scale stay.

1. **Weapon range −10%** — Knob `WEAPON_RANGE.scale` in `js/weapons.js` (default **0.9**). Catalog numbers are BUILD 129; effective combat range is catalog × scale after attachments. Rook **MG88 stays 9999** (unlimited). Melee (Leo sword 82, charger rushblade 50, knife) is unscaled.

   | Gun | BUILD 129 | BUILD 130 |
   | --- | --- | --- |
   | rifle | 1085 | 977 |
   | pistol / sidearm | 735 | 662 |
   | shotgun | 560 | 504 |
   | sniper | 1540 | 1386 |
   | lmg | 1225 | 1103 |
   | dmr | 1400 | 1260 |
   | smg | 840 | 756 |
   | magnum | 686 | 617 |
   | machine pistol | 616 | 554 |
   | fort turret | 1890 | 1701 |
   | enemy roll | 630–980 | 567–882 |
   | MG88 | 9999 | 9999 |

2. **Street objectives** — Four rotating chapters: hold the crosswalk, clear the wreck, escort the stretch, clear the doorway nest. HUD title + line say what to do and the remaining clock / wrecks / meters / hostiles. World marker repeats the progress.
3. **After a side task, push the fort** — Completing a street task still plays MAG CHECK (2.15–3.55s), then the live goal is always **capture the fort**. AI / autoplay / marines resume the forward push instead of waiting on the finished marker. A later random task can still spawn after the cooldown.
4. **Two starting marines** — `INITIAL_MARINE_COUNT = 2`. Skill / reinforcement spawns can still add more.
5. **Squad fights harder** — Doc / Rook / Viper / Leo accuracy and damage up; longer peeks and more shots (`SQUAD_AGGRO`). HP/DEF unchanged. Leo sword 40 → 46. Aggressive / Follow / Hold stay.
6. **Bare squad guns get random attachments** — If a squadmate’s loadout left all four slots empty, combat start rolls one attachment per slot. Assigned loadouts are kept. The player’s gun is not auto-filled.

## Player street scale: 20260908-129

Player character draw scale **0.31 → 0.275** (~11% smaller). Squad (Doc/Rook/Viper/Leo), marines, and enemies are unchanged. Atlas art and cover-slot / collision radii are unchanged.

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

## Street push objective: 20260905-68

- Extended the battlefield to a multi-sector street with 52–58 randomized cover positions and a fortified endpoint.
- Squad and Marine AI advance cover-to-cover, engage contacts along the route, and defend the captured fortification; Marines remain independent of player movement and squad commands.
- Friendly AI suspends objective movement as soon as contact appears, fights from tactical cover, and resumes the push only after the hostile group is eliminated.
- The player squad captures the endpoint by maintaining presence for 30 uninterrupted seconds.
- Capturing deploys a 200 HP, 20 defense support vehicle with a long-range, high-rate, low-damage turret and visible gunner.
- Monsters prioritize living Marines, then the support vehicle, before choosing the player squad; enemy snipers are rarer and use stronger, slower precision fire.

## Tactical awareness and encirclement: 20260906-69

- Player AI scores active threats by distance, visibility, exposure, health, enemy role, and who the enemy is attacking instead of always selecting the nearest target.
- Squad members coordinate target assignments to suppress dangerous specialists while avoiding unnecessary full-team overfocus.
- Combat cover choices account for crossfire and route exposure; friendlies hold position when no safe fighting cover is available.
- Friendlies reload partial magazines from cover and delay revives while enemies are dangerously close.
- After the fort is captured, every new wave splits between the upper and lower screen edges and enters from off-screen to surround the defenders.

## Enemy monster animations: 20260905-65

- Riflemen, shotgunners, heavies, and snipers now use their own transparent monster animation sheets.
- Each monster supports idle, running, low-cover, tall-cover, firing, hit-reaction, and permanent death animation rows.
- All four sheets download and decode during the loading screen so enemy art cannot pop in after a mission begins.
- Marksman, SMG, and pistol enemies retain the original monster sprite as a safe fallback.

## Shaped cover and sharp street: 20260906-79

- Street asphalt is solid color slabs with a sharp screen-space grain, soft lane washes, and sparse marks. The previous BUILD 78 stretch of one small texture across the whole road is gone, and the diamond/square tile grid stays gone.
- Cover is authored as square, rectangle, T, U, and L pieces. Collision segments and procedural art (sandbags, jersey barriers, crates, wrecks, rubble) follow those silhouettes.
- Soldiers and monsters plant against the facing cover edge: closer slots, tall vs low poses, peek/lean offsets, and a slight depth nudge so tucked units sit on the cover silhouette instead of floating through it.

## Combat spectacle pack: 20260908-127

Autoplay street fights should read like a directed war-movie push: bounding fireteams, visible suppression, and a breath → breach chapter after each street objective. Rebased onto latest `development` after PR #14 (exclusive-slot repath + façade street-flow) and PR #16 (Leo tactical knight).

1. **Bound & leapfrog fireteams** — Rook+Viper share `squad-alpha`. Remaining rifle squad (Doc) is its own element. Leo is a **solo knight fireteam** so melee is not gated by overwatch. Marines bound in pairs. One element peeks/suppresses from an exclusive slot while the rear element scoots to the next cover farther up the street, then they swap. Knobs in `FIRETEAM`: `boundMax` 1.28s, hop 88–500, hold 0.58–1.12s. Overwatch still prefers cover during a firefight. Marine `MARINE_AGGRO` peek/dwell/speed knobs stay. Works in autoplay and normal AI.
2. **Visible suppression** — Light pin still drives accuracy/peek. VFX knobs in `COMBAT_VFX`: max 22 live effects, 10 sparks, 10 dust kicks, 8 tracer streaks. Cover impacts and armor hits spawn a brief spark; pinned enemies kick dirt and hug the slot (crouch / no peek). Not a particle flood.
3. **Post-objective breath → breach** — Completing a street task starts a 2.15–3.55s mag-check hold (`STREET_BREATH`). Friendlies reload and stay planted; the next street task does not spawn until the breath ends. `releaseStreetObjectiveHold` still clears the freeze (BUILD 117 unstick). When the breath ends, a forced façade door explode plus a wreck/street detonation kicks the next contact chapter. HUD title/line show **MAG CHECK**.

## Wartorn street, dialog, and unit collision: 20260906-82

- Side-of-street ruined buildings, rubble, smoke, and a smoky skyline dress the battlefield. The playable lane stays street + cover.
- Marines and squad mates bark short military callouts, strategy chatter, and taunts as speech bubbles, rate-limited so they stay organic.
- Living units block each other. Overlap auto-unsticks with a brief pass-through so vaulting and cover collision stay playable.
- Pause sits in the top-right with a mobile-sized hit target.
- Wave enemies mix cover-seekers and exposed shooters. Chargers still rush.

## Street mechanics pack: 20260906-89

Light suppression, generous ammo, impactful squad orders, crawl-to-cover revives, destructible soft cover, and periodic street tasks. Rebased onto PR #5 BUILD 88 so exclusive cover slots and Auto Play front-line camera stay.

1. **Suppression (light)** — Nearby friendly fire briefly pins enemies (slower peek, small accuracy hit). Stacks cap at 3 and fade in under a second. Player and squad barely flinch from enemy fire (cap 1, ~0.26s).
2. **Ammo (generous)** — Primary weapons spend reserve ammo. Street crates drop often from kills, waves, and objectives. Empty primary or a hard pin auto-swaps to an infinite sidearm. Loadout lets the player pick Pistol / Magnum / Machine Pistol with visible stats. Q or the SIDEARM button swaps.
3. **Squad dialog** — Squad “push / hold / focus” lines apply short flank, defense, or accuracy buffs. Marine barks stay flavor-only.
4. **Crawl-to-cover** — Downed player and squad crawl to safer cover, then wait for a proximity revive. Bleed-out timers remain; the run does not soft-fail instantly.
5. **Soft cover** — Sandbags, crates, wrecks, and rubble take hits and break, freeing exclusive slots. Tall jersey pieces stay up. Cracks and rubble mark damage.
6. **Street objectives** — Periodic hold-crosswalk, clear-wreck, and escort tasks. Marines follow the live task instead of charging the far fort.

After merge, Pages should read **BUILD 20260906-89**. If PR #5 is not merged yet, merge #5 first (or this PR includes that tip).

## Organic street canyon: 20260906-90

Wartorn street composition lock (TMNT arcade beat-em-up read, kept on the established isometric camera):

- Playable midfield is a continuous asphalt corridor. Repeating street-photo tiles, diamond grids, and hard slab cuts are gone.
- Sidewalks run along both curbs with a soft grit blend, not a checkerboard of plates.
- Light posts are sparse and sit on the sidewalks.
- Building facades are a distant top/far backdrop plus modest side ruins clipped off the road. They are not huge midfield plates.
- Debris, wrecks, and cover stay on the street. Cover slots, collision, and street objectives are unchanged.

Phone Art street-edge pack (from `chore/street-edge-accents`) stamps lamps and sidewalk props on the curb band only: intact/bent/fallen posts, curb chunks, hydrant/manhole, wrecked bus shelter, tipped trash, dead planter. They are clipped off the playable asphalt so they cannot become mid-road plates.

### Pages verify (BUILD 20260906-107)

1. Open https://stormrat115.github.io/Cover-based-iphone/
2. Confirm the stamp reads **BUILD 20260906-107**.
3. Start a mission. Cover cubes blit Phone Art true-isometric tiles (`iso-*-block` / `block-long` / `top` / `mid` / `full`) with faces already painted on the sprite — not flat brown cubes. Concrete, sandbags, crates, and rubble should read as 3D blocks.
4. U pieces are wide (5+ blocks across). Occasional 5–8 block full walls and half-walls appear. Street cover is slightly denser but still spaced, not clumped.
5. Friendlies in a cover slot show a small green shield above the head: full green for full cover, half-full for half cover. Squad mates and Marines prioritize getting into and staying in exclusive slots during firefights.
6. The player (and allies) use Phone Art’s solid `player-solid-atlas` v4. Bodies are opaque. Animation list: idle, run, standShoot, crouchShoot, reload, death.
7. Sidewalks and lamps stay on the edges. Buildings stay a far backdrop. Squad KILLS still tick.

## True isometric cover faces: 20260906-107

Phone Art `chore/cover-iso-faces` tiles (20 iso sprites, `faces: "top+sides"`) are drawn as cubes. Isolated / half-cover pieces use `iso-*-block` or `iso-*-full`; long runs use `iso-*-mid` / `iso-*-block-long`; exposed north ends use `iso-*-top`. The 16 flat 64×64 skins stay for fallback. U kits are 5–6 blocks wide. Layouts add 5–8 long walls / half-walls and a slightly denser spaced street. A green shield icon marks friendlies occupying a slot (full vs half). Squad and Marine AI treat taking and holding a slot as high priority over standing exposed.

## Faced block cover, wide Us, and cover shields: 20260906-105

Phone Art skins now stamp onto every visible isometric face (top, south, east) with affine mapping and side shading, so cubes read as Minecraft-style blocks instead of brown prisms. U kits are 5–6 blocks wide. Layouts add 5–8 long walls / half-walls and a slightly denser spaced street. A green shield icon marks friendlies occupying a slot (full vs half). Squad and Marine AI treat taking and holding a slot as high priority over standing exposed.

## Minecraft-style block cover: 20260906-104

Street cover is assembled from one uniform block size. Each piece is a connected random shape (rect, L, T, U, line, cluster, wall, halfwall) wearing a Phone Art material skin from `chore/block-cover-skins`. Same-skin neighbors pick center/edge/corner tiles so the shape seams into one barricade. Collision, exclusive slots, vault, LOS, and soft-cover breaks all run on that block grid. Sixteen 64×64 WebP skins live in `assets/generated/cover/blocks/` (concrete, sandbags, crates, rubble). Rebased onto BUILD 102 Phone Art soldier atlas.

## Phone Art solid player atlas: 20260906-102

- Wired official `assets/generated/soldier/player-solid-atlas` from `chore/player-solid-atlas` (v4, 4×6, 192px cells, ~691KB) as the primary player and ally sheet.
- States: idle, run, standShoot, crouchShoot, reload, death. Tall/low cover rows were removed; in-cover maps to idle / standShoot / crouchShoot.
- Living friendlies still blit one fully opaque frame (no mid-alpha blend, no body plate). Vault stays on its own strip.

## Opaque friendlies, spaced street cover, and squad kills: 20260906-97

- Living player/ally/Marine frames blit once at `globalAlpha` 1 with no team filter or blend crossfade.
- Living friendlies draw in a second pass on top of cover so soft cover stamps cannot wash them into ghosts.
- Street cover uses three staggered on-road lanes, fewer pieces, and larger gaps so exclusive slots and pathing breathe. The fort remains an intentional cluster.
- The squad commands panel lists KILLS for the player, each squad mate, and each Marine.

## Team XP, skills, armor, and segmented waves: 20260906-81

Shared team XP for the player, allies, and Marines:

```
killXP(type, wave) = 12 + 4 * wave + typeBonus
  charger 14, heavy 10, sniper 8, shotgunner 6, marksman 5, else 2
waveXP(wave)       = 50 + 20 * wave
xp to next level   = 70 + 40 * currentLevel
skill points       = 1 per level gained
```

Loadout shows team level, unspent points, a four-branch skill tree (combat / grenades / squad / Marines), and armor that trades defense, hit chance, and move speed. Waves arrive in packs of three. Fodder holds threat-aware cover; Rushblade chargers (Phone Art atlas) ignore cover and melee the closest marine, ally, or player.

## Northeast assault waves: 20260905-68

- Monster animation states now use per-enemy clocks, calmer frame rates, and held firing/hit reactions instead of racing through six-frame rows.
- Waves receive 6–12 additional monsters and enter primarily from just beyond the northeast street edge rather than appearing inside the viewport.
- Snipers project a pulsing red targeting laser toward their current exposed target.
- Marine defense is 20; Marines charge toward enemies, advance through closer cover, and fire from aggressive positions.
