import Phaser from 'phaser';
import { DESIGN_W, DESIGN_H, COLORS } from './config.js';
import BootScene from './scenes/BootScene.js';
import TitleScene from './scenes/TitleScene.js';
import MapScene from './scenes/MapScene.js';
import GameScene from './scenes/GameScene.js';
import PauseScene from './scenes/PauseScene.js';
import ResultScene from './scenes/ResultScene.js';

new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'app',
  width: DESIGN_W,
  height: DESIGN_H,
  backgroundColor: COLORS.letterbox,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  input: {
    activePointers: 3, // SLIDE + JUMP simultaneously on touch
  },
  scene: [BootScene, TitleScene, MapScene, GameScene, PauseScene, ResultScene],
});
