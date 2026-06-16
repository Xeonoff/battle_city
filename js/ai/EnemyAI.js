import { DIRECTIONS, TILE_SIZE } from '../config/constants.js';
import { rectsOverlap } from '../core/utils.js';

/**
 * Utility-based AI: выбирает направление с максимальной полезностью.
 */
export function chooseBestDirection(enemy, state) {
    const lookahead = TILE_SIZE * 2;
    let bestDir = enemy.direction;
    let bestUtility = -Infinity;

    for (let dir = 0; dir < 4; dir++) {
        let testX = enemy.x;
        let testY = enemy.y;
        switch (dir) {
            case DIRECTIONS.UP:    testY -= lookahead; break;
            case DIRECTIONS.RIGHT: testX += lookahead; break;
            case DIRECTIONS.DOWN:  testY += lookahead; break;
            case DIRECTIONS.LEFT:  testX -= lookahead; break;
        }
        const utility = evaluateDirection(enemy, testX, testY, dir, state);
        const noisy = utility + (Math.random() - 0.5) * 3;
        if (noisy > bestUtility) {
            bestUtility = noisy;
            bestDir = dir;
        }
    }
    return bestDir;
}

function evaluateDirection(enemy, testX, testY, dir, state) {
    const canvas = document.getElementById('gameCanvas');
    testX = Math.max(TILE_SIZE, Math.min(canvas.width - TILE_SIZE - enemy.width, testX));
    testY = Math.max(TILE_SIZE, Math.min(canvas.height - TILE_SIZE - enemy.height, testY));

    let utility = 0;

    // Штраф за коллизию
    const testRect = { x: testX, y: testY, width: enemy.width, height: enemy.height };
    const hasCollision =
        state.walls.some(w => w.hp > 0 && rectsOverlap(testRect, w.getRect())) ||
        (state.base && !state.base.isDestroyed && rectsOverlap(testRect, state.base.getRect())) ||
        state.waters.some(w => rectsOverlap(testRect, w.getRect())) ||
        [state.player, ...state.enemies].filter(t => t && t !== enemy && t.isActive)
            .some(o => rectsOverlap(testRect, { x: o.x, y: o.y, width: o.width, height: o.height }));
    if (hasCollision) utility -= 100;

    const maxRSq = canvas.width * canvas.width + canvas.height * canvas.height;
    const cx = enemy.x + enemy.width / 2;
    const cy = enemy.y + enemy.height / 2;
    const newCx = testX + enemy.width / 2;
    const newCy = testY + enemy.height / 2;

    // Главная цель: база
    if (state.base && !state.base.isDestroyed) {
        const bcx = state.base.x + state.base.width / 2;
        const bcy = state.base.y + state.base.height / 2;
        const currDist = (cx - bcx) ** 2 + (cy - bcy) ** 2;
        const newDist = (newCx - bcx) ** 2 + (newCy - bcy) ** 2;
        utility += ((currDist - newDist) / maxRSq) * 80;
    }

    // Вторичная цель: игрок
    if (state.player && state.player.isActive) {
        const px = state.player.x + state.player.width / 2;
        const py = state.player.y + state.player.height / 2;
        const currDist = (cx - px) ** 2 + (cy - py) ** 2;
        const newDist = (newCx - px) ** 2 + (newCy - py) ** 2;
        utility += ((currDist - newDist) / maxRSq) * 30;

        const dx = px - cx;
        const dy = py - cy;
        let facing = false;
        if (dir === DIRECTIONS.UP && dy < -TILE_SIZE) facing = true;
        if (dir === DIRECTIONS.DOWN && dy > TILE_SIZE) facing = true;
        if (dir === DIRECTIONS.LEFT && dx < -TILE_SIZE) facing = true;
        if (dir === DIRECTIONS.RIGHT && dx > TILE_SIZE) facing = true;
        if (facing) utility += 15;
    }

    // Квадратичный штраф за близость к границам
    const margin = TILE_SIZE * 3;
    for (const dist of [newCx, canvas.width - newCx, newCy, canvas.height - newCy]) {
        if (dist < margin) {
            const t = 1 - dist / margin;
            utility -= t * t * 60;
        }
    }

    return utility;
}