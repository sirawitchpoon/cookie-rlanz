import Phaser from 'phaser';
import { COLORS, FONTS } from '../config.js';
import {
  addNightBg,
  lightPanel,
  chunkyRect,
  makeButton,
  BTN,
  font,
  strokedText,
  drawDashedLine,
  formatNum,
} from '../ui.js';

// Result screen. Pure display: GameScene computes and persists the run stats
// (score/fish/bone/dist/stars/best/newBest) and passes them via scene data.

const PANEL_W = 780;
const PANEL_CX = 860; // prototype: flex-centered 780px card with margin-left:-200px → spans x 470..1250
const PANEL_CY = 540;
const PAD_X = 56; // panel padding: 90px 56px 46px
const PAD_TOP = 90;
const PAD_BOT = 46;
const BORDER_W = 5; // panel border, drawn inside PANEL_W/panelH
const GAP = 10; // flex column gap

const STAT_ROW_H = 50; // 10px padding + 30px line + 10px padding
const DIVIDER = 3; // dashed border-bottom under the first three rows

export default class ResultScene extends Phaser.Scene {
  constructor() {
    super('Result');
  }

  init(data) {
    this.run = {
      score: 0,
      fish: 0,
      bone: 0,
      dist: 0, // meters, already divided by GameScene
      stars: 0,
      best: 0,
      newBest: false,
      ...(data || {}),
    };
  }

  create() {
    const res = this.run;

    addNightBg(this);
    this.add.image(0, 0, 'glow-result').setOrigin(0);

    // RLanz bust pinned bottom-right (CSS: right:60px; bottom:-70px; height:760px).
    const bust = this.add.image(1860, 1150, 'rlanz-bust').setOrigin(1, 1).setAlpha(0.97);
    bust.setScale(760 / bust.height);

    // Panel height computed from the content blocks below (CSS flex column).
    const blocksH =
      (10 + 88 + 6) + // stars row (margin 10/6, 88px glyphs, line-height 1)
      (STAT_ROW_H + DIVIDER) * 3 + // DISTANCE / FISH / GOLD FISHBONE
      (16 + 58 + 4) + // TOTAL row (padding 16/8/4, 58px score line)
      34 + // Thai encouragement line
      (14 + 78) + // buttons row (margin-top 14)
      GAP * 6;
    const panelH = BORDER_W + PAD_TOP + blocksH + PAD_BOT + BORDER_W;
    const panelTop = PANEL_CY - panelH / 2;
    const innerL = PANEL_CX - PANEL_W / 2 + BORDER_W + PAD_X;
    const innerR = PANEL_CX + PANEL_W / 2 - BORDER_W - PAD_X;

    lightPanel(this, PANEL_CX, PANEL_CY, PANEL_W, panelH, { radius: 34, shadowH: 13 });

    this.addRibbon(res.stars >= 1 ? 'RUN COMPLETE!' : 'RUN OVER…', panelTop);

    let y = panelTop + BORDER_W + PAD_TOP;

    // --- Stars row ---
    this.addStarsRow(y + 10 + 44, res.stars);
    y += 10 + 88 + 6 + GAP;

    // --- Score table ---
    const rows = [
      { label: 'DISTANCE', value: `${formatNum(res.dist)} m` },
      { label: 'FISH', icon: 'icon-fish', iw: 36, ih: 25, value: `× ${formatNum(res.fish)}` },
      { label: 'GOLD FISHBONE', icon: 'icon-bone-dark', iw: 38, ih: 23, value: `× ${formatNum(res.bone)}` },
    ];
    for (const row of rows) {
      this.addStatRow(y, innerL, innerR, row);
      y += STAT_ROW_H + DIVIDER + GAP;
    }

    // --- TOTAL row ---
    const totalCY = y + 16 + 29;
    this.add
      .text(innerL + 8, totalCY, 'TOTAL', font(34, 700, FONTS.ui, COLORS.ink))
      .setOrigin(0, 0.5)
      .setLetterSpacing(3);
    const score = this.add
      .text(innerR - 8, totalCY, formatNum(res.score), font(58, 700, FONTS.ui, COLORS.pink))
      .setOrigin(1, 0.5);
    score.setShadow(0, 4, 'rgba(33,28,43,.18)', 0, false, true);
    if (res.newBest) this.addNewBestBadge(innerR - 8 - score.width - 16, totalCY);
    y += 16 + 58 + 4 + GAP;

    // --- Thai encouragement ---
    this.add
      .text(PANEL_CX, y + 17, 'เก่งมาก! กลับมาวิ่งใหม่อีกรอบนะ~', font(24, 600, FONTS.thai, COLORS.slate))
      .setOrigin(0.5);
    y += 34 + GAP;

    // --- Buttons (flex 1.4 : 1 of inner width 658, gap 18) ---
    const btnCY = y + 14 + 39;
    makeButton(this, innerL + 373 / 2, btnCY, {
      w: 373,
      h: 78,
      radius: 20,
      borderW: 4,
      shadowH: 8,
      fill: BTN.pink,
      label: 'RETRY ↺',
      fontSize: 36,
      letterSpacing: 4,
      onClick: () => this.scene.start('Game'),
    });
    makeButton(this, innerR - 267 / 2, btnCY, {
      w: 267,
      h: 78,
      radius: 20,
      borderW: 4,
      shadowH: 8,
      fill: BTN.slate,
      label: 'MAP',
      fontSize: 36,
      letterSpacing: 3,
      textDrop: 0, // prototype's MAP button has no text-shadow
      onClick: () => this.scene.start('Map'),
    });
  }

