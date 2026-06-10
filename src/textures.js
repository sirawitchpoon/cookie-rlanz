// Procedural texture generation. Everything the prototype drew with CSS
// gradients / inline SVG is rasterized here once at boot, so scenes only deal
// with plain Phaser images. Icon-scale art is drawn oversized (2–4x) and
// displayed at design size for crispness.

import { COLORS } from './config.js';

function canvas(scene, key, w, h) {
  if (scene.textures.exists(key)) return null;
  const tex = scene.textures.createCanvas(key, w, h);
  return tex;
}

export function roundRectPath(ctx, x, y, w, h, r) {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

function makeNightBg(scene) {
  const tex = canvas(scene, 'bg-night', 1920, 1080);
  if (!tex) return;
  const ctx = tex.getContext();
  const g = ctx.createLinearGradient(0, 0, 0, 1080);
  g.addColorStop(0, COLORS.bgTop);
  g.addColorStop(0.55, COLORS.bgMid);
  g.addColorStop(1, COLORS.bgBottom);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 1920, 1080);
  tex.refresh();
}

function makeMapVignette(scene) {
  const tex = canvas(scene, 'vignette-map', 1920, 420);
  if (!tex) return;
  const ctx = tex.getContext();
  const g = ctx.createLinearGradient(0, 0, 0, 420);
  g.addColorStop(0, 'rgba(43,35,68,0)');
  g.addColorStop(0.4, '#2b2344');
  g.addColorStop(1, '#241d39');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 1920, 420);
  tex.refresh();
}

function makeResultGlow(scene) {
  const tex = canvas(scene, 'glow-result', 1920, 1080);
  if (!tex) return;
  const ctx = tex.getContext();
  // radial-gradient(ellipse at 50% 30%, rgba(242,88,156,.16), transparent 60%)
  ctx.save();
  ctx.translate(960, 324);
  ctx.scale(1.6, 1);
  const g = ctx.createRadialGradient(0, 0, 0, 0, 0, 720);
  g.addColorStop(0, 'rgba(242,88,156,.16)');
  g.addColorStop(1, 'rgba(242,88,156,0)');
  ctx.fillStyle = g;
  ctx.fillRect(-1200, -1200, 2400, 2400);
  ctx.restore();
  tex.refresh();
}

function makeMoon(scene) {
  // 170px body + glow halo baked in (CSS: 0 0 90px 30px rgba(255,217,234,.28)).
  const size = 410;
  const tex = canvas(scene, 'moon', size, size);
  if (!tex) return;
  const ctx = tex.getContext();
  const cx = size / 2;
  const halo = ctx.createRadialGradient(cx, cx, 70, cx, cx, 205);
  halo.addColorStop(0, 'rgba(255,217,234,.28)');
  halo.addColorStop(1, 'rgba(255,217,234,0)');
  ctx.fillStyle = halo;
  ctx.fillRect(0, 0, size, size);
  // body: radial-gradient(circle at 38% 34%, #fff3f9, #ffd9ea 60%, #f5b8d6)
  const bx = cx - 85 + 0.38 * 170;
  const by = cx - 85 + 0.34 * 170;
  const body = ctx.createRadialGradient(bx, by, 6, bx, by, 150);
  body.addColorStop(0, '#fff3f9');
  body.addColorStop(0.6, '#ffd9ea');
  body.addColorStop(1, '#f5b8d6');
  ctx.fillStyle = body;
  ctx.beginPath();
  ctx.arc(cx, cx, 85, 0, Math.PI * 2);
  ctx.fill();
  tex.refresh();
}

function makeGlowCircle(scene, key, d, rgb, alpha) {
  const tex = canvas(scene, key, d, d);
  if (!tex) return;
  const ctx = tex.getContext();
  const r = d / 2;
  const g = ctx.createRadialGradient(r, r, 0, r, r, r);
  g.addColorStop(0, `rgba(${rgb},${alpha})`);
  g.addColorStop(0.88, `rgba(${rgb},${alpha})`);
  g.addColorStop(1, `rgba(${rgb},0)`);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, d, d);
  tex.refresh();
}

function makeFloorGlow(scene) {
  const tex = canvas(scene, 'floor-glow', 560, 60);
  if (!tex) return;
  const ctx = tex.getContext();
  ctx.save();
  ctx.translate(280, 30);
  ctx.scale(1, 60 / 560);
  const g = ctx.createRadialGradient(0, 0, 0, 0, 0, 280);
  g.addColorStop(0, 'rgba(242,88,156,.22)');
  g.addColorStop(0.7, 'rgba(242,88,156,.16)');
  g.addColorStop(1, 'rgba(242,88,156,0)');
  ctx.fillStyle = g;
  ctx.fillRect(-280, -280, 560, 560);
  ctx.restore();
  tex.refresh();
}

