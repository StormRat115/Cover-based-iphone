# Cover-based-iphone

Mobile-friendly isometric cover shooter prototype for StormRat.

## Play

**GitHub Pages:** https://stormrat115.github.io/Cover-based-iphone/

Tap/click the ground to move (or use the on-screen joystick / WASD). Tap a bandit to lock a target, then hold **FIRE**. Take cover behind jersey barriers to reduce incoming damage. Ally **Dylan** grabs nearby cover and helps clear waves.

## Local

```bash
git clone https://github.com/StormRat115/Cover-based-iphone.git
cd Cover-based-iphone
# any static server, e.g.:
python3 -m http.server 8080
# open http://localhost:8080
```

> ES modules require HTTP (not `file://`).

## Controls

| Input | Action |
| --- | --- |
| Virtual joystick / WASD | Move |
| Tap ground / cover | Move / take cover |
| Tap bandit | Target lock |
| FIRE / Space | Shoot |
| RELOAD / R | Reload |
| RESTART | Reset mission |

## Features

- Tiled asphalt ground (`assets/generated/tile-asphalt.png`)
- Ruined buildings along map edges
- Jersey-barrier cover sprites with AABB cover logic
- Ally Dylan (simple cover + shoot AI)
- Bandits seek cover and fire
- Two waves of hostiles
- Phone HUD: HP, ammo, kills, IN COVER, big FIRE button

## Repo layout

```
index.html
css/game.css
js/game.js      # loop, waves, world draw
js/player.js
js/ally.js      # Dylan
js/enemy.js
js/cover.js
js/input.js     # keyboard + virtual joystick
js/assets.js
assets/generated/
```