  // Pink ribbon overlapping the panel top edge, rotated -2°.
  addRibbon(title, panelTop) {
    const t = this.add
      .text(0, -2, title, font(44, 700, FONTS.ui, '#ffffff'))
      .setOrigin(0.5)
      .setLetterSpacing(5);
    t.setShadow(0, 3, 'rgba(0,0,0,.25)', 0, false, true);
    const w = Math.ceil(t.width) + 128; // padding 60×2 + border 4×2
    const h = Math.ceil(t.height) + 36; // padding 14×2 + border 4×2
    // CSS top:-44 is measured from the padding box, which starts BORDER_W inside
    // the panel's border box: ribbon top = panelTop + BORDER_W - 44 = panelTop - 39.
    const ribbon = chunkyRect(this, PANEL_CX, panelTop - 39 + h / 2, {
      w,
      h,
      radius: 999,
      fill: BTN.pink,
      borderW: 4,
      shadowH: 7,
    });
    ribbon.add(t);
    ribbon.setRotation(Phaser.Math.DegToRad(-2));
  }

  // Three 88px ★ glyphs, 26px gaps; the middle one raised 16px and 1.2× scale.
  addStarsRow(cy, earnedCount) {
    const stars = [0, 1, 2].map((i) => {
      const earned = i < earnedCount;
      return strokedText(this, 0, cy, '★', {
        size: 88,
        weight: 400,
        color: earned ? COLORS.goldStar : COLORS.starUnearned,
        strokePx: 0,
        dropY: 5,
        dropColor: earned ? COLORS.ink : 'rgba(33,28,43,.25)',
        glow: earned ? { color: 'rgba(255,215,110,.6)', blur: 28, y: 0 } : null,
      });
    });
    const step = stars[0].main.width + 26;
    stars.forEach((s, i) => {
      s.x = PANEL_CX + (i - 1) * step;
      if (i === 1) {
        s.y = cy - 16;
        s.setScale(1.2);
      }
    });
  }

  // One score-table row + dashed divider beneath it.
  addStatRow(rowTop, innerL, innerR, { label, icon, iw, ih, value }) {
    const cy = rowTop + STAT_ROW_H / 2;
    let lx = innerL + 8;
    if (icon) {
      this.add.image(lx + iw / 2, cy, icon).setDisplaySize(iw, ih);
      lx += iw + 12;
    }
    this.add
      .text(lx, cy, label, font(30, 600, FONTS.ui, COLORS.slate))
      .setOrigin(0, 0.5)
      .setLetterSpacing(2);
    this.add.text(innerR - 8, cy, value, font(30, 700, FONTS.ui, COLORS.ink)).setOrigin(1, 0.5);
    drawDashedLine(this.add.graphics(), innerL, rowTop + STAT_ROW_H + DIVIDER / 2, innerR);
  }

  // Rotated gold "NEW BEST!" pill; rightX = its right edge (16px gap to score).
  addNewBestBadge(rightX, cy) {
    const t = this.add
      .text(0, -1, 'NEW BEST!', font(22, 700, FONTS.ui, '#3a2a10'))
      .setOrigin(0.5)
      .setLetterSpacing(2);
    const w = Math.ceil(t.width) + 42; // padding 18×2 + border 3×2
    const h = Math.ceil(t.height) + 14; // padding 4×2 + border 3×2
    const badge = chunkyRect(this, rightX - w / 2, cy, {
      w,
      h,
      radius: 999,
      fill: COLORS.goldStar,
      borderW: 3,
      shadowH: 4,
    });
    badge.add(t);
    badge.setRotation(Phaser.Math.DegToRad(-3));
  }
}
