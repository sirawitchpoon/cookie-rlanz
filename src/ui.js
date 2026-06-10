// Shared "chunky candy-noir" UI factory: gradient buttons with hard ink
// shadows and a 3D press, dark translucent pills, light panels, stroked text,
// currency chips, night-sky dressing. All sizes are design-space px
// (1920×1080). Round-rect faces are rasterized at 2x and cached by key.

import Phaser from 'phaser';
import { COLORS, FONTS } from './config.js';
import { roundRectPath } from './textures.js';

const RES = 2; // raster scale for generated round-rects

// ---------------------------------------------------------------------------
// Texture cache
// ---------------------------------------------------------------------------

/**
 * Ensure a round-rect texture exists and return its key.
 * fill: css color string, or { top, bottom } for a vertical gradient.
 */
export function ensureRoundRect(scene, { w, h, radius, fill, borderColor = COLORS.ink, borderW = 0 }) {
  const fillKey = typeof fill === 'string' ? fill : `${fill.top}>${fill.bottom}`;
  const key = `rr:${w}x${h}:r${radius}:f${fillKey}:b${borderW}${borderColor}`;
  if (scene.textures.exists(key)) return key;
  const tex = scene.textures.createCanvas(key, Math.ceil(w * RES), Math.ceil(h * RES));
  const ctx = tex.getContext();
  ctx.scale(RES, RES);
  const inset = borderW / 2 + 0.5;
  const r = Math.min(radius, (h - borderW) / 2);
  if (typeof fill === 'string') {
    ctx.fillStyle = fill;
  } else {
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, fill.top);
    g.addColorStop(1, fill.bottom);
    ctx.fillStyle = g;
  }
  roundRectPath(ctx, inset, inset, w - inset * 2, h - inset * 2, r);
  ctx.fill();
  if (borderW > 0) {
    ctx.lineWidth = borderW;
    ctx.strokeStyle = borderColor;
    roundRectPath(ctx, inset, inset, w - inset * 2, h - inset * 2, r);
    ctx.stroke();
  }
  tex.refresh();
  return key;
}

// ---------------------------------------------------------------------------
// Text
// ---------------------------------------------------------------------------

/** Phaser text style for Fredoka/Mali at a weight. */
export function font(size, weight = 700, family = FONTS.ui, color = '#ffffff') {
  return {
    fontFamily: `${family}, sans-serif`,
    fontStyle: `${weight}`,
    fontSize: `${size}px`,
    color,
  };
}

/**
 * Text with the prototype's faux stroke treatment: 4-direction ink outline
 * (strokePx = the CSS shadow offset) + optional hard ink drop (dropY) +
 * optional soft glow behind. Returns a Container; origin applies to all layers.
 */
export function strokedText(scene, x, y, str, opts = {}) {
  const {
    size = 44,
    weight = 700,
    family = FONTS.ui,
    color = '#ffffff',
    strokePx = 3,
    dropY = 0,
    dropColor = COLORS.ink,
    glow = null, // { color, blur, y }
    letterSpacing = 0,
    originX = 0.5,
    originY = 0.5,
    align = 'center',
  } = opts;
  const c = scene.add.container(x, y);
  const mk = (fill, dy) => {
    const t = scene.add.text(0, dy, str, { ...font(size, weight, family, fill), align });
    t.setOrigin(originX, originY);
    if (letterSpacing) t.setLetterSpacing(letterSpacing);
    t.setStroke(dropColor, strokePx * 2);
    return t;
  };
  if (glow) {
    const g = scene.add.text(0, glow.y ?? 0, str, { ...font(size, weight, family, color), align });
    g.setOrigin(originX, originY);
    if (letterSpacing) g.setLetterSpacing(letterSpacing);
    g.setShadow(0, 0, glow.color, glow.blur, true, true);
    c.add(g);
  }
  if (dropY > 0) c.add(mk(dropColor, dropY));
  const main = mk(color, 0);
  c.add(main);
  c.main = main;
  c.setText = (s) => c.each((t) => t.setText && t.setText(s));
  return c;
}

// ---------------------------------------------------------------------------
// Chunky rects / buttons / pills / panels
// ---------------------------------------------------------------------------

/**
 * Shadowed round-rect (panel/button face). Returns a Container at (x, y) with
 * `.face` (Image) and `.shadowH`; container origin is the CENTER of the face.
 */
