# Handoff: Cookie RLanz — Endless Runner Game UI

## Overview
Complete UI design + playable gameplay reference for **Cookie RLanz**, a Cookie Run–style side-scrolling endless runner starring the VTuber **RLanz** (silver-haired cat girl; brand colors silver/pink/blue/black/gold). The package covers 5 screens: Title, Stage Map, Gameplay HUD (with a working game loop), Pause overlay, and Result.

## About the Design Files
The files in this bundle are **design references created in HTML** — a prototype showing the intended look and behavior, **not production code to copy directly**. Your task is to **recreate these designs in the target game environment** (e.g., Phaser, PixiJS, Godot, Unity, or a React/canvas hybrid — none exists yet, so choose what fits a lightweight 2D web runner best; Phaser 3 is a sensible default). The HTML prototype's game loop is a *behavioral spec*, not an engine recommendation.

`Cookie RLanz.dc.html` opens directly in a browser. Screens are switchable via the "SCREENS" pill at bottom-left (mockup-only chrome — do not implement it). The gameplay screen is fully playable for reference.

## Fidelity
**High-fidelity** for all UI chrome (colors, type, spacing, button styles, layout are final intent — recreate pixel-perfect at 1920×1080 design resolution, scale-to-fit letterboxed).

**Placeholder elements (explicitly NOT final):**
- The **runner sprite** currently uses the VTuber bust PNG (`assets/rlanz-bust.png`). The owner will produce a dedicated **8-bit pixel-art sprite** (run / jump / slide animation frames) for production. Hitbox is already decoupled from the visual — keep it that way (see Gameplay spec).
- Game speed/difficulty values are first-pass and flagged by the owner as **too fast** — expose them as tunable constants and retune (see Tuning notes).
- BGM/SFX toggles on Pause are visual mocks (no audio system designed yet).
- Wallet values (12,480 fish / 36 fishbones) and map progress are sample data.

## Design Tokens

### Colors
| Token | Hex | Use |
|---|---|---|
| ink | `#211c2b` | All outlines (3–5px borders), hard drop-shadows (`box-shadow: 0 Npx 0 #211c2b`), text strokes |
| panel | `#f7f5fa` | Light panel/card backgrounds (pause, result, stage card) |
| pink (primary) | `#f2589c` | Primary buttons, ground neon edge, obstacles, energy fill |
| pink light | `#ff8cc0` / `#ffd9ea` | Button gradient tops, accents |
| blue | `#7fb1f2` / `#8db8f5` | Fish currency, slide button, episode banner, tall obstacle |
| blue deep | `#5e8fe0` | Fish tail |
| gold | `#cfa85e` / `#ffe9a8` | Gold buttons (TAP TO START, RETRY), current-stage node |
| gold star | `#ffd76e` | Stars, NEW BEST badge, fishbone glow |
| fishbone | `#e9c878` | Gold fishbone icon strokes |
| bg night top | `#332b52` → `#1d1733` (55%) → `#271e3e` | Sky gradient, all screens |
| ground | `#2c2342` | Gameplay ground block |
| slate | `#4a4358` | Secondary buttons (MAP), muted text on light panels |
| locked node | `#39334b` (icon `#6b6480`) | Locked stage nodes |
| muted light | `#cfc6e8` / `rgba(255,255,255,.65)` | Subtitles, labels on dark |

### Typography
- **Fredoka** (Google Fonts; weights 400–700) — all Latin UI text, numbers, headings.
- **Mali** (Google Fonts; weights 500–700) — all Thai copy.
- Scale (at 1920×1080): logo 190px/700; screen titles 44–56px/700; buttons 30–44px/700 with 2–6px letter-spacing; HUD score 72px/700; body/labels 22–30px/600; fine print 19–20px.
- Big numerals/HUD text on dark backgrounds get a faux stroke: 4-direction `text-shadow` in ink + `0 8–14px 0` ink drop.

### Component style ("chunky candy-noir")
- **Buttons:** gradient fill (light top → color), `4–5px solid #211c2b` border, radius 20–26px, hard shadow `0 7–9px 0 #211c2b`; active state = `translateY(4px)` + shadow reduced to ~half (3D press).
- **Pills/chips:** `border-radius: 999px`, dark translucent bg `rgba(16,12,28,.72)`, 3px ink border, `0 4px 0` ink shadow.
- **Panels:** `#f7f5fa`, 5px ink border, radius 28–34px, `0 11–13px 0` ink shadow.
- Spacing rhythm: 16/18/24px gaps; screen margins 40–48px.

