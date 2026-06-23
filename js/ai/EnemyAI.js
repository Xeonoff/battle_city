import { DIRECTIONS, TILE_SIZE } from '../config/constants.js';
import { rectsOverlap } from '../core/utils.js';
import { pathfindingSystem } from '../main.js';

export function chooseBestDirection(enemy, state) {
    const pathDir = pathfindingSystem.getNextDirection(enemy.x, enemy.y, state);

    if (pathDir !== null) {
        const testPos = getTestPosition(enemy, pathDir);
        if (!hasCollision(enemy, testPos.x, testPos.y, state)) {
            return pathDir;
        }
    }

    return chooseByUtility(enemy, state);
}

function chooseByUtility(enemy, state) {
    const lookahead = TILE_SIZE * 2;
    let bestDir = enemy.direction;
    let bestUtility = -Infinity;

    for (let dir = 0; dir < 4; dir++) {
        let testX = enemy.x;
        let testY = enemy.y;
        switch (dir) {
            case DIRECTIONS.UP: testY -= lookahead; break;
            case DIRECTIONS.RIGHT: testX += lookahead; break;
            case DIRECTIONS.DOWN: testY += lookahead; break;
            case DIRECTIONS.LEFT: testX -= lookahead; break;
        }
        const utility = evaluateDirection(enemy, testX, testY, dir, state);
        // 🆕 Уменьшенный шум — меньше случайных "затупов"
        const noisy = utility + (Math.random() - 0.5) * 1.5;
        if (noisy > bestUtility) {
            bestUtility = noisy;
            bestDir = dir;
        }
    }
    return bestDir;
}

function getTestPosition(enemy, dir) {
    let x = enemy.x, y = enemy.y;
    const step = TILE_SIZE;
    switch (dir) {
        case DIRECTIONS.UP: y -= step; break;
        case DIRECTIONS.RIGHT: x += step; break;
        case DIRECTIONS.DOWN: y += step; break;
        case DIRECTIONS.LEFT: x -= step; break;
    }
    return { x, y };
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
    testX = Math.max(TILE_SIZE, Math.min(canvas.width - TILE_SIZE - enemy.width, testX));
    testY = Math.max(TILE_SIZE, Math.min(canvas.height - TILE_SIZE - enemy.height, testY));

    let utility = 0;

    // Штраф за коллизию (жёсткий — это критично)
    const testRect = { x: testX, y: testY, width: enemy.width, height: enemy.height };
    const hasCol =
        state.walls.some(w => w.hp > 0 && rectsOverlap(testRect, w.getRect())) ||
        (state.base && !state.base.isDestroyed && rectsOverlap(testRect, state.base.getRect())) ||
        state.waters.some(w => rectsOverlap(testRect, w.getRect())) ||
        [state.player, ...state.enemies].filter(t => t && t !== enemy && t.isActive)
            .some(o => rectsOverlap(testRect, { x: o.x, y: o.y, width: o.width, height: o.height }));
    if (hasCol) utility -= 50; // 🆕 было -100

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
        utility += ((currDist - newDist) / maxRSq) * 10;

        const dx = px - cx;
        const dy = py - cy;
        let facing = false;
        if (dir === DIRECTIONS.UP && dy < -TILE_SIZE) facing = true;
        if (dir === DIRECTIONS.DOWN && dy > TILE_SIZE) facing = true;
        if (dir === DIRECTIONS.LEFT && dx < -TILE_SIZE) facing = true;
        if (dir === DIRECTIONS.RIGHT && dx > TILE_SIZE) facing = true;
        if (facing) utility += 15;
    }

    // 🆕 Плавные штрафы за близость к границам
    // Зона штрафа: 1.5 тайла от края (вместо 3)
    // Максимальный штраф на самом краю: -20 (вместо -60)
    // Считаем в долях тайла (tile fractions)
    const margin = TILE_SIZE * 0.5;
    const maxPenalty = 20;
    const edges = [newCx, canvas.width - newCx, newCy, canvas.height - newCy];

    for (const dist of edges) {
        if (dist < margin) {
            // Доля от зоны штрафа: 0 на краю, 1 на границе зоны
            const tileFraction = 1 - (dist / margin);
            // Плавный квадратичный штраф, ограниченный maxPenalty
            utility -= tileFraction * tileFraction * maxPenalty;
        }
    }

    // 🆕 Бонус за движение в свободном направлении (поощряем исследование)
    // Если выбранное направление ведёт в зону где нет стен в радиусе 2 тайлов — небольшой плюс
    if (!hasCol) {
        utility += 2;
    }

    return utility;
}