export function chunkyRect(scene, x, y, opts) {
  const {
    w,
    h,
    radius = 20,
    fill,
    borderW = 4,
    borderColor = COLORS.ink,
    shadowH = 7,
    shadowColor = COLORS.ink,
  } = opts;
  const c = scene.add.container(x, y);
  const faceKey = ensureRoundRect(scene, { w, h, radius, fill, borderColor, borderW });
  const shadowKey = ensureRoundRect(scene, { w, h, radius, fill: shadowColor });
  const shadow = scene.add.image(0, shadowH, shadowKey).setDisplaySize(w, h);
  const face = scene.add.image(0, 0, faceKey).setDisplaySize(w, h);
  c.add([shadow, face]);
  c.face = face;
  c.shadow = shadow;
  c.shadowH = shadowH;
  c.rectW = w;
  c.rectH = h;
  return c;
}

/**
 * Make a container behave like a pressable button: pointerdown sinks `parts`
 * (default: everything except the shadow) by half the shadow height,
 * pointerup restores and fires onClick.
 */
export function pressify(scene, c, onClick, { parts = null, sink = null } = {}) {
  const movers = parts ?? c.list.filter((o) => o !== c.shadow);
  const dy = sink ?? Math.max(2, Math.round((c.shadowH ?? 7) / 2) + 1);
  const baseY = movers.map((o) => o.y);
  let down = false;
  const release = (fire) => {
    if (!down) return;
    down = false;
    movers.forEach((o, i) => (o.y = baseY[i]));
    if (fire && onClick) onClick();
  };
  c.setSize(c.rectW ?? c.width, c.rectH ?? c.height);
  c.setInteractive({ useHandCursor: true });
  c.on('pointerdown', () => {
    down = true;
    movers.forEach((o, i) => (o.y = baseY[i] + dy));
  });
  c.on('pointerup', () => release(true));
  c.on('pointerout', () => release(false));
  return c;
}

/**
 * Standard chunky button. opts: w, h, label, fontSize, plus chunkyRect opts
 * and text opts. Returns Container with `.label`.
 */
export function makeButton(scene, x, y, opts) {
  const {
    label,
    fontSize = 36,
    weight = 700,
    family = FONTS.ui,
    color = '#ffffff',
    letterSpacing = 2,
    textDrop = 3, // CSS: text-shadow 0 3px 0 rgba(0,0,0,.25)
    onClick,
    ...rect
  } = opts;
  const c = chunkyRect(scene, x, y, { radius: 20, borderW: 4, shadowH: 7, ...rect });
  const t = scene.add.text(0, -2, label, font(fontSize, weight, family, color));
  t.setOrigin(0.5);
  if (letterSpacing) t.setLetterSpacing(letterSpacing);
  if (textDrop) t.setShadow(0, textDrop, 'rgba(0,0,0,.25)', 0, false, true);
  c.add(t);
  c.label = t;
  if (onClick) pressify(scene, c, onClick);
  return c;
}

export const BTN = {
  pink: { top: COLORS.pinkLight, bottom: COLORS.pink },
  gold: { top: COLORS.goldLight, bottom: COLORS.gold },
  slate: COLORS.slate,
  blue: { top: '#a8c8f8', bottom: COLORS.blue },
};

/**
 * Dark translucent pill (chips, BACK button, hint box). Returns chunkyRect
 * container (radius=h/2, 3px ink border, 4px shadow).
 */
export function darkPill(scene, x, y, w, h, opts = {}) {
  return chunkyRect(scene, x, y, {
    w,
    h,
    radius: h / 2,
    fill: opts.fill ?? 'rgba(16,12,28,.72)',
    borderW: opts.borderW ?? 3,
    shadowH: opts.shadowH ?? 4,
  });
}

/** Light panel (#f7f5fa, 5px ink border, deep shadow). */
export function lightPanel(scene, x, y, w, h, { radius = 28, shadowH = 11 } = {}) {
  return chunkyRect(scene, x, y, {
    w,
    h,
    radius,
    fill: COLORS.panel,
    borderW: 5,
    shadowH,
  });
}

// ---------------------------------------------------------------------------
// Currency chips
// ---------------------------------------------------------------------------

/**
 * Fish/bone wallet chip. kind: 'fish' | 'bone'. Returns Container anchored at
 * its RIGHT edge center (so chips can be laid out from the right margin
 * inward); `.chipW` holds the total width. plus=true adds the round buy
 * button (visual only).
 */
