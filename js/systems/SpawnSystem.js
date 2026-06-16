import { TILE_SIZE, GRID_SIZE, DIRECTIONS } from '../config/constants.js';
import { LEVEL_MAPS } from '../config/levels.js';
import { Tank } from '../entities/Tank.js';
import { rectsOverlap } from '../core/utils.js';

export class SpawnSystem {
    constructor(state, canvas) {
        this.state = state;
        this.canvas = canvas;
    }

    update() {
        if (this.state.enemies.length >= 3 ||
            this.state.enemyCount >= this.state.maxEnemies) return;
        this._spawn();
    }

    _spawn() {
        const levelData = LEVEL_MAPS[Math.min(this.state.level - 1, LEVEL_MAPS.length - 1)];
        const types = levelData.enemyTypes;
        const currentEnemies = this.state.enemies.length;
        const remaining = this.state.maxEnemies - this.state.enemyCount;
        const toSpawn = Math.min(3 - currentEnemies, remaining);
        if (toSpawn <= 0) return;

        const baseCx = this.state.base
            ? this.state.base.x + this.state.base.width / 2
            : this.canvas.width / 2;
        const baseCy = this.state.base
            ? this.state.base.y + this.state.base.height / 2
            : this.canvas.height - TILE_SIZE * 2;
        const maxDistSq = this.canvas.width ** 2 + this.canvas.height ** 2;

        const maxSpawnY = this.canvas.height * 0.45;
        const candidates = [];

        for (let row = 1; row < Math.floor(maxSpawnY / TILE_SIZE); row++) {
            for (let col = 1; col < GRID_SIZE - 1; col++) {
                const x = col * TILE_SIZE;
                const y = row * TILE_SIZE;
                if (!this._isClear(x, y)) continue;
                const dx = (x + TILE_SIZE / 2) - baseCx;
                const dy = (y + TILE_SIZE / 2) - baseCy;
                const normalized = (dx * dx + dy * dy) / maxDistSq;
                candidates.push({
                    x, y,
                    weight: Math.pow(normalized, 1.5) * 100 + 1
                });
            }
        }

        if (candidates.length === 0) return;

        const used = new Set();
        for (let i = 0; i < toSpawn; i++) {
            const available = candidates.filter((_, idx) => !used.has(idx));
            if (available.length === 0) break;

            const totalWeight = available.reduce((s, c) => s + c.weight, 0);
            let r = Math.random() * totalWeight;
            let chosen = null;
            for (const c of available) {
                r -= c.weight;
                if (r <= 0) { chosen = c; break; }
            }
            if (!chosen) break;

            const idx = candidates.indexOf(chosen);
            used.add(idx);

            const type = types[Math.floor(Math.random() * types.length)];
            this.state.enemies.push(
                new Tank(chosen.x, chosen.y, DIRECTIONS.DOWN, false, type)
            );
        }
    }

    _isClear(x, y) {
        const r = { x: x - 2, y: y - 2, width: 24 + 4, height: 24 + 4 };
        if ([this.state.player, ...this.state.enemies]
            .filter(t => t && t.isActive)
            .some(t => rectsOverlap(r, { x: t.x, y: t.y, width: t.width, height: t.height }))) {
            return false;
        }
        if (this.state.walls.some(w => w.hp > 0 && rectsOverlap(r, w.getRect()))) return false;
        if (this.state.waters.some(w => rectsOverlap(r, w.getRect()))) return false;
        return true;
    }
}