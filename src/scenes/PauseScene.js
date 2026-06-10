import Phaser from 'phaser';
import { COLORS, FONTS } from '../config.js';
import { lightPanel, makeButton, BTN, ensureRoundRect, font } from '../ui.js';

// Transparent overlay launched on top of a paused GameScene (which supplies
// the camera blur). Dim + light panel with angry RLanz art poking above it.
export default class PauseScene extends Phaser.Scene {
  constructor() {
    super('Pause');
  }

  create() {
    this.add.rectangle(0, 0, 1920, 1080, 0x0d0a16, 0.78).setOrigin(0);

    // Prototype: flex-centered panel (center y=540), padding 170/48/44, 16px
    // column gaps, auto height (~600). Measure content, then size the panel.
    const PAD_TOP = 170;
    const PAD_BOTTOM = 44;
    const GAP = 16;
    const BORDER = 5;

    const pausedText = this.add
      .text(0, 0, 'PAUSED', font(56, 700, FONTS.ui, COLORS.ink))
      .setOrigin(0.5, 0)
      .setLetterSpacing(6);
    const thaiText = this.add
      .text(0, 0, 'พักเบรกแป๊บนึง… อย่าหนีไปไหนนะ!', font(27, 600, FONTS.thai, '#4a4358'))
      .setOrigin(0.5, 0);

    const toggleH = 46;
    const resumeH = 84; // 16+16 padding + 36px line + 2*4 border
    const rowH = 72; // 14+14 padding + 30px line + 2*4 border

    const contentH =
      pausedText.height + GAP + thaiText.height + GAP + toggleH + GAP + resumeH + GAP + rowH;
    const panelH = BORDER + PAD_TOP + contentH + PAD_BOTTOM + BORDER;

    const panel = lightPanel(this, 960, 540, 620, panelH, { radius: 32, shadowH: 12 });
    const top = -panelH / 2;

    // rlanz-mad overlaps the top edge: 330px tall, top 180px above the panel.
    const art = this.add.image(0, top - 180, 'rlanz-mad').setOrigin(0.5, 0);
    art.setScale(330 / art.height);
    panel.add(art);

    let y = top + BORDER + PAD_TOP;
    pausedText.setPosition(0, y);
    panel.add(pausedText);
    y += pausedText.height + GAP;

    thaiText.setPosition(0, y);
    panel.add(thaiText);
    y += thaiText.height + GAP;

    // BGM / SFX toggles — visual mocks per the handoff (no audio system yet).
    const bgm = this.makeToggle('BGM');
    const sfx = this.makeToggle('SFX');
    const totalW = bgm.pillW + 18 + sfx.pillW;
    bgm.setPosition(-totalW / 2 + bgm.pillW / 2, y + toggleH / 2);
    sfx.setPosition(totalW / 2 - sfx.pillW / 2, y + toggleH / 2);
    panel.add([bgm, sfx]);
    y += toggleH + GAP;

    panel.add(
      makeButton(this, 0, y + resumeH / 2, {
        w: 524,
        h: resumeH,
        radius: 20,
        borderW: 4,
        shadowH: 7,
        fill: BTN.pink,
        label: 'RESUME ▶',
        fontSize: 36,
        letterSpacing: 4,
        onClick: () => this.resumeGame(),
      })
    );
    y += resumeH + GAP;

    panel.add(
      makeButton(this, -135, y + rowH / 2, {
        w: 254,
        h: rowH,
        radius: 20,
        borderW: 4,
        shadowH: 7,
        fill: BTN.gold,
        label: 'RETRY ↺',
        fontSize: 30,
        letterSpacing: 2,
        color: '#3a2a10',
        onClick: () => {
          this.scene.stop('Game');
          this.scene.start('Game');
        },
      })
    );
    panel.add(
      makeButton(this, 135, y + rowH / 2, {
        w: 254,
        h: rowH,
        radius: 20,
        borderW: 4,
        shadowH: 7,
        fill: BTN.slate,
        label: 'MAP',
        fontSize: 30,
        letterSpacing: 2,
        onClick: () => {
          this.scene.stop('Game');
          this.scene.start('Map');
        },
      })
    );

    this.input.keyboard.on('keydown-ESC', () => this.resumeGame());
    this.input.keyboard.on('keydown-P', () => this.resumeGame());
  }

  resumeGame() {
    this.scene.stop();
    this.scene.resume('Game');
  }

  // #eae6f2 pill, label, pink knob with white dot at its right (mock = ON).
  makeToggle(label) {
    const c = this.add.container(0, 0);
    const text = this.add.text(0, 0, label, font(22, 600, FONTS.ui, COLORS.ink)).setOrigin(0, 0.5);
    const padX = 22;
    const h = 46;
    const w = padX * 2 + text.width + 10 + 46;
    const bgKey = ensureRoundRect(this, {
      w,
      h,
      radius: h / 2,
      fill: COLORS.togglePillBg,
      borderW: 3,
    });
    c.add(this.add.image(0, 0, bgKey).setDisplaySize(w, h));
    text.setPosition(-w / 2 + padX, -1);
    c.add(text);
    const knobKey = ensureRoundRect(this, { w: 46, h: 26, radius: 13, fill: COLORS.pink, borderW: 2 });
    const knobX = w / 2 - padX - 23;
    c.add(this.add.image(knobX, 0, knobKey).setDisplaySize(46, 26));
    c.add(this.add.circle(knobX + 12, 0, 9, 0xffffff));
    c.pillW = w;
    return c;
  }
}
