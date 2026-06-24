import { PLAYER_LIVES, PLAYER_HP } from '../config/constants.js';
import { getLevelConfig } from '../config/levels.js'; // 🆕 вместо LEVEL_MAPS

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

        this.materials = [];
        this.flameStreams = [];

        this.score = 0;
        this.lives = PLAYER_LIVES;
        this.playerHp = PLAYER_HP;
        this.level = 1;
        this.enemyCount = 0;
        this.maxEnemies = getLevelConfig(1).maxEnemies;

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
            star: { active: false, endTime: 0, duration: 0 },
            explosive: { active: false, endTime: 0, duration: 0 }
        };

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
    }
}