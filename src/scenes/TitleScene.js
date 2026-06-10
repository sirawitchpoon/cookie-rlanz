import Phaser from 'phaser';
import { COLORS, FONTS, VERSION_LINE } from '../config.js';
import { WALLET } from '../save.js';
import {
  addNightBg,
  addStars,
  STARS,
  addMoon,
  ensureRoundRect,
  chunkyRect,
  makeButton,
  BTN,
  strokedText,
  currencyChip,
  font,
} from '../ui.js';

// Title screen (handoff: data-screen-label="Title"). Logo column on the left,
// floating character art on the right, wallet chips top-right. Tapping
// anywhere goes to the Stage Map.
export default class TitleScene extends Phaser.Scene {
  constructor() {
    super('Title');
  }

  create() {
    addNightBg(this);
    addStars(this, STARS.title);
    addMoon(this, 1495, 175, 170);

    // Huge blurred color circles (~10% opacity baked into the textures).
    this.add.image(200, 960, 'glow-pink-circle');
    this.add.image(1730, 110, 'glow-blue-circle');

    // Wallet chips with + buy buttons, laid out right-to-left from x=1872.
    const boneChip = currencyChip(this, 1872, 61, 'bone', WALLET.bone, { plus: true });
    currencyChip(this, 1872 - boneChip.chipW - 16, 61, 'fish', WALLET.fish, { plus: true });

    // Character art: bottom-right (right:110, bottom:-50), 930px tall,
    // floating 0 → -18px over a 4.5s cycle.
    const bust = this.add.image(1810, 1130, 'rlanz-bust').setOrigin(1, 1);
    bust.setScale(930 / bust.height);
    // Prototype: filter:drop-shadow(0 36px 50px rgba(0,0,0,.55)). WebGL-only
    // Shadow FX (preFX is undefined on the Canvas renderer): light above the
    // art (negative y) smears a soft ~0.55 black shadow downward.
    if (bust.preFX) {
      bust.preFX.setPadding(48);
      bust.preFX.addShadow(0.5, -1, 0.04, 0.55, 0x000000, 12, 1);
    }
    this.tweens.add({
      targets: bust,
      y: 1130 - 18,
      duration: 2250,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
    this.add.image(1470, 1014, 'floor-glow');

    this.buildLeftColumn();

    this.add
      .text(40, 1080 - 26, VERSION_LINE, font(20, 400, FONTS.ui, 'rgba(255,255,255,.45)'))
      .setOrigin(0, 1)
      .setLetterSpacing(1);

    this.input.once('pointerdown', () => this.scene.start('Map'));
  }

  // Logo column at x=140, top=220, 24px flow gaps.
  buildLeftColumn() {
    const x = 140;

    // "COOKIE" pill, rotated -3°.
    const cookieText = this.add
      .text(0, -1, 'COOKIE', font(38, 700, FONTS.ui, '#3a1226'))
      .setOrigin(0.5)
      .setLetterSpacing(8);
    // CSS content-box: outer = padding box (textW+72 x 62) + 2*4px border.
    // chunkyRect draws the border inside w/h, so the 36px side padding holds.
    const pillBorder = 4;
    const pillW = Math.ceil(cookieText.width) + 72 + pillBorder * 2;
    const pillH = 62 + pillBorder * 2;
    const pill = chunkyRect(this, x + pillW / 2, 220 + pillH / 2, {
      w: pillW,
      h: pillH,
      radius: pillH / 2,
      fill: { top: COLORS.pinkPale, bottom: COLORS.pink },
      borderW: pillBorder,
      shadowH: 6,
    });
    pill.add(cookieText);
    pill.setRotation(Phaser.Math.DegToRad(-3));

    // "RLANZ" wordmark — 190px type on a tight .92 line box (~175px tall).
    strokedText(this, x, 306 + 175 / 2, 'RLANZ', {
      size: 190,
      weight: 700,
      letterSpacing: 2,
      color: '#ffffff',
      strokePx: 5,
      dropY: 14,
      glow: { color: 'rgba(242,88,156,.5)', blur: 44, y: 22 },
      originX: 0,
      originY: 0.5,
    });

    // Divider bars + Thai tagline, 16px gaps.
    const rowCy = 531;
    const bar = (cx, fill) =>
      this.add
        .image(cx, rowCy, ensureRoundRect(this, { w: 80, h: 8, radius: 4, fill }))
        .setDisplaySize(80, 8);
    bar(x + 40, COLORS.pink);
    const tagline = this.add
      .text(x + 80 + 16, rowCy, 'วิ่งเก็บปลา ฝ่าเมืองยามค่ำคืน ไปกับแมวเงิน RLanz', font(30, 600, FONTS.thai, COLORS.mutedLight))
      .setOrigin(0, 0.5);
    bar(x + 80 + 16 + tagline.width + 16 + 40, COLORS.blue);

    // TAP TO START — gold, pulsing 1 ↔ 1.05 over 1.6s. The whole screen is
    // the tap target, so the button itself isn't pressified.
    const measure = this.add
      .text(0, 0, 'TAP TO START', font(44, 700, FONTS.ui, '#3a2a10'))
      .setLetterSpacing(4);
    // CSS content-box: outer = padding box (textW+132 x 92) + 2*5px border,
    // keeping the 66px horizontal padding inside the drawn border.
    const btnBorder = 5;
    const btnW = Math.ceil(measure.width) + 132 + btnBorder * 2;
    measure.destroy();
    const btnH = 92 + btnBorder * 2;
    const btn = makeButton(this, x + btnW / 2, 617 + btnH / 2, {
      w: btnW,
      h: btnH,
      radius: 26,
      borderW: btnBorder,
      shadowH: 9,
      fill: BTN.gold,
      label: 'TAP TO START',
      fontSize: 44,
      color: '#3a2a10',
      letterSpacing: 4,
      textDrop: 0,
    });
    this.tweens.add({
      targets: btn,
      scaleX: 1.05,
      scaleY: 1.05,
      duration: 800,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }
}
