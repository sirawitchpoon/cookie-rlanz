// Procedural 8-bit pixel-art runner sprite for RLanz (silver-haired cat girl).
// Pure Canvas2D so it can be previewed standalone (tools/sprite-preview.html)
// AND baked into a Phaser texture (see textures.js -> makeRunnerSheet).
//
// The placeholder VTuber bust is replaced by this real animated sprite per the
// handoff README ("8-bit pixel-art sprite, run/jump/slide frames"). The game's
// hitbox stays decoupled (HITBOX in config.js) — nothing here feeds collision.
//
// Each frame is drawn in two silhouette passes (ink outline, then color fill)
// so the whole character gets one cohesive 1px ink outline with no internal
// seams, then a detail pass adds the face, shading and accents.

export const FRAME_W = 28;
export const FRAME_H = 34;
// Sheet frame order. run0..run3 = 4-step run cycle; jump = rising; fall =
// descending; slide = crouched lunge.
export const FRAMES = ['run0', 'run1', 'run2', 'run3', 'jump', 'fall', 'slide'];
export const RUN_FRAMES = ['run0', 'run1', 'run2', 'run3'];
export const RUN_FPS = 14;
export const DISPLAY_H = 212; // on-screen standing height (matches old bust)

const INK = '#211c2b';
const HAIR = '#ece6f8';
const HAIRSH = '#cdc2e6';
const HAIRHI = '#ffffff';
const SKIN = '#ffe2d6';
const SKINSH = '#f4c8ba';
const EYE = '#5e8fe0';
const PINK = '#ff8cc0';
const PINKHOT = '#f2589c';
const BLUE = '#8db8f5';
const JACK = '#f7f5fa';
const JACKSH = '#d9d3e6';
const NAVY = '#2c2342';
const BOOT = '#3a3350';

// ---------------------------------------------------------------------------
// pixel primitives (everything snaps to integers)
// ---------------------------------------------------------------------------

function px(ctx, x, y, w, h, color) {
  ctx.fillStyle = color;
  ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
}

function disc(ctx, cx, cy, r, color) {
  for (let y = -r; y <= r; y++) {
    const w = Math.round(Math.sqrt(Math.max(0, r * r - y * y)));
    px(ctx, cx - w, cy + y, 2 * w + 1, 1, color);
  }
}

// rounded-rect via per-row spans
function rr(ctx, x, y, w, h, rad, color) {
  for (let j = 0; j < h; j++) {
    const d = Math.min(j, h - 1 - j);
    let inset = 0;
    if (d < rad) {
      const k = rad - 1 - d;
      inset = rad - Math.round(Math.sqrt(Math.max(0, rad * rad - k * k)));
    }
    px(ctx, x + inset, y + j, w - 2 * inset, 1, color);
  }
}

// upward triangle (cat ear), apex at (ax, ay), base half-width bw, height hgt
function triUp(ctx, ax, ay, bw, hgt, color) {
  for (let j = 0; j < hgt; j++) {
    const w = Math.round((bw * j) / (hgt - 1 || 1));
    px(ctx, ax - w, ay + j, 2 * w + 1, 1, color);
  }
}

// thick pixel line (limb): square blobs stepped along the segment
function limb(ctx, x0, y0, x1, y1, hw, color) {
  const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0));
  for (let i = 0; i <= n; i++) {
    const t = n === 0 ? 0 : i / n;
    const x = Math.round(x0 + (x1 - x0) * t);
    const y = Math.round(y0 + (y1 - y0) * t);
    px(ctx, x - hw, y - hw, hw * 2 + 1, hw * 2 + 1, color);
  }
}

// ---------------------------------------------------------------------------
// body parts — `ink` mode draws the enlarged silhouette, else the color fill
// ---------------------------------------------------------------------------

const HEADR = 7;

function head(ctx, ink, bx, by, hdx) {
  const hx = bx + 13 + hdx;
  const hy = by + 8;
  if (ink) {
    disc(ctx, hx, hy, HEADR + 1, INK); // hair mass
    disc(ctx, bx + 16 + hdx, by + 10, 4 + 1, INK); // face
    triUp(ctx, bx + 9 + hdx, by - 2, 3, 6, INK); // left ear
    triUp(ctx, bx + 17 + hdx, by - 3, 3, 6, INK); // right ear
    return;
  }
  triUp(ctx, bx + 9 + hdx, by - 2, 3, 6, HAIR);
  triUp(ctx, bx + 17 + hdx, by - 3, 3, 6, HAIR);
  triUp(ctx, bx + 9 + hdx, by + 0, 1, 3, PINK); // inner ear
  triUp(ctx, bx + 17 + hdx, by - 1, 1, 3, PINK);
  disc(ctx, hx, hy, HEADR, HAIR);
  disc(ctx, bx + 16 + hdx, by + 10, 4, SKIN); // face
}

