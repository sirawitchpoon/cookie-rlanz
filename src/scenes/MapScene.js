import Phaser from 'phaser';
import { COLORS, C, FONTS } from '../config.js';
import {
  addNightBg,
  addStars,
  STARS,
  darkPill,
  chunkyRect,
  pressify,
  makeButton,
  BTN,
  lightPanel,
  currencyChip,
  ensureRoundRect,
  font,
  formatNum,
  starString,
} from '../ui.js';
import { getBest, WALLET } from '../save.js';

// Stage node anchors from the prototype's mapStages(): each point is the
// container anchor — stars row (30px) + 6px gap sit above the circle, so the
// circle center lands at (px, py - 8 + size/2).
const NODE_PTS = [
  [240, 560],
  [470, 440],
  [740, 540],
  [1010, 380],
  [1270, 470],
  [1500, 330],
  [1700, 520],
];
const EARNED = [3, 2, 3]; // sample progress per the handoff README

// CSS: stroke-dasharray "4 40" (44px period), rl-dash -44px over 2.2s = 20px/s.
const DASH_PERIOD = 44;
const DASH_SPEED = 20; // px per second along the path

export default class MapScene extends Phaser.Scene {
  constructor() {
    super('Map');
  }

  create() {
    addNightBg(this);
    addStars(this, STARS.map, 3400);
    this.add.image(0, 660, 'vignette-map').setOrigin(0);

    this.buildPath();
    this.buildNodes();
    this.buildHeader();
    this.buildStageCard();
  }

  update(_, delta) {
    this.dashOffset = (this.dashOffset + (delta * DASH_SPEED) / 1000) % DASH_PERIOD;
    this.placeDots();
  }

  // -------------------------------------------------------------------------
  // Dashed path (prototype SVG: M240,560 C... — capsule dots crawling along)
  // -------------------------------------------------------------------------

  buildPath() {
    const path = new Phaser.Curves.Path(240, 560);
    path.cubicBezierTo(470, 440, 320, 500, 400, 455);
    path.cubicBezierTo(740, 540, 570, 420, 660, 520);
    path.cubicBezierTo(1010, 380, 840, 565, 930, 400);
    path.cubicBezierTo(1270, 470, 1100, 360, 1190, 455);
    path.cubicBezierTo(1500, 330, 1360, 488, 1420, 340);
    path.cubicBezierTo(1700, 520, 1580, 322, 1640, 470);

    this.pathLength = path.getLength();
    // Arc-length-uniform samples (~4px apart); dots lerp between them.
    const divisions = Math.ceil(this.pathLength / 4);
    this.pathPts = path.getSpacedPoints(divisions);
    this.segLen = this.pathLength / divisions;

    this.dashOffset = 0;
    this.dots = [];
    // SVG dash "4 40" with stroke-width 10 + round caps = a 14×10 capsule.
    const dashKey = ensureRoundRect(this, { w: 14, h: 10, radius: 5, fill: '#ffffff' });
    const n = Math.floor(this.pathLength / DASH_PERIOD) + 1;
    for (let i = 0; i < n; i++) {
      this.dots.push(this.add.image(0, 0, dashKey).setDisplaySize(14, 10).setAlpha(0.35));
    }
    this.placeDots();
  }

  placeDots() {
    const pts = this.pathPts;
    for (let i = 0; i < this.dots.length; i++) {
      const d = (i * DASH_PERIOD + this.dashOffset) % this.pathLength;
      const f = d / this.segLen;
      const i0 = Math.min(Math.floor(f), pts.length - 2);
      const t = f - i0;
      const a = pts[i0];
      const b = pts[i0 + 1];
      this.dots[i]
        .setPosition(a.x + (b.x - a.x) * t, a.y + (b.y - a.y) * t)
        .setRotation(Math.atan2(b.y - a.y, b.x - a.x));
    }
  }

  // -------------------------------------------------------------------------
  // Stage nodes
  // -------------------------------------------------------------------------

