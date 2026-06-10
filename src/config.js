// Design tokens + gameplay tuning for Cookie RLanz.
// Source of truth: design_handoff_cookie_rlanz/README.md ("Design Tokens", "Gameplay spec").

export const DESIGN_W = 1920;
export const DESIGN_H = 1080;

export const COLORS = {
  ink: '#211c2b',
  panel: '#f7f5fa',
  pink: '#f2589c',
  pinkLight: '#ff8cc0',
  pinkPale: '#ffd9ea',
  blue: '#7fb1f2',
  blueSoft: '#8db8f5',
  blueDeep: '#5e8fe0',
  gold: '#cfa85e',
  goldLight: '#ffe9a8',
  goldStar: '#ffd76e',
  fishbone: '#e9c878',
  bgTop: '#332b52',
  bgMid: '#1d1733',
  bgBottom: '#271e3e',
  ground: '#2c2342',
  slate: '#4a4358',
  lockedNode: '#39334b',
  lockedIcon: '#6b6480',
  mutedLight: '#cfc6e8',
  letterbox: '#0f0c18',
  starUnearned: '#cdc7da',
  panelMuted: '#4a4358',
  dashedDivider: '#d8d2e4',
  togglePillBg: '#eae6f2',
};

// Hex → number for Phaser fill styles.
export const C = Object.fromEntries(
  Object.entries(COLORS).map(([k, v]) => [k, parseInt(v.slice(1), 16)])
);

// ---------------------------------------------------------------------------
// Gameplay tuning. The owner flagged the prototype values (in comments) as
// TOO FAST — these are retuned downward per the handoff README. All speeds in
// design-space px per frame at a fixed 60fps step.
// ---------------------------------------------------------------------------
export const TUNING = {
  BASE_SPEED: 10, // prototype: 13 (too fast)
  MAX_SPEED: 16.5, // prototype: 22 (too fast)
  SPEED_RAMP_DIST: 30000, // px of distance over which speed ramps base→max (prototype: 25000)
  SPAWN_MIN: 70, // min frames between spawns (prototype: 55)
  SPAWN_MAX: 150, // max frames between spawns (prototype: 125)
  SPAWN_RAMP_REDUCE: 25, // frames shaved off the interval at full ramp (prototype: 25)
  SPAWN_RAMP_DIST: 40000, // px of distance over which spawn interval tightens (prototype: 40000)
  ENERGY_DRAIN: 0.028, // energy per frame (~60s run; prototype: 0.033 ≈ 50s)
  ENERGY_HIT: 12, // energy lost per obstacle hit
  ENERGY_LOW: 30, // below this the bar turns red
  INV_FRAMES: 70, // invincibility frames after a hit
  JUMP_V: 30, // first-jump velocity, px/frame
  DOUBLE_JUMP_V: 27, // second-jump velocity, px/frame
  GRAVITY: 1.9, // px/frame²
};

// Player hitbox is DECOUPLED from the sprite visual — keep it that way so the
// production 8-bit sprite sheet can swap in without touching collision.
export const HITBOX = {
  x: 270,
  w: 110,
  hRun: 190,
  hSlide: 110,
};

export const LAYOUT = {
  GROUND_H: 140, // ground block height; ground top at y=940
  PLAYER_X: 240, // sprite left edge
  SPAWN_X: 2100, // entities enter here, move left
};

export const SCORE = {
  FISH: 100,
  BONE: 500,
  DIST_DIV: 10, // score = floor(dist/10) + ...
  METER_DIV: 100, // displayed meters = floor(dist/100)
  STAR_1: 1500,
  STAR_2: 4500,
  STAR_3: 9000,
};

export const FONTS = {
  ui: 'Fredoka',
  thai: 'Mali',
};

export const VERSION_LINE = 'ver 0.1.0 · © 2026 RLanz Ch.';

export const starsForScore = (score) =>
  score >= SCORE.STAR_3 ? 3 : score >= SCORE.STAR_2 ? 2 : score >= SCORE.STAR_1 ? 1 : 0;
