/**
 * Метаданные уровней. Генерируется динамически для бесконечной игры.
 */

/**
 * Возвращает конфигурацию уровня для любого номера (бесконечно).
 */
export function getLevelConfig(level) {
    const names = [
        "Учебный полигон", "Городские улицы", "Промышленная зона",
        "Фронтовая линия", "Финальная битва", "За линией фронта",
        "Вражеский тыл", "Крепость", "Осада", "Последний рубеж"
    ];

    const name = level <= names.length
        ? names[level - 1]
        : `Битва ${level}: ${getRandomModifier()}`;

    // Сложность растёт с уровнем (cap на уровне 15)
    const diff = Math.min(level - 1, 15);

    // Враги — пул растёт с уровнем
    const enemyTypes = buildEnemyPool(diff);

    // Количество врагов растёт (но не бесконечно)
    const maxEnemies = Math.min(15 + diff * 4, 60);

    return { name, maxEnemies, enemyTypes };
}

function buildEnemyPool(diff) {
    const pool = ['BASIC'];

    if (diff >= 1) pool.push('BASIC', 'FAST');
    if (diff >= 2) pool.push('FAST', 'HEAVY');
    if (diff >= 3) pool.push('HEAVY', 'POWER');
    if (diff >= 4) pool.push('POWER', 'FLAMETHROWER'); // 🆕 огнеметчики с 5 уровня
    if (diff >= 6) pool.push('FLAMETHROWER', 'HEAVY');
    if (diff >= 8) pool.push('POWER', 'FLAMETHROWER', 'HEAVY');
    if (diff >= 12) pool.push('FLAMETHROWER', 'FLAMETHROWER');

    return pool;
}

function getRandomModifier() {
    const mods = [
        'Пылающая', 'Забытая', 'Кровавая', 'Стальная', 'Огненная',
        'Пустошь', 'Берлога', 'Яма', 'Равнина', 'Грозовая',
        'Пепелище', 'Руины', 'Болото', 'Каньон', 'Плато'
    ];
    return mods[Math.floor(Math.random() * mods.length)];
}

export const LEVEL_CONFIGS = {
    length: Infinity, // не ограничено
    get: (idx) => getLevelConfig(idx + 1)
};

// Массив-обёртка для итераций
export const LEVEL_MAPS = {
    length: 1000, // условное "бесконечное" значение
    [Symbol.iterator]: function* () {
        for (let i = 0; i < this.length; i++) yield getLevelConfig(i + 1);
    }
};