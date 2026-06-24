import { DIRECTIONS, TILE_SIZE, TANK_SIZE } from '../config/constants.js';
import { rectsOverlap } from '../core/utils.js';
import { pathfindingSystem } from '../main.js';

export function chooseBestDirection(enemy, state) {
    // Pathfinding даёт направление
    const pathDir = pathfindingSystem.getNextDirection(enemy.x, enemy.y, state);

    if (pathDir !== null) {
        // 🆕 Проверяем весь путь к цели, не только конечную точку
        if (canMoveAlongPath(enemy, pathDir, state)) {
            return pathDir;
        }
    }

    // Fallback: utility-based AI
    return chooseByUtility(enemy, state);
}

/**
 * 🆕 Проверяет, может ли танк проехать в направлении dir.
 * Тестирует несколько точек вдоль пути (а не только цель).
 */
function canMoveAlongPath(enemy, dir, state) {
    const step = TILE_SIZE;
    let targetX = enemy.x, targetY = enemy.y;

    switch (dir) {
        case DIRECTIONS.UP: targetY -= step; break;
        case DIRECTIONS.RIGHT: targetX += step; break;
        case DIRECTIONS.DOWN: targetY += step; break;
        case DIRECTIONS.LEFT: targetX -= step; break;
    }

    // Проверяем 4 точки вдоль пути
    const steps = 4;
    for (let i = 1; i <= steps; i++) {
        const t = i / steps;
        const testX = enemy.x + (targetX - enemy.x) * t;
        const testY = enemy.y + (targetY - enemy.y) * t;

        if (hasCollision(enemy, testX, testY, state)) {
            return false;
        }
    }
    return true;
}

function chooseByUtility(enemy, state) {
    // 🆕 Меньший lookahead — танк смотрит на 1 тайл вперёд, не на 2
    const lookahead = TILE_SIZE;
    let bestDir = enemy.direction;
    let bestUtility = -Infinity;

    for (let dir = 0; dir < 4; dir++) {
        let testX = enemy.x, testY = enemy.y;
        switch (dir) {
            case DIRECTIONS.UP: testY -= lookahead; break;
            case DIRECTIONS.RIGHT: testX += lookahead; break;
            case DIRECTIONS.DOWN: testY += lookahead; break;
            case DIRECTIONS.LEFT: testX -= lookahead; break;
        }

        // 🆕 Проверяем весь путь
        if (!canMoveAlongPathFull(enemy, testX, testY, state)) {
            continue; // направление полностью заблокировано
        }

        const utility = evaluateDirection(enemy, testX, testY, dir, state);
        const noisy = utility + (Math.random() - 0.5) * 1.0;
        if (noisy > bestUtility) {
            bestUtility = noisy;
            bestDir = dir;
        }
    }

    // Если все направления заблокированы — остаёмся на месте
    return bestDir;
}

/**
 * 🆕 Полная проверка пути от текущей позиции к (testX, testY).
 */
function canMoveAlongPathFull(enemy, testX, testY, state) {
    const steps = 4;
    for (let i = 1; i <= steps; i++) {
        const t = i / steps;
        const x = enemy.x + (testX - enemy.x) * t;
        const y = enemy.y + (testY - enemy.y) * t;
        if (hasCollision(enemy, x, y, state)) return false;
    }
    return true;
}

function hasCollision(enemy, testX, testY, state) {
    const rect = { x: testX, y: testY, width: enemy.width, height: enemy.height };

    for (const wall of state.walls) {
        if (wall.hp > 0 && rectsOverlap(rect, wall.getRect())) return true;
    }
    if (state.base && !state.base.isDestroyed && rectsOverlap(rect, state.base.getRect())) return true;
    for (const water of state.waters) {
        if (rectsOverlap(rect, water.getRect())) return true;
    }

    const others = [state.player, ...state.enemies].filter(t => t && t !== enemy && t.isActive);
    for (const other of others) {
        if (rectsOverlap(rect, { x: other.x, y: other.y, width: other.width, height: other.height })) {
            return true;
        }
    }
    return false;
}

function evaluateDirection(enemy, testX, testY, dir, state) {
    const canvas = document.getElementById('gameCanvas');
    testX = Math.max(1, Math.min(canvas.width - enemy.width - 1, testX));
    testY = Math.max(1, Math.min(canvas.height - enemy.height - 1, testY));

    let utility = 0;

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
        utility += ((currDist - newDist) / maxRSq) * 100;
    }

    // Вторичная цель: игрок
    if (state.player && state.player.isActive) {
        const px = state.player.x + state.player.width / 2;
        const py = state.player.y + state.player.height / 2;
        const currDist = (cx - px) ** 2 + (cy - py) ** 2;
        const newDist = (newCx - px) ** 2 + (newCy - py) ** 2;
        utility += ((currDist - newDist) / maxRSq) * 15;

        // Бонус за направление на игрока
        const dx = px - cx, dy = py - cy;
        let facing = false;
        if (dir === DIRECTIONS.UP && dy < -TILE_SIZE) facing = true;
        if (dir === DIRECTIONS.DOWN && dy > TILE_SIZE) facing = true;
        if (dir === DIRECTIONS.LEFT && dx < -TILE_SIZE) facing = true;
        if (dir === DIRECTIONS.RIGHT && dx > TILE_SIZE) facing = true;
        if (facing) utility += 10;
    }

    // 🆕 Минимальный штраф за близость к границам (0.3 тайла)
    const margin = TILE_SIZE * 0.3;
    const maxPenalty = 5;
    const edges = [newCx, canvas.width - newCx, newCy, canvas.height - newCy];

    for (const dist of edges) {
        if (dist < margin) {
            const tileFraction = 1 - (dist / margin);
            utility -= tileFraction * tileFraction * maxPenalty;
        }
    }

    return utility;
}