function makePlayerShadow(scene) {
  const tex = canvas(scene, 'player-shadow', 180, 28);
  if (!tex) return;
  const ctx = tex.getContext();
  ctx.save();
  ctx.translate(90, 14);
  ctx.scale(1, 28 / 180);
  const g = ctx.createRadialGradient(0, 0, 0, 0, 0, 90);
  g.addColorStop(0, 'rgba(0,0,0,.42)');
  g.addColorStop(0.7, 'rgba(0,0,0,.34)');
  g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g;
  ctx.fillRect(-90, -90, 180, 180);
  ctx.restore();
  tex.refresh();
}

// Fish icon — viewBox 0 0 40 28, drawn at 4x (160×112). Display at w×h of the
// design usage (e.g. 34×24 chip icon, 44×34 pickup).
function makeFishIcon(scene) {
  const S = 4;
  const tex = canvas(scene, 'icon-fish', 40 * S, 28 * S);
  if (!tex) return;
  const ctx = tex.getContext();
  ctx.scale(S, S);
  ctx.lineWidth = 2;
  ctx.strokeStyle = COLORS.ink;
  // tail: polygon 26,14 38,5 38,23
  ctx.fillStyle = COLORS.blueDeep;
  ctx.beginPath();
  ctx.moveTo(26, 14);
  ctx.lineTo(38, 5);
  ctx.lineTo(38, 23);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  // body: ellipse 15,14 rx13 ry9
  ctx.fillStyle = COLORS.blueSoft;
  ctx.beginPath();
  ctx.ellipse(15, 14, 13, 9, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  // eye
  ctx.fillStyle = COLORS.ink;
  ctx.beginPath();
  ctx.arc(9.5, 12, 2.4, 0, Math.PI * 2);
  ctx.fill();
  tex.refresh();
}

// Fishbone icon — viewBox 0 0 44 24 at 4x. Two colorways: gold chip/pickup
// (#e9c878) and the darker result-row variant (#c9963f).
function makeBoneIcon(scene, key, stroke) {
  const S = 4;
  const tex = canvas(scene, key, 44 * S, 24 * S);
  if (!tex) return;
  const ctx = tex.getContext();
  ctx.scale(S, S);
  ctx.strokeStyle = stroke;
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.arc(7, 12, 5, 0, Math.PI * 2);
  ctx.stroke();
  const lines = [
    [13, 12, 40, 12],
    [19, 12, 25, 5],
    [19, 12, 25, 19],
    [27, 12, 33, 6],
    [27, 12, 33, 18],
  ];
  for (const [x1, y1, x2, y2] of lines) {
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  }
  tex.refresh();
}

// Striped obstacle crates: repeating-linear-gradient(45deg, color 0 16px, #241e34 16px 32px)
// inside a 12px-radius round rect with a 4px ink border, plus the prototype's
// box-shadow 0 6px 0 rgba(0,0,0,.35) baked in (canvas is 6px taller; place the
// image so the crate BODY bottom sits on the ground).
function makeCrate(scene, key, w, h, stripe) {
  const S = 2;
  const SHADOW = 6;
  const tex = canvas(scene, key, w * S, (h + SHADOW) * S);
  if (!tex) return;
  const ctx = tex.getContext();
  ctx.scale(S, S);
  // hard drop shadow: the border-box shape offset +6y, drawn under the body
  ctx.fillStyle = 'rgba(0,0,0,.35)';
  roundRectPath(ctx, 0, SHADOW, w, h, 12);
  ctx.fill();
  roundRectPath(ctx, 2, 2, w - 4, h - 4, 12);
  ctx.save();
  ctx.clip();
  // 45° stripes, 16px period each color
  ctx.fillStyle = '#241e34';
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = stripe;
  const period = 32 * Math.SQRT2; // stripe pair measured along x after 45° rotation
  ctx.save();
  ctx.translate(w / 2, h / 2);
  ctx.rotate(Math.PI / 4);
  const ext = Math.max(w, h) * 1.5;
  for (let x = -ext; x < ext; x += period) {
    ctx.fillRect(x, -ext, 16 * Math.SQRT2, ext * 2);
  }
  ctx.restore();
  ctx.restore();
  ctx.lineWidth = 4;
  ctx.strokeStyle = COLORS.ink;
  roundRectPath(ctx, 2, 2, w - 4, h - 4, 12);
  ctx.stroke();
  tex.refresh();
}

// "ON AIR" hanging sign face (150×96 design) — gradient + ink border. The
// blinking dot and label text are scene objects layered on top.
function makeBannerSign(scene) {
  const S = 2;
  const w = 150;
  const h = 96;
  const tex = canvas(scene, 'banner-sign', w * S, h * S);
  if (!tex) return;
  const ctx = tex.getContext();
  ctx.scale(S, S);
  const g = ctx.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, '#ff7eb8');
  g.addColorStop(1, COLORS.pink);
  ctx.fillStyle = g;
  roundRectPath(ctx, 2, 2, w - 4, h - 4, 14);
  ctx.fill();
  ctx.lineWidth = 4;
  ctx.strokeStyle = COLORS.ink;
  roundRectPath(ctx, 2, 2, w - 4, h - 4, 14);
  ctx.stroke();
  tex.refresh();
}

