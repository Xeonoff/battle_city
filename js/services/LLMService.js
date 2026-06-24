import { LLM_API_URL } from '../config/constants.js';
import { BONUS_TYPES } from '../config/bonusTypes.js';
import { getLevelConfig } from '../config/levels.js';

export class LLMService {
    constructor(state) {
        this.state = state;
    }

    shouldComment() {
        if (!this.state.llmEnabled) return false;
        return Date.now() - this.state.lastCommentTime > this.state.commentCooldown;
    }

    async requestComment() {
        this.state.lastCommentTime = Date.now();
        if (!this.state.llmEnabled) return null;

        const s = this.state;

        const activeBuffs = Object.keys(s.playerBuffs)
            .filter(k => s.playerBuffs[k].active)
            .map(k => BONUS_TYPES[k.toUpperCase()].displayName);

        const config = getLevelConfig(s.level);
        const prompt = `Ты командир танкового подразделения в игре Battle City. Ты наблюдаешь за ходом битвы и даешь краткие, мотивирующие комментарии своему экипажу.
Текущее состояние битвы:
- Уровень: ${s.level} (${config.name})
- Уничтожено вражеских танков: ${s.enemyCount}/${s.maxEnemies}
- Осталось врагов: ${s.maxEnemies - s.enemyCount}
- Жизней у игрока: ${s.lives}
- Счет: ${s.score}
- Активных врагов на поле: ${s.enemies.length}
- Активные бонусы: ${activeBuffs.join(', ') || 'нет'}
- Статус базы: ${s.base ? (s.base.isDestroyed ? "destroyed" : "protected") : "unknown"}
- Статус игры: ${s.gameOver ? (s.gameWon ? "won" : "lost") : "in_progress"}

Дай краткий, энергичный комментарий (максимум 2 предложения).`;

        try {
            const res = await fetch(LLM_API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt })
            });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const data = await res.json();
            return data.response || this._fallback();
        } catch (e) {
            console.error('LLM error:', e);
            return this._fallback();
        }
    }

    _fallback() {
        const pool = [
            "Держите строй! Защищайте базу!",
            "Враги приближаются! Будьте наготове!",
            "Отличная работа! Продолжайте в том же духе!",
            "Не подводите! База должна быть защищена!",
            "Сосредоточьтесь! Победа близка!",
            "Используйте бонусы с умом, солдаты!",
            "Тяжёлые танки требуют нескольких попаданий! Целься точнее!"
        ];
        return pool[Math.floor(Math.random() * pool.length)];
    }
}