function torso(ctx, ink, bx, by) {
  if (ink) {
    rr(ctx, bx + 8, by + 15, 12, 9, 3, INK); // jacket
    for (let j = 0; j < 5; j++) px(ctx, bx + 7 - j, by + 23 + j, 14 + 2 * j, 1, INK); // skirt flare
    return;
  }
  rr(ctx, bx + 9, by + 16, 10, 7, 3, JACK);
  rr(ctx, bx + 9, by + 16, 4, 7, 3, JACKSH); // jacket back-side shading
  for (let j = 0; j < 4; j++) {
    px(ctx, bx + 8 - j, by + 24 + j, 12 + 2 * j, 1, j === 3 ? PINKHOT : JACK); // pleated skirt
  }
}

function tail(ctx, ink, bx, by) {
  // silver tail curling up behind the back
  const pts = [
    [bx + 8, by + 23],
    [bx + 5, by + 21],
    [bx + 3, by + 17],
    [bx + 3, by + 13],
  ];
  for (let i = 0; i < pts.length - 1; i++) {
    limb(ctx, pts[i][0], pts[i][1], pts[i + 1][0], pts[i + 1][1], ink ? 2 : 1, ink ? INK : HAIRSH);
  }
  if (!ink) disc(ctx, bx + 3, by + 12, 2, HAIR); // fluffy tip
}

function leg(ctx, ink, hip, knee, foot, back) {
  const col = back ? '#2a2440' : NAVY; // dark thigh-high tights; back leg darker
  const boot = back ? '#1d1830' : BOOT;
  if (ink) {
    limb(ctx, hip[0], hip[1], knee[0], knee[1], 2, INK);
    limb(ctx, knee[0], knee[1], foot[0], foot[1], 2, INK);
    px(ctx, foot[0] - 3, foot[1] - 1, 7, 4, INK); // shoe
    return;
  }
  limb(ctx, hip[0], hip[1], knee[0], knee[1], 1, col); // thigh
  limb(ctx, knee[0], knee[1], foot[0], foot[1], 1, boot); // shin (boot)
  px(ctx, foot[0] - 2, foot[1] - 1, 6, 3, boot); // shoe
  px(ctx, foot[0] - 2, foot[1] - 1, 6, 1, back ? boot : PINKHOT); // shoe stripe
}

function arm(ctx, ink, sho, elbow, hand, back) {
  const col = back ? JACKSH : JACK;
  const skin = back ? SKINSH : SKIN;
  if (ink) {
    limb(ctx, sho[0], sho[1], elbow[0], elbow[1], 2, INK);
    limb(ctx, elbow[0], elbow[1], hand[0], hand[1], 2, INK);
    return;
  }
  limb(ctx, sho[0], sho[1], elbow[0], elbow[1], 1, col); // sleeve
  limb(ctx, elbow[0], elbow[1], hand[0], hand[1], 1, col); // sleeve to wrist
  disc(ctx, hand[0], hand[1], 1, skin); // hand
}

// ---------------------------------------------------------------------------
// face + accents (single detail pass, on top of the fills)
// ---------------------------------------------------------------------------

function details(ctx, bx, by, hdx) {
  const fx = bx + 16 + hdx;
  // bangs over the forehead
  px(ctx, bx + 11 + hdx, by + 5, 7, 2, HAIR);
  px(ctx, bx + 12 + hdx, by + 7, 3, 1, HAIR);
  // pink + blue front strands framing the face
  px(ctx, bx + 11 + hdx, by + 7, 1, 6, PINK);
  px(ctx, bx + 20 + hdx, by + 6, 1, 6, BLUE);
  // hair sheen
  px(ctx, bx + 9 + hdx, by + 3, 4, 1, HAIRHI);
  // eye (facing right): ink lash + blue iris + white glint
  px(ctx, fx, by + 9, 3, 1, INK);
  px(ctx, fx, by + 10, 3, 2, EYE);
  px(ctx, fx + 2, by + 10, 1, 1, HAIRHI);
  px(ctx, fx, by + 12, 3, 1, INK);
  // blush + mouth
  px(ctx, fx + 1, by + 12, 2, 1, PINK);
  px(ctx, fx + 3, by + 12, 1, 1, INK);
  // chin shadow
  px(ctx, fx - 1, by + 13, 4, 1, SKINSH);
  // collar ribbon
  px(ctx, bx + 12, by + 15, 5, 2, PINKHOT);
  px(ctx, bx + 14, by + 15, 1, 3, PINKHOT);
}

