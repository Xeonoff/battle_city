import { LEVEL_MAPS } from '../config/levels.js';

export class UIManager {
    constructor(state) {
        this.state = state;
        this.els = {
            tanks: document.getElementById('tanks-counter'),
            lives: document.getElementById('lives-counter'),
            level: document.getElementById('level-counter'),
            score: document.getElementById('score-counter'),
            fps: document.getElementById('fpsIndicator'),
            llmBtn: document.getElementById('toggleLlmBtn'),
            gameOver: document.getElementById('gameOverScreen'),
            gameOverTitle: document.getElementById('gameOverTitle'),
            gameOverMsg: document.getElementById('gameOverMessage'),
            restartBtn: document.getElementById('restartButton'),
            nextLevelBtn: document.getElementById('nextLevelButton'),
            commander: document.getElementById('commanderComment'),
            commentText: document.getElementById('commentText')
        };
    }

    updateHUD() {
        const s = this.state;
        this.els.tanks.textContent = `${s.enemyCount}/${s.maxEnemies}`;
        this.els.lives.textContent = s.lives;
        this.els.level.textContent = s.level;
        this.els.score.textContent = s.score;
    }

    updateFps(fps) {
        this.els.fps.textContent = `FPS: ${fps}`;
    }

    updateLlmButton(enabled) {
        this.els.llmBtn.textContent = enabled ? '🟢 LLM: ВКЛ' : '🔴 LLM: ВЫКЛ';
        this.els.llmBtn.classList.toggle('off', !enabled);
    }

    showGameOver(won, onNextLevel, onRestart) {
        const s = this.state;
        this.els.gameOver.classList.remove('win', 'level-up');

        if (won) {
            const hasNext = s.level < LEVEL_MAPS.length;
            if (hasNext) {
                this.els.gameOverTitle.textContent = `УРОВЕНЬ ${s.level} ПРОЙДЕН!`;
                this.els.gameOverMsg.textContent = `Следующий этап: ${LEVEL_MAPS[s.level].name}`;
                this.els.gameOver.classList.add('level-up');
                this.els.nextLevelBtn.style.display = 'inline-block';
                this.els.nextLevelBtn.textContent = `▶ ${LEVEL_MAPS[s.level].name}`;
                this.els.nextLevelBtn.onclick = onNextLevel;
            } else {
                this.els.gameOverTitle.textContent = '🏆 ПОБЕДА!';
                this.els.gameOverMsg.textContent = `Все ${LEVEL_MAPS.length} уровней пройдены! Счёт: ${s.score}`;
                this.els.gameOver.classList.add('win');
                this.els.nextLevelBtn.style.display = 'none';
            }
        } else {
            this.els.gameOverTitle.textContent = 'ИГРА ОКОНЧЕНА';
            this.els.gameOverMsg.textContent = `Счёт: ${s.score} | Уровень: ${s.level}`;
            this.els.nextLevelBtn.style.display = 'none';
        }
        this.els.gameOver.classList.add('show');
        this.els.restartBtn.onclick = onRestart;
    }

    hideGameOver() {
        this.els.gameOver.classList.remove('show', 'win', 'level-up');
    }

    showComment(text) {
        if (!this.state.llmEnabled) return;
        this.els.commentText.textContent = `Командир: ${text}`;
        this.els.commander.classList.remove('show');
        void this.els.commander.offsetWidth;
        this.els.commander.classList.add('show');
        setTimeout(() => this.els.commander.classList.remove('show'), 10000);
    }

    hideComment() {
        this.els.commander.classList.remove('show');
    }
}