// Red "on air" dot with glow (box-shadow 0 0 10px #ff2d2d).
function makeOnAirDot(scene) {
  const S = 2;
  const d = 39; // 15px dot + 12px glow each side
  const tex = canvas(scene, 'onair-dot', d * S, d * S);
  if (!tex) return;
  const ctx = tex.getContext();
  ctx.scale(S, S);
  const c = d / 2;
  const halo = ctx.createRadialGradient(c, c, 3, c, c, c);
  halo.addColorStop(0, 'rgba(255,45,45,.9)');
  halo.addColorStop(1, 'rgba(255,45,45,0)');
  ctx.fillStyle = halo;
  ctx.fillRect(0, 0, d, d);
  ctx.fillStyle = '#ff2d2d';
  ctx.beginPath();
  ctx.arc(c, c, 7.5, 0, Math.PI * 2);
  ctx.fill();
  tex.refresh();
}

// Circle-cropped avatar with ring border, from the loaded rlanz-avatar image.
function makeAvatarRing(scene, key, size, ringColor, ringW) {
  const S = 2;
  const tex = canvas(scene, key, size * S, size * S);
  if (!tex) return;
  const ctx = tex.getContext();
  ctx.scale(S, S);
  const src = scene.textures.get('rlanz-avatar').getSourceImage();
  const c = size / 2;
  ctx.fillStyle = COLORS.bgTop; // matches prototype's background:#332b52 behind the crop
  ctx.beginPath();
  ctx.arc(c, c, c - ringW / 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.save();
  ctx.beginPath();
  ctx.arc(c, c, c - ringW / 2, 0, Math.PI * 2);
  ctx.clip();
  ctx.drawImage(src, 0, 0, size, size);
  ctx.restore();
  ctx.lineWidth = ringW;
  ctx.strokeStyle = ringColor;
  ctx.beginPath();
  ctx.arc(c, c, c - ringW / 2, 0, Math.PI * 2);
  ctx.stroke();
  tex.refresh();
}

// Parallax silhouette strips, taken verbatim from the prototype's
// repeating-linear-gradient stops. Each is one pattern period wide and gets
// tiled by a TileSprite.
function makeSilhouette(scene, key, period, h, spans) {
  const tex = canvas(scene, key, period, h);
  if (!tex) return;
  const ctx = tex.getContext();
  for (const [from, to, color] of spans) {
    ctx.fillStyle = color;
    ctx.fillRect(from, 0, to - from, h);
  }
  tex.refresh();
}

function makeLaneDashes(scene) {
  const tex = canvas(scene, 'lane-dashes', 220, 10);
  if (!tex) return;
  const ctx = tex.getContext();
  ctx.fillStyle = 'rgba(255,255,255,.22)';
  ctx.fillRect(0, 0, 80, 10);
  tex.refresh();
}

// Soft pink glow strip above the ground's neon edge (box-shadow 0 -6 24).
function makeGroundGlow(scene) {
  const tex = canvas(scene, 'ground-glow', 8, 48);
  if (!tex) return;
  const ctx = tex.getContext();
  const g = ctx.createLinearGradient(0, 0, 0, 48);
  g.addColorStop(0, 'rgba(242,88,156,0)');
  g.addColorStop(1, 'rgba(242,88,156,.35)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 8, 48);
  tex.refresh();
}

export function generateTextures(scene) {
  makeNightBg(scene);
  makeMapVignette(scene);
  makeResultGlow(scene);
  makeMoon(scene);
  makeGlowCircle(scene, 'glow-pink-circle', 760, '242,88,156', 0.1);
  makeGlowCircle(scene, 'glow-blue-circle', 620, '127,177,242', 0.1);
  makeFloorGlow(scene);
  makePlayerShadow(scene);
  makeFishIcon(scene);
  makeBoneIcon(scene, 'icon-bone', COLORS.fishbone);
  makeBoneIcon(scene, 'icon-bone-dark', '#c9963f');
  makeCrate(scene, 'crate-pink', 96, 112, COLORS.pink);
  makeCrate(scene, 'crate-blue', 96, 224, COLORS.blue);
  makeBannerSign(scene);
  makeOnAirDot(scene);
  makeAvatarRing(scene, 'avatar-white', 92, '#ffffff', 4);
  makeAvatarRing(scene, 'avatar-gold', 96, COLORS.goldStar, 4);
  // far silhouettes: 600px period, 340px tall, opacity applied by the scene
  makeSilhouette(scene, 'silhouette-far', 600, 340, [
    [0, 110, '#262040'],
    [190, 310, '#2b2448'],
    [380, 470, '#242038'],
  ]);
  // near silhouettes: 480px period, 210px tall
  makeSilhouette(scene, 'silhouette-near', 480, 210, [
    [0, 150, '#1c1730'],
    [230, 330, '#1f1a35'],
  ]);
  makeLaneDashes(scene);
  makeGroundGlow(scene);
}
