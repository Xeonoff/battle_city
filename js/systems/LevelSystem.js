import { TILE_SIZE, GRID_SIZE, DIRECTIONS } from '../config/constants.js';
import { LEVEL_MAPS } from '../config/levels.js';
import { Tank } from '../entities/Tank.js';
import { Wall } from '../entities/Wall.js';
import { Bush, Water, Base } from '../entities/Environment.js';

export class LevelSystem {
    constructor(state, canvas) {
        this.state = state;
        this.canvas = canvas;
    }

    load(levelIndex = null) {
        const s = this.state;
        s.walls = []; s.enemies = []; s.bullets = [];
        s.bushes = []; s.waters = []; s.bonuses = [];

        const idx = levelIndex ?? (s.level - 1);
        const data = LEVEL_MAPS[Math.min(idx, LEVEL_MAPS.length - 1)];
        s.maxEnemies = data.maxEnemies;

        let baseX = 0, baseY = 0;
        let playerX = 0, playerY = 0;

        for (let row = 0; row < GRID_SIZE; row++) {
            const line = data.map[row] || '';
            for (let col = 0; col < GRID_SIZE; col++) {
                const ch = line[col] || '.';
                const x = col * TILE_SIZE, y = row * TILE_SIZE;
                switch (ch) {
                    case '#': s.walls.push(new Wall(x, y, 'brick')); break;
                    case '=': s.walls.push(new Wall(x, y, 'steel')); break;
                    case '@': s.walls.push(new Wall(x, y, 'fortified')); break;
                    case '~': s.waters.push(new Water(x, y)); break;
                    case '*': s.bushes.push(new Bush(x, y)); break;
                    case 'B': baseX = x; baseY = y; break;
                    case 'P':
                        playerX = x + (TILE_SIZE - 24) / 2;
                        playerY = y + (TILE_SIZE - 24) / 2;
                        break;
                }
            }
        }

        if (baseX || baseY) s.base = new Base(baseX, baseY);
        if (!playerX && !playerY) {
            playerX = this.canvas.width / 2 - 12;
            playerY = this.canvas.height - TILE_SIZE * 4;
        }
        s.player = new Tank(playerX, playerY, DIRECTIONS.UP, true);
        s.player.spawnInvincible = 2000;
    }

    get currentLevelData() {
        return LEVEL_MAPS[Math.min(this.state.level - 1, LEVEL_MAPS.length - 1)];
    }

    get hasNextLevel() {
        return this.state.level < LEVEL_MAPS.length;
    }
}