// ---------------------------------------------------------------------------
// per-frame skeletons
// ---------------------------------------------------------------------------

// joints in body-local px: hip (14,24), shoulder (14,18), feet baseline ~32
const POSES = {
  run0: {
    fLeg: [[14, 24], [18, 27], [20, 31]],
    bLeg: [[14, 24], [10, 27], [8, 30]],
    fArm: [[14, 18], [17, 21], [19, 23]],
    bArm: [[14, 18], [11, 21], [9, 22]],
  },
  run1: {
    dy: -1,
    fLeg: [[14, 24], [15, 28], [14, 32]],
    bLeg: [[14, 24], [12, 26], [13, 28]],
    fArm: [[14, 18], [13, 21], [12, 23]],
    bArm: [[14, 18], [16, 21], [16, 22]],
  },
  run2: {
    fLeg: [[14, 24], [10, 27], [8, 31]],
    bLeg: [[14, 24], [18, 27], [20, 30]],
    fArm: [[14, 18], [11, 21], [9, 23]],
    bArm: [[14, 18], [17, 21], [19, 22]],
  },
  run3: {
    dy: -1,
    fLeg: [[14, 24], [13, 28], [14, 32]],
    bLeg: [[14, 24], [16, 26], [15, 28]],
    fArm: [[14, 18], [16, 21], [17, 23]],
    bArm: [[14, 18], [12, 21], [12, 22]],
  },
  jump: {
    dy: -1,
    fLeg: [[14, 24], [18, 26], [16, 28]],
    bLeg: [[14, 24], [11, 26], [12, 28]],
    fArm: [[14, 18], [17, 15], [19, 13]],
    bArm: [[14, 18], [11, 15], [9, 14]],
  },
  fall: {
    fLeg: [[14, 24], [16, 28], [18, 32]],
    bLeg: [[14, 24], [11, 28], [9, 32]],
    fArm: [[14, 18], [18, 18], [20, 17]],
    bArm: [[14, 18], [10, 18], [8, 17]],
  },
  slide: {
    dy: 5,
    hdx: 2, // lean the head forward
    fLeg: [[14, 24], [19, 26], [23, 27]],
    bLeg: [[14, 24], [11, 27], [9, 28]],
    fArm: [[14, 18], [10, 22], [7, 25]],
    bArm: [[14, 18], [17, 20], [19, 19]],
  },
};

function drawFrame(ctx, name) {
  const p = POSES[name];
  const bx = 0;
  const by = (p.dy || 0);
  const hdx = p.hdx || 0;

  const B = (pt) => off(pt, bx, by);

  // ink silhouette (back → front; head last so the face is never overdrawn)
  tail(ctx, true, bx, by);
  arm(ctx, true, B(p.bArm[0]), B(p.bArm[1]), B(p.bArm[2]), true);
  leg(ctx, true, B(p.bLeg[0]), B(p.bLeg[1]), B(p.bLeg[2]), true);
  torso(ctx, true, bx, by);
  leg(ctx, true, B(p.fLeg[0]), B(p.fLeg[1]), B(p.fLeg[2]), false);
  arm(ctx, true, B(p.fArm[0]), B(p.fArm[1]), B(p.fArm[2]), false);
  head(ctx, true, bx, by, hdx);

  // color fills (same order)
  tail(ctx, false, bx, by);
  arm(ctx, false, B(p.bArm[0]), B(p.bArm[1]), B(p.bArm[2]), true);
  leg(ctx, false, B(p.bLeg[0]), B(p.bLeg[1]), B(p.bLeg[2]), true);
  torso(ctx, false, bx, by);
  leg(ctx, false, B(p.fLeg[0]), B(p.fLeg[1]), B(p.fLeg[2]), false);
  arm(ctx, false, B(p.fArm[0]), B(p.fArm[1]), B(p.fArm[2]), false);
  head(ctx, false, bx, by, hdx);

  // face + accents
  details(ctx, bx, by, hdx);
}

function off(pt, bx, by) {
  return [pt[0] + bx, pt[1] + by];
}

// Draw the whole sheet: FRAMES laid out left→right, each in a FRAME_W cell.
export function drawSheet(ctx) {
  ctx.imageSmoothingEnabled = false;
  FRAMES.forEach((name, i) => {
    ctx.save();
    ctx.translate(i * FRAME_W, 0);
    drawFrame(ctx, name);
    ctx.restore();
  });
}
