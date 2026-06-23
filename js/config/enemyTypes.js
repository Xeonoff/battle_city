import { BASE_ENEMY_SPEED, BULLET_SPEED } from './constants.js';

export const ENEMY_TYPES = Object.freeze({
    BASIC: {
        name: 'basic', displayName: '🔴 Обычный танк',
        speed: BASE_ENEMY_SPEED, hp: 1,
        color: '#FF5252', turretColor: '#D32F2F',
        shootCooldownMs: 1200, score: 100,
        bulletSpeed: BULLET_SPEED, dropChance: 0.1,
        description: 'Стандартный враг. Одно попадание.'
    },
    FAST: {
        name: 'fast', displayName: '🟣 Быстрый танк',
        speed: BASE_ENEMY_SPEED * 2, hp: 1,
        color: '#AB47BC', turretColor: '#7B1FA2',
        shootCooldownMs: 800, score: 200,
        bulletSpeed: BULLET_SPEED * 1.3, dropChance: 0.2,
        description: 'Двигается в 2 раза быстрее обычного.'
    },
    HEAVY: {
        name: 'heavy', displayName: '⚫ Тяжёлый танк',
        speed: BASE_ENEMY_SPEED * 0.6, hp: 3,
        color: '#455A64', turretColor: '#263238',
        shootCooldownMs: 1500, score: 300,
        bulletSpeed: BULLET_SPEED * 0.8, dropChance: 0.35,
        description: 'Бронированный. Требует 3 попаданий.'
    },
    POWER: {
        name: 'power', displayName: '🟠 Мощный танк',
        speed: BASE_ENEMY_SPEED * 0.9, hp: 2,
        color: '#FF6F00', turretColor: '#E65100',
        shootCooldownMs: 600, score: 400,
        bulletSpeed: BULLET_SPEED * 1.5, dropChance: 0.4,
        description: 'Стреляет двумя снарядами параллельно.'
    },
    FLAMETHROWER: { // 🆕
        name: 'flamethrower', displayName: '🔥 Огнемётчик',
        speed: BASE_ENEMY_SPEED * 0.5, hp: 2,
        color: '#263238', turretColor: '#263238',
        shootCooldownMs: 3000, score: 500,
        bulletSpeed: 0, dropChance: 0.5,
        description: 'Медленный. Стреляет потоком огня на 4 тайла.'
    }
});