  buildNodes() {
    NODE_PTS.forEach(([px, py], i) => {
      const done = i < 3;
      const current = i === 3;
      const locked = i > 3;
      const size = current ? 112 : 88;
      const cy = py - 8 + size / 2;

      const fill = done
        ? { top: '#ff9ec9', bottom: COLORS.pink }
        : current
          ? { top: COLORS.goldLight, bottom: COLORS.gold }
          : COLORS.lockedNode;
      const circle = chunkyRect(this, px, cy, {
        w: size,
        h: size,
        radius: size / 2,
        fill,
        borderW: 4,
        shadowH: 7,
      });

      if (current) {
        // CSS: box-shadow 0 0 0 9px rgba(255,215,110,.3) — halo hugging the
        // circle edge, painted above the ink drop but behind the face.
        const halo = this.add.graphics();
        halo.lineStyle(9, C.goldStar, 0.3);
        halo.strokeCircle(0, 0, size / 2 + 4.5);
        circle.addAt(halo, 1);
      }

      if (locked) {
        circle.add(this.makePadlock());
      } else {
        const num = this.add
          .text(0, 0, String(i + 1), font(42, 700, FONTS.ui, current ? '#3a2a10' : '#ffffff'))
          .setOrigin(0.5)
          .setShadow(0, 3, 'rgba(0,0,0,.3)', 0, false, true);
        circle.add(num);
        pressify(this, circle, () => this.scene.start('Game'));
      }

      if (done) {
        this.add
          .text(px, py - 29, starString(EARNED[i]), font(26, 400, FONTS.ui, COLORS.goldStar))
          .setOrigin(0.5)
          .setLetterSpacing(3)
          .setShadow(0, 3, COLORS.ink, 0, false, true);
      }

      if (current) this.buildYouMarker(px, py);
    });
  }

  /** CSS padlock: 24×19 body (radius 4, sits 4px below center) + arc shackle. */
  makePadlock() {
    const g = this.add.graphics();
    g.fillStyle(C.lockedIcon, 1);
    g.fillRoundedRect(-12, -5.5, 24, 19, 4);
    g.lineStyle(4, C.lockedIcon, 1);
    g.beginPath();
    g.moveTo(-6, -4.5);
    g.lineTo(-6, -8.5);
    g.arc(0, -8.5, 6, Math.PI, Math.PI * 2, false);
    g.lineTo(6, -4.5);
    g.strokePath();
    return g;
  }

