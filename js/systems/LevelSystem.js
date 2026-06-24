import { TILE_SIZE, GRID_SIZE, DIRECTIONS } from '../config/constants.js';
import { getLevelConfig } from '../config/levels.js';
import { Tank } from '../entities/Tank.js';
import { Wall } from '../entities/Wall.js';
import { Bush, Water, Base } from '../entities/Environment.js';
import { LevelGenerator } from './LevelGenerator.js';

export class LevelSystem {
    constructor(state, canvas) {
        this.state = state;
        this.canvas = canvas;
        this.generator = new LevelGenerator();
    }

    load(levelIndex = null) {
        const s = this.state;
        s.walls = []; s.enemies = []; s.bullets = [];
        s.bushes = []; s.waters = []; s.bonuses = [];

        const idx = levelIndex ?? (s.level - 1);
        const config = getLevelConfig(s.level); // 🆕 динамический конфиг
        s.maxEnemies = config.maxEnemies;

        const map = this.generator.generate(s.level);

        let baseX = 0, baseY = 0;
        let playerX = -1, playerY = -1;

        for (let row = 0; row < GRID_SIZE; row++) {
            const line = map[row] || '';
            for (let col = 0; col < GRID_SIZE; col++) {
                const ch = line[col] || '.';
                const x = col * TILE_SIZE, y = row * TILE_SIZE;
                switch (ch) {
                    case '#': s.walls.push(new Wall(x, y, 'brick')); break;
                    case '=': s.walls.push(new Wall(x, y, 'steel')); break;
                    case '@': s.walls.push(new Wall(x, y, 'fortified')); break;
                    case '~': s.waters.push(new Water(x, y)); break;
                    case '*': s.bushes.push(new Bush(x, y)); break;
                    case 'B':
                        if (baseX === 0 && baseY === 0) {
                            baseX = x; baseY = y;
                        }
                        break;
                    case 'P':
                        playerX = x + (TILE_SIZE - 24) / 2;
                        playerY = y + (TILE_SIZE - 24) / 2;
                        break;
                }
            }
        }

        if (baseX || baseY) s.base = new Base(baseX, baseY);

        if (playerX === -1 || playerY === -1) {
            playerX = this.canvas.width / 2 - 12;
            playerY = this.canvas.height - TILE_SIZE * 4;
        }

        s.player = new Tank(playerX, playerY, DIRECTIONS.UP, true);
        s.player.spawnInvincible = 2000;
    }

    get currentLevelConfig() {
        return getLevelConfig(this.state.level);
    }

    get hasNextLevel() {
        return true;
    }
}