## Screens / Views

### 1. Title (`data-screen-label="Title"`)
- Night-sky bg (gradient above) + twinkling star dots + soft pink moon (top right, 170px circle w/ glow) + two huge blurred color circles (pink bottom-left, blue top-right, ~10% opacity).
- **Top-right:** two currency chips — blue fish icon + count, gold fishbone icon + count, each with a circular `+` buy button (28px).
- **Left column (x≈140, y≈220):** "COOKIE" pink pill (rotated −3°, letter-spacing 8px) → "RLANZ" 190px wordmark (white, ink stroke + pink glow) → divider bars + Thai tagline (Mali 30px, `#cfc6e8`): "วิ่งเก็บปลา ฝ่าเมืองยามค่ำคืน ไปกับแมวเงิน RLanz" → **TAP TO START** gold button (44px text, pulsing scale 1↔1.05, 1.6s).
- **Right:** character art ~930px tall, floating ±18px (4.5s ease-in-out), pink glow ellipse on floor.
- **Bottom-left:** `ver 0.1.0 — UI mockup · © 2026 RLanz Ch.` (replace with real version).
- **Interaction:** click/tap anywhere → Stage Map.

### 2. Stage Map (`data-screen-label="Stage Map"`)
- Same night bg; bottom 420px darkens (vignette gradient).
- **Header:** `‹ BACK` pill (top-left → Title); centered blue banner "EPISODE 1 · MIDNIGHT STREAM CITY" + Thai subtitle "เมืองสตรีมยามค่ำคืน — บทแรกของแมวเงิน"; currency chips top-right.
- **Path:** dashed white curve (10px stroke, 35% alpha, `stroke-dasharray 4 40`, dash-offset animating) snaking through 7 node points: (240,560)(470,440)(740,540)(1010,380)(1270,470)(1500,330)(1700,520).
- **Nodes (88px circles, 4px ink border, `0 7px 0` ink shadow):**
  - *Cleared (1–3):* pink gradient, white number, gold stars above (★×3, ★×2, ★×3).
  - *Current (4):* 112px gold gradient circle + outer gold halo ring; RLanz avatar (96px circle, gold border) bouncing above with "YOU" tag.
  - *Locked (5–7):* dark `#39334b`, CSS padlock glyph, not clickable.
- **Stage card (bottom-right, 580px):** "STAGE 1-4" pink tag + "NEON ROOFTOP" title; Thai description; `BEST <score>` (reads saved best) + ★★☆; full-width pink **PLAY ▶** button → starts run.

### 3. Gameplay (`data-screen-label="Gameplay"`)
**World layers (back→front):** sky gradient + stars + moon → far building silhouettes (repeating-gradient strip, 340px tall, scrolls ~36s/1200px) → near silhouettes (210px, ~18s) → ground block (140px tall, `#2c2342`, 6px pink neon top edge + glow) → lane dashes strip (at y=96 from bottom, scrolls fast, 1.1s) → entity layer → HUD.

**HUD top-left:** pause button (84px rounded square, two white bars) · RLanz avatar (92px circle, white border) · ENERGY label + bar (520×36px pill, ink border; fill = pink gradient, turns red gradient below 30%; width animates).
**HUD top-right:** score (72px, stroked) · fish-count chip · distance chip (`NNNm`, blue text).
**Touch controls:** bottom-left **SLIDE ▼** (180px circle, translucent blue), bottom-right **JUMP ▲** (translucent pink). Press state sinks 5px. `touch-action:none`.
**Start hint (until first input):** centered dark pill — "SPACE / ▲ JUMP · ▼ SLIDE" + Thai "กด JUMP เพื่อเริ่มวิ่ง — เก็บปลา หลบสิ่งกีดขวาง!", pulsing.

**Gameplay spec (reference implementation in the DC logic class — `step()`, `spawn()`, `jump()`):**
- Design-space: 1920×1080, ground top at y=940 (140px ground). Player fixed at x≈240–380.
- Run loop 60fps. Physics: jump velocity 30 px/f, gravity 1.9 px/f²; **double jump** (second jump velocity 27).
- **Slide:** held input; shrinks hitbox height 190→110 and tilts sprite −20°.
- **Hitbox (decoupled from sprite):** x=270, w=110, h=190 (run) / 110 (slide).
- **Entities** (move left at game speed): 
  - `crate` 96×112 pink/ink stripes (jump over)
  - `crate2` 96×224 blue/ink stripes (double-jump)
  - `banner` "ON AIR" hanging sign, gap of 150px below it (must slide; running height collides)
  - `fish` 44×34 (+100 pts), rows of 5 at ground level or arcs over crates
  - `bone` gold fishbone (+500 pts), rare, high arc (needs double jump)
