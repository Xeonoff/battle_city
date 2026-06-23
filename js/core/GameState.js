import { PLAYER_LIVES, PLAYER_HP } from '../config/constants.js';
import { LEVEL_MAPS } from '../config/levels.js';

export class GameState {
    constructor() {
        this.reset();
    }

    reset() {
        this.player = null;
        this.enemies = [];
        this.bullets = [];
        this.walls = [];
        this.bushes = [];
        this.waters = [];
        this.bonuses = [];
        this.base = null;

        // 🆕 Новые сущности
        this.materials = [];
        this.flameStreams = [];

        this.score = 0;
        this.lives = PLAYER_LIVES;
        this.playerHp = PLAYER_HP;
        this.level = 1;
        this.enemyCount = 0;
        this.maxEnemies = LEVEL_MAPS[0].maxEnemies;

        this.gameOver = false;
        this.gameWon = false;
        this.paused = false;

        this.lastCommentTime = 0;
        this.commentCooldown = 20000;
        this.llmEnabled = true;

        this.playerBuffs = {
            shield: { active: false, endTime: 0, duration: 0 },
            triple: { active: false, endTime: 0, duration: 0 },
            ricochet: { active: false, endTime: 0, duration: 0 },
            star: { active: false, endTime: 0, duration: 0 }
        };

        // 🆕 Инвентарь (ссылка устанавливается в main.js)
        this.inventory = null;
    }

    get isRunning() {
        return !this.gameOver && !this.paused;
    }

    preserveForNextLevel(prevState) {
        this.score = prevState.score;
        this.lives = prevState.lives;
        this.playerHp = prevState.playerHp;
        this.level = prevState.level + 1;
        this.llmEnabled = prevState.llmEnabled;
        this.playerBuffs = { ...prevState.playerBuffs };
        this.maxEnemies = LEVEL_MAPS[Math.min(this.level - 1, LEVEL_MAPS.length - 1)].maxEnemies;
    }
}