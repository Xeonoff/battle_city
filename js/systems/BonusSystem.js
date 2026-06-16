import { BONUS_TYPES } from '../config/bonusTypes.js';
import { Bonus } from '../entities/Environment.js';
import { eventBus } from '../core/EventBus.js';
import { EVENTS } from '../config/constants.js';

export function maybeDropBonus(tank, state) {
    const chance = tank.dropChance || 0.15;
    if (Math.random() > chance) return;

    const keys = Object.keys(BONUS_TYPES);
    const type = BONUS_TYPES[keys[Math.floor(Math.random() * keys.length)]];

    const blocked =
        state.walls.some(w => w.hp > 0 &&
            w.x < tank.x + 26 && w.x + w.width > tank.x &&
            w.y < tank.y + 26 && w.y + w.height > tank.y) ||
        state.waters.some(w =>
            w.x < tank.x + 26 && w.x + w.width > tank.x &&
            w.y < tank.y + 26 && w.y + w.height > tank.y);

    if (!blocked) {
        state.bonuses.push(new Bonus(tank.x, tank.y, type));
    }
}

export function applyBonusEffect(bonus, state) {
    const now = Date.now();
    const t = bonus.type;
    switch (t.name) {
        case 'shield':
        case 'triple':
        case 'ricochet':
        case 'star':
            state.playerBuffs[t.name].active = true;
            state.playerBuffs[t.name].endTime = now + t.duration;
            state.playerBuffs[t.name].duration = t.duration;
            break;
        case 'grenade':
            state.enemies.forEach(e => {
                if (e.isActive) {
                    e.isActive = false;
                    state.score += e.score || 100;
                    state.enemyCount++;
                }
            });
            break;
        case 'life':
            state.lives++;
            break;
    }
    state.score += 50;
    eventBus.emit(EVENTS.BONUS_COLLECTED, bonus);
}

/**
 * Система управления баффами (таймеры).
 */
export class BuffSystem {
    constructor(state) { this.state = state; }
    update() {
        const now = Date.now();
        for (const key in this.state.playerBuffs) {
            const b = this.state.playerBuffs[key];
            if (b.active && now > b.endTime) b.active = false;
        }
    }
}