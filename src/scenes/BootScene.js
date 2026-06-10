import Phaser from 'phaser';
import { COLORS } from '../config.js';
import { generateTextures } from '../textures.js';

// Loads art, waits for the Google fonts (Fredoka/Mali) so no text renders in a
// fallback face, generates all procedural textures, then starts the Title
// screen. Dev shortcut: ?screen=title|map|game|pause|result jumps straight to
// a screen (result/pause get sample data) — handy for design QA; not player
// -facing chrome.
export default class BootScene extends Phaser.Scene {
  constructor() {
    super('Boot');
  }

  preload() {
    this.cameras.main.setBackgroundColor(COLORS.letterbox);
    this.load.image('rlanz-bust', 'assets/rlanz-bust.png');
    this.load.image('rlanz-mad', 'assets/rlanz-mad.png');
    this.load.image('rlanz-avatar', 'assets/rlanz-avatar.png');
  }

  create() {
    this.loadFonts().then(() => {
      generateTextures(this);
      this.startFirstScene();
    });
  }

  async loadFonts() {
    const wanted = [
      '400 32px Fredoka',
      '500 32px Fredoka',
      '600 32px Fredoka',
      '700 32px Fredoka',
      '500 32px Mali',
      '600 32px Mali',
      '700 32px Mali',
    ];
    const timeout = new Promise((resolve) => setTimeout(resolve, 3000));
    try {
      await Promise.race([Promise.all(wanted.map((f) => document.fonts.load(f))), timeout]);
      await Promise.race([document.fonts.ready, timeout]);
    } catch {
      /* fall back to system fonts */
    }
  }

  startFirstScene() {
    const screen = new URLSearchParams(location.search).get('screen');
    switch (screen) {
      case 'map':
        this.scene.start('Map');
        break;
      case 'game':
        this.scene.start('Game');
        break;
      case 'pause':
        this.scene.start('Game', { startPaused: true });
        break;
      case 'result':
        this.scene.start('Result', {
          score: 12450,
          fish: 86,
          bone: 3,
          dist: 842,
          stars: 3,
          best: 12450,
          newBest: true,
        });
        break;
      default:
        this.scene.start('Title');
    }
  }
}