export function currencyChip(scene, rightX, cy, kind, value, { plus = false, fontSize = 26 } = {}) {
  const isFish = kind === 'fish';
  const iconKey = isFish ? 'icon-fish' : 'icon-bone';
  const iconW = isFish ? 34 : 36;
  const iconH = isFish ? 24 : 22;
  const valueColor = isFish ? '#ffffff' : '#f3dfae';
  const text = scene.add.text(0, 0, formatNum(value), font(fontSize, 600, FONTS.ui, valueColor)).setOrigin(0, 0.5);
  const padL = 14;
  const padR = plus ? 10 : 22;
  const gap = 10;
  const h = 50;
  const plusW = plus ? 28 + gap : 0;
  const w = padL + iconW + gap + text.width + plusW + padR;
  const c = scene.add.container(rightX, cy);
  const pill = darkPill(scene, -w / 2, 0, w, h);
  c.add(pill);
  const icon = scene.add.image(-w + padL + iconW / 2, 0, iconKey).setDisplaySize(iconW, iconH);
  c.add(icon);
  text.setPosition(-w + padL + iconW + gap, -1);
  c.add(text);
  if (plus) {
    const px = -padR - 14;
    const plusKey = ensureRoundRect(scene, {
      w: 28,
      h: 28,
      radius: 14,
      fill: isFish ? COLORS.pink : COLORS.gold,
      borderW: 2,
    });
    c.add(scene.add.image(px, 0, plusKey).setDisplaySize(28, 28));
    c.add(
      scene.add
        .text(px, -1, '+', font(20, 700, FONTS.ui, isFish ? '#ffffff' : '#3a2a10'))
        .setOrigin(0.5)
    );
  }
  c.chipW = w;
  c.valueText = text;
  return c;
}

export function formatNum(n) {
  return Math.floor(n).toLocaleString('en-US');
}

// ---------------------------------------------------------------------------
// Night-sky dressing
// ---------------------------------------------------------------------------

export function addNightBg(scene) {
  return scene.add.image(0, 0, 'bg-night').setOrigin(0);
}

/**
 * Twinkling star field. pts: [xFrac, yFrac, size, color][]. One alpha tween
 * drives the whole layer (matches the CSS keyframes: .9 ↔ .25).
 */
export function addStars(scene, pts, duration = 3200) {
  const c = scene.add.container(0, 0);
  for (const [fx, fy, size, color] of pts) {
    const dot = scene.add.circle(fx * 1920, fy * 1080, size, Phaser.Display.Color.HexStringToColor(color).color);
    c.add(dot);
  }
  c.setAlpha(0.9);
  scene.tweens.add({ targets: c, alpha: 0.25, duration: duration / 2, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
  return c;
}

/** Star layouts lifted from each screen's CSS background-image stops. */
export const STARS = {
  title: [
    [0.08, 0.18, 2, '#ffffff'],
    [0.23, 0.09, 2, '#ffffff'],
    [0.41, 0.22, 3, '#ffd9ea'],
    [0.64, 0.12, 2, '#ffffff'],
    [0.87, 0.24, 2, '#bcd4ff'],
    [0.52, 0.06, 2, '#ffffff'],
    [0.76, 0.07, 3, '#ffd9ea'],
    [0.33, 0.38, 2, '#bcd4ff'],
  ],
  map: [
    [0.12, 0.14, 2, '#ffffff'],
    [0.34, 0.08, 2, '#ffd9ea'],
    [0.58, 0.16, 2, '#ffffff'],
    [0.81, 0.1, 2, '#bcd4ff'],
  ],
  game: [
    [0.1, 0.16, 2, '#ffffff'],
    [0.3, 0.08, 2, '#ffd9ea'],
    [0.55, 0.18, 2, '#ffffff'],
    [0.78, 0.09, 2, '#bcd4ff'],
    [0.92, 0.22, 2, '#ffffff'],
  ],
};

/** Moon at center (cx, cy), body diameter d (texture bakes in the halo). */
export function addMoon(scene, cx, cy, d = 170) {
  const img = scene.add.image(cx, cy, 'moon');
  img.setScale(d / 170);
  return img;
}

// ---------------------------------------------------------------------------
// Misc
// ---------------------------------------------------------------------------

/** Dashed horizontal line into a Graphics object (result-table dividers). */
export function drawDashedLine(g, x1, y, x2, { dash = 10, gap = 8, width = 3, color = 0xd8d2e4 } = {}) {
  g.fillStyle(color, 1);
  for (let x = x1; x < x2; x += dash + gap) {
    g.fillRect(x, y - width / 2, Math.min(dash, x2 - x), width);
  }
  return g;
}

/** Gold star-row string helper. */
export function starString(n) {
  return '★'.repeat(n);
}