  /** Bouncing avatar + YOU tag above the current node (rl-bounce 1.5s). */
  buildYouMarker(px, py) {
    const c = this.add.container(px, 0);
    const avatarY = py - 124;
    c.add(this.add.circle(0, avatarY + 6, 48, C.ink)); // box-shadow 0 6px 0 ink
    c.add(this.add.image(0, avatarY, 'avatar-gold').setDisplaySize(96, 96));

    const label = this.add
      .text(0, 0, 'YOU', font(18, 700, FONTS.ui, '#3a2a10'))
      .setOrigin(0.5)
      .setLetterSpacing(2);
    const tagW = Math.ceil(label.width) + 34; // padding 1px 14px + 3px border
    const tagH = Math.ceil(label.height) + 8;
    const tagKey = ensureRoundRect(this, {
      w: tagW,
      h: tagH,
      radius: tagH / 2,
      fill: COLORS.goldStar,
      borderW: 3,
    });
    const tagCy = py - 72 + tagH / 2; // avatar bottom + 4px gap
    c.add(this.add.image(0, tagCy, tagKey).setDisplaySize(tagW, tagH));
    label.setPosition(0, tagCy - 1);
    c.add(label);

    this.tweens.add({
      targets: c,
      y: -14,
      duration: 750,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  // -------------------------------------------------------------------------
  // Header: BACK pill, episode banner, wallet chips
  // -------------------------------------------------------------------------

  buildHeader() {
    const back = darkPill(this, 40 + 85, 36 + 29, 170, 58, { shadowH: 5 });
    back.add(
      this.add
        .text(0, -1, '‹ BACK', font(28, 600, FONTS.ui, '#ffffff'))
        .setOrigin(0.5)
        .setLetterSpacing(2)
    );
    pressify(this, back, () => this.scene.start('Title'));

    const l1 = this.add
      .text(0, 0, 'EPISODE 1 · MIDNIGHT STREAM CITY', font(36, 700, FONTS.ui, '#13203a'))
      .setOrigin(0.5)
      .setLetterSpacing(3);
    const l2 = this.add
      .text(0, 0, 'เมืองสตรีมยามค่ำคืน — บทแรกของแมวเงิน', font(22, 600, FONTS.thai, '#2b3f63'))
      .setOrigin(0.5);
    const contentH = l1.height + l2.height;
    const bw = Math.ceil(Math.max(l1.width, l2.width)) + 108 + 8; // padding 14/54 + 4px borders
    const bh = Math.ceil(contentH) + 28 + 8;
    const banner = chunkyRect(this, 960, 30 + bh / 2, {
      w: bw,
      h: bh,
      radius: 22,
      fill: { top: '#a8c8f8', bottom: COLORS.blue },
      borderW: 4,
      shadowH: 7,
    });
    l1.setPosition(0, -contentH / 2 + l1.height / 2);
    l2.setPosition(0, contentH / 2 - l2.height / 2);
    banner.add([l1, l2]);

    // Map chips have no "+" buy buttons (unlike Title).
    const bone = currencyChip(this, 1872, 67, 'bone', WALLET.bone);
    currencyChip(this, 1872 - bone.chipW - 16, 67, 'fish', WALLET.fish);
  }

  // -------------------------------------------------------------------------
  // Stage card (bottom-right)
  // -------------------------------------------------------------------------

  buildStageCard() {
    // Content-box CSS: width 580 + padding 34*2 + border 5*2 = 658 outer.
    const panelW = 658;
    const cw = 580; // content width inside the 5px border + 34px side padding
    const gap = 16;

    // Measure content first so the panel height can be computed.
    const tagText = this.add
      .text(0, 0, 'STAGE 1-4', font(26, 700, FONTS.ui, '#ffffff'))
      .setOrigin(0.5)
      .setLetterSpacing(2);
    const tagW = Math.ceil(tagText.width) + 42; // padding 6px 18px + 3px border
    const tagH = Math.ceil(tagText.height) + 18;
    const title = this.add
      .text(0, 0, 'NEON ROOFTOP', font(34, 700, FONTS.ui, COLORS.ink))
      .setOrigin(0, 0.5)
      .setLetterSpacing(1);
    const row1H = Math.max(tagH, title.height);

    const desc = this.add.text(
      0,
      0,
      'วิ่งบนดาดฟ้าย่านนีออน เก็บปลาให้ครบ แล้วระวังป้าย ON AIR — ต้องสไลด์ลอดเท่านั้น!',
      { ...font(24, 600, FONTS.thai, COLORS.panelMuted), wordWrap: { width: cw } }
    );

    const bestLabel = this.add
      .text(0, 0, 'BEST ', font(24, 600, FONTS.ui, COLORS.panelMuted))
      .setOrigin(0, 0.5);
    const bestValue = this.add
      .text(0, 0, formatNum(getBest()), font(24, 700, FONTS.ui, COLORS.pink))
      .setOrigin(0, 0.5);
    const cardStars = this.add
      .text(0, 0, '★★☆', font(24, 400, FONTS.ui, '#ffb02e'))
      .setOrigin(0, 0.5);
    const row3H = Math.max(bestLabel.height, cardStars.height);

    // PLAY button: measured 40px label + padding 18*2 + border 4*2 (≈92).
    const btnProbe = this.add.text(0, 0, 'PLAY ▶', font(40, 700, FONTS.ui, '#ffffff'));
    const btnH = Math.ceil(btnProbe.height) + 36 + 8;
    btnProbe.destroy();

    // Face height = content + padding 28*2 + border 5*2 (content-box).
    const panelH = row1H + desc.height + row3H + btnH + gap * 3 + 56 + 10;
    const cx = 1830 - panelW / 2;
    const cy = 1016 - panelH / 2; // CSS bottom:64 places the border box; 11px shadow overflows to 1027
    lightPanel(this, cx, cy, panelW, panelH, { radius: 28, shadowH: 11 });
    // Texts were created before the panel for measuring — restack them.
    [title, desc, bestLabel, bestValue, cardStars].forEach((t) => this.children.bringToTop(t));

    const left = cx - panelW / 2 + 5 + 34; // face left + border + padding
    let y = cy - panelH / 2 + 5 + 28; // face top + border + padding

    const tag = chunkyRect(this, left + tagW / 2, y + row1H / 2, {
      w: tagW,
      h: tagH,
      radius: 14,
      fill: COLORS.pink,
      borderW: 3,
      shadowH: 4,
    });
    tagText.setPosition(0, -1);
    tag.add(tagText);
    title.setPosition(left + tagW + 14, y + row1H / 2);
    y += row1H + gap;

    desc.setPosition(left, y);
    y += desc.height + gap;

    bestLabel.setPosition(left, y + row3H / 2);
    bestValue.setPosition(left + bestLabel.width, y + row3H / 2);
    cardStars.setPosition(left + bestLabel.width + bestValue.width + 24, y + row3H / 2);
    y += row3H + gap;

    makeButton(this, cx, y + btnH / 2, {
      w: cw,
      h: btnH,
      radius: 20,
      borderW: 4,
      shadowH: 8,
      fill: BTN.pink,
      label: 'PLAY ▶',
      fontSize: 40,
      letterSpacing: 6,
      onClick: () => this.scene.start('Game'),
    });
  }
}
