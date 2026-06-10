import Phaser from 'phaser';
import { C, COLORS, TUNING, HITBOX, LAYOUT, SCORE, FONTS, starsForScore } from '../config.js';
import {
  addNightBg,
  addStars,
  STARS,
  addMoon,
  chunkyRect,
  ensureRoundRect,
  pressify,
  darkPill,
  currencyChip,
  strokedText,
  font,
  formatNum,
} from '../ui.js';
import { submitScore } from '../save.js';
import { RUN_FRAMES, RUN_FPS, FRAME_H } from '../pixelRunner.js';

const STEP_MS = 1000 / 60;
const GROUND = LAYOUT.GROUND_H;
const SPRITE_SCALE = 6; // integer scale keeps the pixel art crisp (~204px tall)
const FEET_Y = 1080 - GROUND + 6; // ground top + 6 (matches the prototype's foot anchor)
const PLAYER_CX = HITBOX.x + HITBOX.w / 2; // sprite centered over the (decoupled) hitbox

// Playable core. Fixed 60fps simulation ported from the prototype's DCLogic
// (step/spawn/jump/endRun), tunables from TUNING. The runner sprite is the
// placeholder bust per the handoff — collision never derives from the visual.
export default class GameScene extends Phaser.Scene {
  constructor() {
    super('Game');
  }

  init(data) {
    this.startPaused = !!(data && data.startPaused);
  }

  create() {
    // Fresh run state every (re)start — never in field initializers.
    this.g = {
      started: false,
      over: false,
      t: 0,
      speed: TUNING.BASE_SPEED,
      dist: 0,
      fish: 0,
      bone: 0,
      energy: 100,
      py: 0,
      vy: 0,
      jumps: 0,
      grounded: true,
      sliding: false,
      inv: 0,
      ents: [],
      spawnIn: 70,
    };
    this.acc = 0;
    this.elapsed = 0;
    this._blur = null;
    this._score = -1;
    this._fish = -1;
    this._dist = -1;
    this._energyW = -1;
    this._energyLow = false;
    this.dispEnergy = this.g.energy; // displayed energy (CSS: transition width .2s linear)

    this.defineAnims();
    this.buildWorld();
    this.buildHud();
    this.buildTouchControls();
    this.bindInput();

    this.events.off(Phaser.Scenes.Events.RESUME);
    this.events.on(Phaser.Scenes.Events.RESUME, () => {
      if (this._blur) {
        this.cameras.main.postFX.remove(this._blur);
        this._blur = null;
      }
      this.hint.setVisible(!this.g.started);
    });

    this.updateVisuals(0);
    this.updateHud(0);

    if (this.startPaused) this.openPause(); // dev shortcut ?screen=pause
  }

  // Animations live on the global AnimationManager — create once.
  defineAnims() {
    const mk = (key, frames, frameRate, repeat) => {
      if (this.anims.exists(key)) return;
      this.anims.create({
        key,
        frames: frames.map((f) => ({ key: 'rlanz-run', frame: f })),
        frameRate,
        repeat,
      });
    };
    mk('rlanz-run', RUN_FRAMES, RUN_FPS, -1);
    mk('rlanz-jump', ['jump'], 1, 0);
    mk('rlanz-fall', ['fall'], 1, 0);
    mk('rlanz-slide', ['slide'], 1, 0);
    mk('rlanz-idle', ['run0'], 1, 0);
  }

  // -------------------------------------------------------------------------
  // World (back → front)
  // -------------------------------------------------------------------------