- **Energy:** starts 100, drains 0.033/frame (~50s run); obstacle hit −12 + 70-frame invincibility (sprite flashes); energy 0 → run ends → Result after 0.7s.
- **Score** = floor(distance_px/10) + fish×100 + bone×500. Distance display = px/100 (meters).
- Floating `+100`/`+500`/`−12` popups rise 90px and fade (0.72s).
- Keyboard: Space/↑/W jump · ↓/S slide (hold) · Esc/P pause.

**⚠ Tuning notes from the owner:** base speed 13 px/f ramping to 22 felt **too fast** — make `BASE_SPEED`, `MAX_SPEED`, ramp distance, spawn interval (55–125f), and energy drain all configurable constants and retune downward.

### 4. Pause overlay (`data-screen-label="Pause"`)
- Dim `rgba(13,10,22,.78)` + blur(5px) over frozen gameplay.
- Centered 620px light panel; **angry RLanz art** (`rlanz-mad.png`, 330px) overlapping the top edge.
- "PAUSED" 56px + Thai "พักเบรกแป๊บนึง… อย่าหนีไปไหนนะ!" (Mali).
- BGM / SFX toggle pills (mock state: both on).
- Buttons: **RESUME ▶** (pink, full width) → unpause; **RETRY ↺** (gold) → restart run; **MAP** (slate) → Stage Map.

### 5. Result (`data-screen-label="Result"`)
- Night bg + pink radial glow; RLanz bust at right edge (~760px).
- 780px light panel (offset left to clear the art): pink ribbon header "RUN COMPLETE!" (≥1 star) / "RUN OVER…" (0 stars) overlapping top, rotated −2°.
- **Stars row:** 3 large ★ (88px; middle raised + 1.2× scale); earned = gold w/ glow, unearned = `#cdc7da`. Thresholds: ≥1,500 pts = 1★, ≥4,500 = 2★, ≥9,000 = 3★.
- Score table (dashed dividers): DISTANCE (m) / FISH ×N / GOLD FISHBONE ×N / **TOTAL** (58px pink) + rotated gold "NEW BEST!" badge when applicable.
- Thai encouragement line, then buttons: **RETRY ↺** (pink, wider) / **MAP** (slate).
- Best score persists (`localStorage` key `cookie-rlanz-best` in the prototype — use real save system in production).

## Interactions & Behavior (flow)
```
Title ─tap→ Stage Map ─PLAY/node→ Gameplay ─energy 0→ Result
Gameplay ─pause btn/Esc→ Pause ─resume→ Gameplay
Pause/Result ─retry→ Gameplay (fresh run) · ─map→ Stage Map
```
- Stage scales uniformly to fit viewport (letterbox on `#0f0c18`), transform-origin top-left.
- Animations: float 4.5s, pulse 1.6s, bounce 1.5s, star twinkle ~3s, run-bob 0.34s alternate (grounded only), all ease-in-out.

## State Management
- `screen: title | map | game | result`, `paused: bool`
- Run state: `started, over, t, speed, dist, fish, bone, energy, py, vy, jumps, grounded, sliding, inv(incibility frames)`, entity list, fx list, spawn timer
- Persistent: best score; (future) wallet fish/fishbone, per-stage stars, settings (BGM/SFX)

## Assets (in `assets/`)
| File | Source | Production note |
|---|---|---|
| `rlanz-bust.png` | Cropped from owner's VTuber model render | Title/Result art — final OK. **As runner sprite: placeholder → replace with 8-bit sprite sheet (run/jump/slide)** |
| `rlanz-mad.png` | Owner's model, angry expression | Pause panel art |
| `rlanz-avatar.png` | Head crop | HUD + map avatar |

Icons (fish, gold fishbone, padlock, stars ★, arrows ▲▼) are drawn in simple inline SVG/CSS — recreate as game-native sprites or keep as vectors.

## Files
- `Cookie RLanz.dc.html` — all 5 screens + playable gameplay reference (open in browser; bottom-left SCREENS switcher is mockup-only)
- `assets/` — character art (above)
