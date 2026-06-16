/**
 * Чистые утилитарные функции (без состояния).
 */
export function checkCollision(r1, r2) {
    return r1.x < r2.x + r2.width &&
           r1.x + r1.width > r2.x &&
           r1.y < r2.y + r2.height &&
           r1.y + r1.height > rect2Y(r2);
}

// Правильная реализация
export function rectsOverlap(r1, r2) {
    return r1.x < r2.x + r2.width &&
           r1.x + r1.width > r2.x &&
           r1.y < r2.y + r2.height &&
           r1.y + r1.height > r2.y;
}

export function distSq(x1, y1, x2, y2) {
    const dx = x1 - x2;
    const dy = y1 - y2;
    return dx * dx + dy * dy;
}

export function centerOf(entity) {
    return {
        x: entity.x + (entity.width || 0) / 2,
        y: entity.y + (entity.height || 0) / 2
    };
}

export function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}

export function randomChoice(array) {
    return array[Math.floor(Math.random() * array.length)];
}

export function weightedRandom(items) {
    const totalWeight = items.reduce((sum, item) => sum + item.weight, 0);
    let random = Math.random() * totalWeight;
    for (const item of items) {
        random -= item.weight;
        if (random <= 0) return item;
    }
    return items[items.length - 1];
}