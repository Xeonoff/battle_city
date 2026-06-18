import { GameState } from './core/GameState.js';
import { GameLoop } from './core/GameLoop.js';
import { eventBus } from './core/EventBus.js';
import { EVENTS } from './config/constants.js';

import { CollisionSystem } from './systems/CollisionSystem.js';
import { SpawnSystem } from './systems/SpawnSystem.js';
import { BuffSystem, applyBonusEffect } from './systems/BonusSystem.js';
import { LevelSystem } from './systems/LevelSystem.js';
import { ParticleSystem } from './systems/ParticleSystem.js';

import { Renderer } from './rendering/Renderer.js';
import { InputManager } from './input/InputManager.js';
import { TooltipController } from './input/TooltipController.js';
import { LLMService } from './services/LLMService.js';
import { UIManager } from './ui/UIManager.js';
import { AudioManager } from './services/AudioManager.js';
import { LEVEL_MAPS } from './config/levels.js';
import { Tank } from './entities/Tank.js';

export const audioManager = new AudioManager();

class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.state = new GameState();

        this.particles = new ParticleSystem();

        this.renderer = new Renderer(this.canvas, this.state, this.particles);
        this.ui = new UIManager(this.state);
        this.input = new InputManager(this.state, this.canvas);
        this.tooltip = new TooltipController(this.canvas, this.state);
        this.llm = new LLMService(this.state);

        this.levelSystem = new LevelSystem(this.state, this.canvas);
        this.collision = new CollisionSystem(this.state, this.particles);
        this.spawn = new SpawnSystem(this.state, this.canvas);
        this.buffs = new BuffSystem(this.state);

        this.loop = new GameLoop({
            update: (dt) => this.update(dt),
            render: () => this.renderer.render(),
            onFpsUpdate: (fps) => this.ui.updateFps(fps)
        });

        this._bindEvents();
        this._bindUI();
    }

    _bindEvents() {
        eventBus.on(EVENTS.BASE_DESTROYED, () => this._endGame(false));
        eventBus.on(EVENTS.PLAYER_HIT, ({ lives }) => {
            if (lives <= 0) this._endGame(false);
            else this._respawnPlayer();
        });
    }

    _bindUI() {
        this.ui.els.llmBtn.addEventListener('click', () => {
            this.state.llmEnabled = !this.state.llmEnabled;
            this.ui.updateLlmButton(this.state.llmEnabled);
            if (!this.state.llmEnabled) this.ui.hideComment();
        });

        this.ui.els.muteBtn.addEventListener('click', () => {
            const muted = !audioManager.isMuted();
            audioManager.setMuted(muted);
            this.ui.updateMuteButton(muted);
        });
    }

    async start() {
        await audioManager.load();
        this._loadLevel();
        this.loop.start();
        setTimeout(() => this.ui.showComment("Внимание! Защитите базу от вражеских танков!"), 1000);
    }

    _loadLevel() {
        this.levelSystem.load();
        this.renderer.rebuildBackground();
        this.particles.clear();
        this.ui.updateHUD();
    }

    update(dt) {
        // Партиклы обновляются даже после game over (чтобы последние взрывы доыгрались)
        this.particles.update(dt);

        if (!this.state.isRunning) return;

        this.input.poll();
        this.buffs.update();

        if (this.state.player?.isActive) {
            this.state.player.update(dt, this.state);
            if (this.state.player.isMoving) this.state.player.move(dt, this.state);
        }

        this.state.enemies.forEach(e => e.update(dt, this.state));
        this.collision.update(dt);

        this.state.bonuses.forEach(b => b.update(this.state, (bonus) => {
            applyBonusEffect(bonus, this.state, this.particles);
        }));
        this.state.bonuses = this.state.bonuses.filter(b => b.isActive);

        this.spawn.update();

        if (this.state.enemyCount >= this.state.maxEnemies) {
            this._endGame(true);
            return;
        }

        this.ui.updateHUD();

        if (this.llm.shouldComment()) {
            this.llm.requestComment().then(text => {
                if (text && this.state.llmEnabled) this.ui.showComment(text);
            });
        }
    }

    _respawnPlayer() {
        setTimeout(() => {
            if (this.state.gameOver) return;
            this.state.player = new Tank(
                this.canvas.width / 2 - 12,
                this.canvas.height - 26 * 4,
                0, true
            );
            this.state.player.spawnInvincible = 2500;
            this.state.playerBuffs.shield.active = true;
            this.state.playerBuffs.shield.endTime = Date.now() + 3000;
            this.state.playerBuffs.shield.duration = 3000;
        }, 1000);
    }

    _endGame(won) {
        if (this.state.gameOver) return;
        this.state.gameOver = true;
        this.state.gameWon = won;
        this.ui.showGameOver(
            won,
            () => this._nextLevel(),
            () => this._restart()
        );
    }

    _restart() {
        const llm = this.state.llmEnabled;
        this.state.reset();
        this.state.llmEnabled = llm;
        this.ui.hideGameOver();
        this._loadLevel();
    }

    _nextLevel() {
        const prev = {
            score: this.state.score,
            lives: this.state.lives,
            playerHp: this.state.playerHp,
            level: this.state.level,
            llmEnabled: this.state.llmEnabled,
            playerBuffs: this.state.playerBuffs
        };
        this.state.reset();
        this.state.preserveForNextLevel(prev);
        this.ui.hideGameOver();
        this._loadLevel();
        setTimeout(() => {
            const lvl = LEVEL_MAPS[Math.min(this.state.level - 1, LEVEL_MAPS.length - 1)];
            this.ui.showComment(`Уровень ${this.state.level}: ${lvl.name}. Будьте осторожны!`);
        }, 500);
    }
}

window.addEventListener('load', () => {
    const game = new Game();
    game.start();
});