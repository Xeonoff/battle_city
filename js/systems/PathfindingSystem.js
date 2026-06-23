import { TILE_SIZE, GRID_SIZE } from '../config/constants.js';

/**
 * BFS pathfinding для врагов.
 * Stateless — принимает state как аргумент.
 */
export class PathfindingSystem {
    constructor() {
        this.pathCache = new Map();
        this.cacheDuration = 1000;
    }

    /**
     * Находит следующее направление движения от (x,y) к базе.
     * @param {number} x - текущая X позиция врага
     * @param {number} y - текущая Y позиция врага
     * @param {Object} state - состояние игры (передаётся из AI)
     * @returns {number|null} направление (0-3) или null если путь не найден
     */
    getNextDirection(x, y, state) {
        // Если нет state или базы — возвращаем null (используется fallback)
        if (!state || !state.base || state.base.isDestroyed) {
            return null;
        }

        const key = `${Math.floor(x / TILE_SIZE)},${Math.floor(y / TILE_SIZE)}`;
        const cached = this.pathCache.get(key);

        if (cached && Date.now() - cached.timestamp < this.cacheDuration) {
            return cached.nextDir;
        }

        const path = this._findPath(x, y, state);
        const nextDir = path.length > 0 ? path[0] : null;

        this.pathCache.set(key, { path, nextDir, timestamp: Date.now() });

        // Очистка старого кэша
        if (this.pathCache.size > 100) {
            const now = Date.now();
            for (const [k, v] of this.pathCache.entries()) {
                if (now - v.timestamp > this.cacheDuration * 2) {
                    this.pathCache.delete(k);
                }
            }
        }

        return nextDir;
    }

    _findPath(startX, startY, state) {
        const startGX = Math.floor(startX / TILE_SIZE);
        const startGY = Math.floor(startY / TILE_SIZE);
        const targetGX = Math.floor((state.base.x + state.base.width / 2) / TILE_SIZE);
        const targetGY = Math.floor((state.base.y + state.base.height / 2) / TILE_SIZE);

        // BFS
        const queue = [{ gx: startGX, gy: startGY, path: [] }];
        const visited = new Set();
        visited.add(`${startGX},${startGY}`);

        const directions = [
            { dx: 0, dy: -1, dir: 0 }, // UP
            { dx: 1, dy: 0, dir: 1 },  // RIGHT
            { dx: 0, dy: 1, dir: 2 },  // DOWN
            { dx: -1, dy: 0, dir: 3 }  // LEFT
        ];

        let iterations = 0;
        const maxIterations = 500;

        while (queue.length > 0 && iterations < maxIterations) {
            iterations++;
            const current = queue.shift();

            const distToTarget = Math.abs(current.gx - targetGX) + Math.abs(current.gy - targetGY);
            if (distToTarget <= 2) {
                return current.path;
            }

            for (const { dx, dy, dir } of directions) {
                const nx = current.gx + dx;
                const ny = current.gy + dy;
                const key = `${nx},${ny}`;

                if (visited.has(key)) continue;
                if (nx < 0 || nx >= GRID_SIZE || ny < 0 || ny >= GRID_SIZE) continue;

                if (!this._isPassable(nx, ny, state)) continue;

                visited.add(key);
                queue.push({
                    gx: nx,
                    gy: ny,
                    path: [...current.path, dir]
                });
            }
        }

        return [];
    }

    _isPassable(gx, gy, state) {
        const x = gx * TILE_SIZE;
        const y = gy * TILE_SIZE;
        const rect = { x, y, width: TILE_SIZE, height: TILE_SIZE };

        for (const wall of state.walls) {
            if (wall.hp > 0) {
                const wr = wall.getRect();
                if (rect.x < wr.x + wr.width && rect.x + rect.width > wr.x &&
                    rect.y < wr.y + wr.height && rect.y + rect.height > wr.y) {
                    return false;
                }
            }
        }

        for (const water of state.waters) {
            const wr = water.getRect();
            if (rect.x < wr.x + wr.width && rect.x + rect.width > wr.x &&
                rect.y < wr.y + wr.height && rect.y + rect.height > wr.y) {
                return false;
            }
        }

        if (state.base && !state.base.isDestroyed) {
            const br = state.base.getRect();
            if (rect.x < br.x + br.width && rect.x + rect.width > br.x &&
                rect.y < br.y + br.height && rect.y + rect.height > br.y) {
                return false;
            }
        }

        return true;
    }

    clear() {
        this.pathCache.clear();
    }
}