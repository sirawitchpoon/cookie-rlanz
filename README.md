# Cookie RLanz 🐟

Cookie Run–style side-scrolling endless runner starring the VTuber **RLanz**
(silver-haired cat girl), implemented in **Phaser 3 + Vite** from the design
handoff in `extracted/design_handoff_cookie_rlanz/` (original bundle:
`Cookie Rlanz.zip`).

## Run

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # production build → dist/
npm run preview  # serve the production build
```

## Controls

| Input | Action |
|---|---|
| Space / ↑ / W / **JUMP ▲** button | Jump (press again mid-air for double jump) |
| ↓ / S (hold) / **SLIDE ▼** button (hold) | Slide under ON AIR banners |
| Esc / P / pause button | Pause |

Flow: `Title → Stage Map → Gameplay → (energy 0) → Result`, with the Pause
overlay reachable from Gameplay. Best score persists in `localStorage`
(`cookie-rlanz-best`, same key as the prototype).

## Project layout

```
src/
  config.js          design tokens (colors/typography scale) + TUNING constants
  save.js            best-score persistence + sample wallet data
  textures.js        all CSS-gradient/inline-SVG art rasterized to canvas textures at boot
  ui.js              "chunky candy-noir" UI kit: buttons, pills, panels, stroked text, chips
  main.js            Phaser game config (1920×1080, Scale.FIT letterbox on #0f0c18)
  scenes/
    BootScene.js     loads art, waits for Google fonts, generates textures
    TitleScene.js    title screen
    MapScene.js      Episode 1 stage map
    GameScene.js     gameplay (fixed 60fps sim) + HUD + touch controls
    PauseScene.js    pause overlay (launched over GameScene)
    ResultScene.js   run results + stars + NEW BEST
tools/screenshot.mjs dev QA: captures every screen headlessly
```

## Tuning

The owner flagged the prototype's speed as **too fast**. All gameplay numbers
live in `TUNING` in [src/config.js](src/config.js) (prototype values noted in
comments) and have been retuned downward:

| Constant | Prototype | Now |
|---|---|---|
| `BASE_SPEED` | 13 px/f | 10 px/f |
| `MAX_SPEED` | 22 px/f | 16.5 px/f |
| `SPEED_RAMP_DIST` | 25 000 px | 30 000 px |
| `SPAWN_MIN`–`SPAWN_MAX` | 55–125 f | 70–150 f |
| `ENERGY_DRAIN` | 0.033/f (~50 s) | 0.028/f (~60 s) |

Physics (jump 30, double jump 27, gravity 1.9) and scoring
(`floor(dist/10) + fish×100 + bone×500`; stars at 1 500 / 4 500 / 9 000) match
the handoff spec exactly.

## Production notes (from the handoff)

- The runner sprite is the **placeholder VTuber bust** — the owner will deliver
  an 8-bit run/jump/slide sprite sheet. The hitbox (`HITBOX` in config.js) is
  **decoupled from the visual**; swap the art without touching collision.
- BGM/SFX toggles on the Pause screen are visual mocks (no audio system yet).
- Wallet values (12 480 fish / 36 fishbones) and map progress are sample data.

## Dev shortcuts

`?screen=title|map|game|pause|result` boots straight into a screen
(`result`/`pause` get sample data) — for design QA, not player-facing.

```bash
# headless screenshots of every screen (uses system Chrome/Edge)
npm run preview &
node tools/screenshot.mjs http://localhost:4173 shots
```
