import { TILE_SIZE, GRID_SIZE, TANK_SIZE } from '../config/constants.js';

export class PathfindingSystem {
    constructor() {
        this.pathCache = new Map();
        this.cacheDuration = 1500;
    }

    getNextDirection(x, y, state) {
        if (!state || !state.base || state.base.isDestroyed) return null;

        const key = `${Math.floor(x / TILE_SIZE)},${Math.floor(y / TILE_SIZE)}`;
        const cached = this.pathCache.get(key);
        if (cached && Date.now() - cached.timestamp < this.cacheDuration) {
            return cached.nextDir;
        }

        const path = this._findPath(x, y, state);
        const nextDir = path.length > 0 ? path[0] : null;

        this.pathCache.set(key, { path, nextDir, timestamp: Date.now() });

        if (this.pathCache.size > 200) {
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
        // Стартовая клетка — с учётом реального положения танка
        const startGX = Math.floor((startX + TANK_SIZE / 2) / TILE_SIZE);
        const startGY = Math.floor((startY + TANK_SIZE / 2) / TILE_SIZE);

        const targetGX = Math.floor((state.base.x + state.base.width / 2) / TILE_SIZE);
        const targetGY = Math.floor((state.base.y + state.base.height / 2) / TILE_SIZE);

        const queue = [{ gx: startGX, gy: startGY, path: [] }];
        const visited = new Set();
        visited.add(`${startGX},${startGY}`);

        const directions = [
            { dx: 0, dy: -1, dir: 0 },
            { dx: 1, dy: 0, dir: 1 },
            { dx: 0, dy: 1, dir: 2 },
            { dx: -1, dy: 0, dir: 3 }
        ];

        let iterations = 0;
        const maxIterations = 800;

        while (queue.length > 0 && iterations < maxIterations) {
            iterations++;
            const current = queue.shift();

            const dist = Math.abs(current.gx - targetGX) + Math.abs(current.gy - targetGY);
            if (dist <= 3) return current.path;

            for (const { dx, dy, dir } of directions) {
                const nx = current.gx + dx;
                const ny = current.gy + dy;
                const key = `${nx},${ny}`;

                if (visited.has(key)) continue;
                if (nx < 0 || nx >= GRID_SIZE || ny < 0 || ny >= GRID_SIZE) continue;

                if (!this._isPassable(nx, ny, state)) continue;

                visited.add(key);
                queue.push({ gx: nx, gy: ny, path: [...current.path, dir] });
            }
        }
        return [];
    }

    _isPassable(gx, gy, state) {
        const cellCenterX = gx * TILE_SIZE + TILE_SIZE / 2;
        const cellCenterY = gy * TILE_SIZE + TILE_SIZE / 2;

        // Прямоугольник танка, центрированный в клетке
        const halfTank = TANK_SIZE / 2;
        const tankRect = {
            x: cellCenterX - halfTank,
            y: cellCenterY - halfTank,
            width: TANK_SIZE,
            height: TANK_SIZE
        };

        // Проверяем стены
        for (const wall of state.walls) {
            if (wall.hp <= 0) continue;
            const wr = wall.getRect();
            if (this._rectsOverlap(tankRect, wr)) return false;
        }

        // Проверяем воду
        for (const water of state.waters) {
            const wr = water.getRect();
            if (this._rectsOverlap(tankRect, wr)) return false;
        }

        // База
        if (state.base && !state.base.isDestroyed) {
            const br = state.base.getRect();
            if (this._rectsOverlap(tankRect, br)) return false;
        }

        return true;
    }

    _rectsOverlap(r1, r2) {
        return r1.x < r2.x + r2.width && r1.x + r1.width > r2.x &&
               r1.y < r2.y + r2.height && r1.y + r1.height > r2.y;
    }

    clear() {
        this.pathCache.clear();
    }
}