  buildWorld() {
    addNightBg(this);
    addStars(this, STARS.game, 3000);
    addMoon(this, 1615, 145, 130);

    // Parallax silhouettes (CSS: 1200px per 36s / 18s; lane dashes 1.1s).
    this.farTiles = this.add
      .tileSprite(0, 1080 - GROUND - 340, 1920, 340, 'silhouette-far')
      .setOrigin(0)
      .setAlpha(0.75);
    this.nearTiles = this.add
      .tileSprite(0, 1080 - GROUND - 210, 1920, 210, 'silhouette-near')
      .setOrigin(0);

    this.add.rectangle(0, 1080, 1920, GROUND, C.ground).setOrigin(0, 1);
    this.add.image(0, 1080 - GROUND - 6, 'ground-glow').setOrigin(0, 1).setDisplaySize(1920, 48);
    this.add.rectangle(0, 1080 - GROUND, 1920, 6, C.pink).setOrigin(0, 1);
    this.laneTiles = this.add.tileSprite(0, 1080 - 96 - 10, 1920, 10, 'lane-dashes').setOrigin(0);

    this.shadow = this.add.image(262, 1080 - 126, 'player-shadow').setOrigin(0, 1);
    // Animated 8-bit RLanz sprite. Bottom-center origin so the feet stay
    // planted; collision uses HITBOX and never reads this sprite.
    this.player = this.add
      .sprite(PLAYER_CX, FEET_Y, 'rlanz-run', 'run0')
      .setOrigin(0.5, 1)
      .setScale(SPRITE_SCALE);
    this.playerAnim = '';

    // Entities render over the player (matches the prototype's paint order).
    this.entLayer = this.add.container(0, 0);
    this.fxLayer = this.add.container(0, 0);
  }

  // -------------------------------------------------------------------------
  // HUD
  // -------------------------------------------------------------------------

  buildHud() {
    // Top-left: pause · avatar · energy. Row centerline y=84 (top margin 34).
    const pauseBtn = chunkyRect(this, 82, 84, {
      w: 84,
      h: 84,
      radius: 22,
      fill: 'rgba(16,12,28,.74)',
      borderW: 4,
      shadowH: 5,
    });
    const barKey = ensureRoundRect(this, { w: 11, h: 36, radius: 5, fill: '#ffffff' });
    pauseBtn.add(this.add.image(-10.5, 0, barKey).setDisplaySize(11, 36));
    pauseBtn.add(this.add.image(10.5, 0, barKey).setDisplaySize(11, 36));
    pressify(this, pauseBtn, () => this.openPause());

    this.add.circle(188, 89, 46, C.ink); // 0 5px 0 ink drop under the avatar
    this.add.image(188, 84, 'avatar-white').setDisplaySize(92, 92);

    const label = this.add
      .text(252, 50, 'ENERGY', font(19, 600, FONTS.ui, 'rgba(255,255,255,.65)'))
      .setOrigin(0, 0)
      .setLetterSpacing(3);
    const barCy = 50 + label.height + 5 + 18;
    const barShadowKey = ensureRoundRect(this, { w: 520, h: 36, radius: 18, fill: COLORS.ink });
    const barBgKey = ensureRoundRect(this, {
      w: 520,
      h: 36,
      radius: 18,
      fill: 'rgba(16,12,28,.7)',
      borderW: 4,
    });
    this.add.image(512, barCy + 4, barShadowKey).setDisplaySize(520, 36);
    this.add.image(512, barCy, barBgKey).setDisplaySize(520, 36);
    this.energyBar = { x: 256, y: barCy - 14, w: 512, h: 28 };
    this.energyGfx = this.add.graphics();

    // Top-right: score, then fish chip + distance pill.
    this.scoreText = strokedText(this, 1872, 26, '0', {
      size: 72,
      strokePx: 3,
      dropY: 8,
      originX: 1,
      originY: 0,
    });
    // Distance pill hugs its content (CSS: padding 6 20 + 3px border around
    // 26px text); fitDistPill() sizes it, keeping its right edge at x=1872.
    this.distPill = darkPill(this, 1872, 138, 80, 46);
    this.distText = this.add.text(0, -1, '0m', font(26, 600, FONTS.ui, '#bcd4ff')).setOrigin(0.5);
    this.distPill.add(this.distText);
    this._distPillW = -1;
    // Size the chip pill for realistic counts (3 digits), then show the real 0.
    this.fishChip = currencyChip(this, 1704, 138, 'fish', 888);
    this.fishChip.valueText.setText('0');
    this.fitDistPill();

    this.hint = this.buildHint();
  }

  // Content-size the distance pill (outer = text + padding 40 + 2*3 border),
  // bucketed to 8px steps so ensureRoundRect textures get reused. The fish
  // chip's right edge tracks (pill left - 18), per the prototype's 18px gap.
  fitDistPill() {
    const h = 46;
    const w = Math.ceil((this.distText.width + 46) / 8) * 8;
    if (w === this._distPillW) return;
    this._distPillW = w;
    const faceKey = ensureRoundRect(this, {
      w,
      h,
      radius: h / 2,
      fill: 'rgba(16,12,28,.72)',
      borderW: 3,
    });
    const shadowKey = ensureRoundRect(this, { w, h, radius: h / 2, fill: COLORS.ink });
    this.distPill.face.setTexture(faceKey).setDisplaySize(w, h);
    this.distPill.shadow.setTexture(shadowKey).setDisplaySize(w, h);
    this.distPill.x = 1872 - w / 2;
    this.fishChip.x = 1872 - w - 18;
  }

  buildHint() {
    const c = this.add.container(960, 410);
    const l1 = this.add
      .text(0, 0, 'SPACE / ▲  JUMP  ·  ▼  SLIDE', font(38, 700))
      .setOrigin(0.5)
      .setLetterSpacing(2);
    const l2 = this.add
      .text(0, 0, 'กด JUMP เพื่อเริ่มวิ่ง — เก็บปลา หลบสิ่งกีดขวาง!', font(27, 600, FONTS.thai, '#ffd9ea'))
      .setOrigin(0.5);
    const gap = 8;
    const contentH = l1.height + gap + l2.height;
    const box = chunkyRect(this, 0, 0, {
      w: Math.max(l1.width, l2.width) + 96,
      h: contentH + 52,
      radius: 26,
      fill: 'rgba(16,12,28,.82)',
      borderW: 4,
      shadowH: 8,
    });
    l1.y = -contentH / 2 + l1.height / 2;
    l2.y = contentH / 2 - l2.height / 2;
    c.add([box, l1, l2]);
    this.tweens.add({
      targets: c,
      scaleX: 1.05,
      scaleY: 1.05,
      duration: 800,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
    return c;
  }

  buildTouchControls() {
    this.makeTouchCircle(154, 936, {
      fillColor: 0x7fb1f2,
      fillAlpha: 0.28,
      border: 0x7fb1f2,
      color: '#dcebff',
      glyph: '▼',
      label: 'SLIDE',
      onDown: () => this.slideOn(),
      onUp: () => this.slideOff(),
    });
    this.makeTouchCircle(1766, 936, {
      fillColor: 0xf2589c,
      fillAlpha: 0.32,
      border: 0xf2589c,
      color: '#ffd9ea',
      glyph: '▲',
      label: 'JUMP',
      onDown: () => this.jump(),
    });
  }

  makeTouchCircle(cx, cy, { fillColor, fillAlpha, border, color, glyph, label, onDown, onUp }) {
    const c = this.add.container(cx, cy);
    const drop = this.add.circle(0, 8, 90, 0x000000, 0.4);
    const gfx = this.add.graphics();
    gfx.fillStyle(fillColor, fillAlpha);
    gfx.fillCircle(0, 0, 90);
    gfx.lineStyle(5, border, 1);
    gfx.strokeCircle(0, 0, 87.5);
    // inset 0 4px 18px rgba(255,255,255,.18) — soft white highlight hugging
    // the inner top edge (gfx is a press mover, so it sinks with the button).
    gfx.lineStyle(9, 0xffffff, 0.15);
    gfx.beginPath();
    gfx.arc(0, 0, 76, Math.PI * 1.15, Math.PI * 1.85);
    gfx.strokePath();
    const gl = this.add.text(0, -22, glyph, font(52, 400, FONTS.ui, color)).setOrigin(0.5);
    gl.setShadow(0, 4, 'rgba(0,0,0,.35)', 0, false, true);
    const lb = this.add
      .text(0, 32, label, font(26, 700, FONTS.ui, color))
      .setOrigin(0.5)
      .setLetterSpacing(4);
    c.add([drop, gfx, gl, lb]);
    c.setSize(180, 180);
    c.setInteractive(new Phaser.Geom.Circle(90, 90, 90), Phaser.Geom.Circle.Contains);
    const movers = [gfx, gl, lb];
    let down = false;
    c.on('pointerdown', () => {
      if (down) return;
      down = true;
      movers.forEach((o) => (o.y += 5));
      if (onDown) onDown();
    });
    const release = () => {
      if (!down) return;
      down = false;
      movers.forEach((o) => (o.y -= 5));
      if (onUp) onUp();
    };
    c.on('pointerup', release);
    c.on('pointerout', release);
    return c;
  }

  bindInput() {
    const kb = this.input.keyboard;
    kb.addCapture(['SPACE', 'UP', 'DOWN']);
    const jump = (e) => {
      if (!e.repeat) this.jump();
    };
    kb.on('keydown-SPACE', jump);
    kb.on('keydown-UP', jump);
    kb.on('keydown-W', jump);
    kb.on('keydown-DOWN', () => this.slideOn());
    kb.on('keydown-S', () => this.slideOn());
    kb.on('keyup-DOWN', () => this.slideOff());
    kb.on('keyup-S', () => this.slideOff());
    kb.on('keydown-ESC', () => this.openPause());
    kb.on('keydown-P', () => this.openPause());
  }

  // -------------------------------------------------------------------------
  // Actions
  // -------------------------------------------------------------------------

  jump() {
    const g = this.g;
    if (g.over) return;
    if (!g.started) g.started = true;
    if (g.grounded) {
      g.vy = TUNING.JUMP_V;
      g.grounded = false;
      g.sliding = false;
      g.jumps = 1;
    } else if (g.jumps < 2) {
      g.vy = TUNING.DOUBLE_JUMP_V;
      g.jumps = 2;
    }
  }

  slideOn() {
    const g = this.g;
    if (g.over) return;
    if (!g.started) g.started = true;
    g.sliding = true;
  }

  slideOff() {
    this.g.sliding = false;
  }

  openPause() {
    if (this.g.over) return;
    this.g.sliding = false; // keyup won't be seen while this scene is paused
    this.hint.setVisible(false);
    this._blur = this.cameras.main.postFX?.addBlur(0, 2, 2, 1) ?? null;
    this.scene.launch('Pause');
    this.scene.pause();
  }

  // -------------------------------------------------------------------------
  // Simulation (fixed 60fps timestep)
  // -------------------------------------------------------------------------

  update(time, delta) {
    const g = this.g;
    this.elapsed += delta;

    // Background scroll never stops (matches the CSS animations).
    this.farTiles.tilePositionX += (1200 / 36000) * delta;
    this.nearTiles.tilePositionX += (1200 / 18000) * delta;
    this.laneTiles.tilePositionX += (1200 / 1100) * delta;

    this.acc = Math.min(this.acc + delta, 250);
    while (this.acc >= STEP_MS) {
      this.acc -= STEP_MS;
      if (g.started && !g.over) this.step(g);
    }

    this.updateVisuals(delta);
    this.updateHud(delta);
  }

  step(g) {
    g.t++;
    const range = TUNING.MAX_SPEED - TUNING.BASE_SPEED;
    g.speed = TUNING.BASE_SPEED + Math.min(range, (g.dist / TUNING.SPEED_RAMP_DIST) * range);
    g.dist += g.speed;
    g.energy -= TUNING.ENERGY_DRAIN;
    if (g.inv > 0) g.inv--;

    if (!g.grounded) {
      g.vy -= TUNING.GRAVITY;
      g.py += g.vy;
      if (g.py <= 0) {
        g.py = 0;
        g.vy = 0;
        g.grounded = true;
        g.jumps = 0;
      }
    }

    if (--g.spawnIn <= 0) {
      this.spawn(g);
      g.spawnIn =
        TUNING.SPAWN_MIN +
        Math.random() * (TUNING.SPAWN_MAX - TUNING.SPAWN_MIN) -
        Math.min(TUNING.SPAWN_RAMP_REDUCE, (g.dist / TUNING.SPAWN_RAMP_DIST) * TUNING.SPAWN_RAMP_REDUCE);
    }

    for (const e of g.ents) {
      e.x -= g.speed;
      e.obj.x = e.x;
    }
    g.ents = g.ents.filter((e) => {
      const keep = e.x > -400 && !e.dead;
      if (!keep) e.obj.destroy();
      return keep;
    });

    const px = HITBOX.x;
    const pw = HITBOX.w;
    const ph = g.sliding && g.grounded ? HITBOX.hSlide : HITBOX.hRun;
    const pyv = g.py;
    for (const e of g.ents) {
      if (e.dead) continue;
      const hit = px < e.x + e.w && px + pw > e.x && pyv < e.y + e.h && pyv + ph > e.y;
      if (!hit) continue;
      if (e.type === 'fish') {
        e.dead = true;
        e.obj.destroy();
        g.fish++;
        this.addFx(e.x, e.y + 60, '+' + SCORE.FISH, '#8db8f5');
      } else if (e.type === 'bone') {
        e.dead = true;
        e.obj.destroy();
        g.bone++;
        this.addFx(e.x, e.y + 60, '+' + SCORE.BONE, '#ffd76e');
      } else if (g.inv <= 0) {
        g.inv = TUNING.INV_FRAMES;
        g.energy -= TUNING.ENERGY_HIT;
        this.addFx(px + 40, pyv + 220, '-' + TUNING.ENERGY_HIT, '#ff6b5e');
      }
    }

    if (g.energy <= 0) {
      g.energy = 0;
      this.endRun(g);
    }
  }

  spawn(g) {
    const X = LAYOUT.SPAWN_X;
    const push = (e) => {
      e.obj = this.makeEntity(e);
      g.ents.push(e);
    };
    const r = Math.random();
    if (r < 0.24) push({ type: 'crate', x: X, y: 0, w: 96, h: 112 });
    else if (r < 0.4) push({ type: 'crate2', x: X, y: 0, w: 96, h: 224 });
    else if (r < 0.6) push({ type: 'banner', x: X, y: 150, w: 150, h: 790 });
    else if (r < 0.8) {
      for (let i = 0; i < 5; i++) push({ type: 'fish', x: X + i * 112, y: 34, w: 44, h: 34 });
    } else {
      const ys = [110, 205, 258, 205, 110];
      for (let i = 0; i < 5; i++) push({ type: 'fish', x: X + i * 95, y: ys[i], w: 44, h: 34 });
      push({ type: 'crate', x: X + 190, y: 0, w: 96, h: 112 });
      if (Math.random() < 0.35) push({ type: 'bone', x: X + 5 * 95 + 240, y: 300, w: 52, h: 30 });
    }
  }

  makeEntity(e) {
    const groundY = 1080 - GROUND;
    let obj;
    if (e.type === 'fish') {
      obj = this.add.image(e.x, groundY - e.y, 'icon-fish').setOrigin(0, 1).setDisplaySize(44, 34);
    } else if (e.type === 'bone') {
      obj = this.add.image(e.x, groundY - e.y, 'icon-bone').setOrigin(0, 1).setDisplaySize(52, 30);
      if (obj.preFX) obj.preFX.addGlow(0xe9c878, 4, 0); // WebGL only
    } else if (e.type === 'crate' || e.type === 'crate2') {
      // Crate textures bake a 6px hard drop shadow below the body — extend the
      // display 6px down so the BODY bottom still sits at ground top (y=940).
      // Collision (e.w/e.h) is unaffected.
      obj = this.add
        .image(e.x, groundY + 6, e.type === 'crate' ? 'crate-pink' : 'crate-blue')
        .setOrigin(0, 1)
        .setDisplaySize(e.w, e.h + 6);
    } else {
      obj = this.makeBanner(e);
    }
    this.entLayer.add(obj);
    return obj;
  }

  // "ON AIR" hanging sign: pole from the top of the screen, sign at the
  // bottom with a 150px slide gap beneath (the sim's e.y/e.h covers collision).
  makeBanner(e) {
    const c = this.add.container(e.x, 0);
    const signBottom = 1080 - (GROUND + e.y);
    const top = signBottom - e.h;
    const cx = e.w / 2;
    c.add(this.add.rectangle(cx, top, 14, e.h - 96, C.ink).setOrigin(0.5, 0));
    c.add(this.add.rectangle(cx, top, 8, e.h - 96, 0x37304c).setOrigin(0.5, 0));
    c.add(this.add.image(cx, signBottom, 'banner-sign').setOrigin(0.5, 1).setDisplaySize(150, 96));
    const label = this.add.text(0, 0, 'ON AIR', font(27, 700)).setOrigin(0, 0.5);
    label.setShadow(0, 2, 'rgba(0,0,0,.3)', 0, false, true);
    const cy = signBottom - 48;
    const startX = cx - (15 + 10 + label.width) / 2;
    c.add(this.add.image(startX + 7.5, cy, 'onair-dot').setDisplaySize(39, 39));
    label.setPosition(startX + 25, cy - 1);
    c.add(label);
    return c;
  }

  addFx(x, y, text, color) {
    // Prototype popups: plain bold text with a hard drop (text-shadow 0 3px 0
    // ink) — no outline.
    const t = this.add
      .text(x, 1080 - (GROUND + y), text, font(36, 700, FONTS.ui, color))
      .setOrigin(0, 1);
    t.setShadow(0, 3, COLORS.ink, 0, false, true);
    this.fxLayer.add(t);
    this.tweens.add({
      targets: t,
      y: t.y - 90,
      alpha: 0,
      duration: 720,
      ease: 'Cubic.easeOut',
      onComplete: () => t.destroy(),
    });
  }

  endRun(g) {
    if (g.over) return;
    g.over = true;
    this.time.delayedCall(700, () => {
      const score = Math.floor(g.dist / SCORE.DIST_DIV) + g.fish * SCORE.FISH + g.bone * SCORE.BONE;
      const stars = starsForScore(score);
      const { best, newBest } = submitScore(score);
      this.scene.start('Result', {
        score,
        fish: g.fish,
        bone: g.bone,
        dist: Math.floor(g.dist / SCORE.METER_DIV),
        stars,
        best,
        newBest,
      });
    });
  }

  // -------------------------------------------------------------------------
  // Per-frame visuals + HUD
  // -------------------------------------------------------------------------

  updateVisuals(delta) {
    const g = this.g;
    const sliding = g.sliding && g.grounded;

    // Pick the animation from the run state.
    let anim;
    if (!g.grounded) anim = g.vy > 0 ? 'rlanz-jump' : 'rlanz-fall';
    else if (sliding) anim = 'rlanz-slide';
    else if (g.started) anim = 'rlanz-run';
    else anim = 'rlanz-idle';
    if (anim !== this.playerAnim) {
      this.playerAnim = anim;
      this.player.play(anim, true);
    }

    // Small run-bob on top of the leg animation (CSS rl-bob ≈ 680ms cycle).
    const bob =
      g.grounded && !sliding && g.started
        ? -6 * (0.5 - 0.5 * Math.cos((2 * Math.PI * this.elapsed) / 680))
        : 0;
    this.player.x = PLAYER_CX;
    this.player.y = FEET_Y - g.py + bob;
    const flash = g.inv > 0 && Math.floor(g.t / 4) % 2 === 0;
    this.player.setAlpha(flash ? 0.35 : 1);

    const sh = Math.max(0.45, 1 - g.py / 420);
    this.shadow.setDisplaySize(180 * sh, 28 * sh);

    this.hint.setVisible(!g.started);
  }

  updateHud(delta = 0) {
    const g = this.g;
    const score = Math.floor(g.dist / SCORE.DIST_DIV) + g.fish * SCORE.FISH + g.bone * SCORE.BONE;
    if (score !== this._score) {
      this._score = score;
      this.scoreText.setText(formatNum(score));
    }
    if (g.fish !== this._fish) {
      this._fish = g.fish;
      this.fishChip.valueText.setText(formatNum(g.fish));
    }
    const dist = Math.floor(g.dist / SCORE.METER_DIV);
    if (dist !== this._dist) {
      this._dist = dist;
      this.distText.setText(formatNum(dist) + 'm');
      this.fitDistPill();
    }
    // Displayed energy chases the real value at 12 energy per 200ms, matching
    // the prototype's `transition: width .2s linear` on the fill.
    const maxStep = (12 / 200) * delta;
    this.dispEnergy += Phaser.Math.Clamp(g.energy - this.dispEnergy, -maxStep, maxStep);
    this.drawEnergy();
  }

  drawEnergy() {
    const g = this.g;
    const bar = this.energyBar;
    let w = (bar.w * Math.max(0, this.dispEnergy)) / 100;
    if (g.energy > 0) w = Math.max(w, bar.h); // keep a visible pill while alive
    w = Math.round(Math.min(w, bar.w));
    const low = g.energy < TUNING.ENERGY_LOW;
    if (w === this._energyW && low === this._energyLow) return;
    this._energyW = w;
    this._energyLow = low;
    this.energyGfx.clear();
    if (w > 0) {
      const top = low ? 0xff8d7a : 0xff9ec9;
      const bottom = low ? 0xe8452f : 0xf2589c;
      this.energyGfx.fillGradientStyle(top, top, bottom, bottom, 1);
      this.energyGfx.fillRoundedRect(bar.x, bar.y, w, bar.h, 14);
    }
  }
}
