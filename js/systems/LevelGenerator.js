import { TILE_SIZE, GRID_SIZE } from '../config/constants.js';


export class LevelGenerator {
    constructor() {
        this.gridSize = GRID_SIZE;
    }

    generate(level) {
        const grid = Array(this.gridSize).fill(null)
            .map(() => Array(this.gridSize).fill('.'));

        // Параметры сложности (scaling бесконечно)
        const difficulty = Math.min(level - 1, 15); // cap на уровне 16
        const steelChance = Math.min(0.05 + difficulty * 0.015, 0.25);
        const fortifiedChance = Math.min(0.08 + difficulty * 0.02, 0.30);

        // 1. База у нижней границы (утоплена)
        const baseX = Math.floor(this.gridSize / 2) - 1;
        const baseY = this.gridSize - 2; // 🆕 прижата к нижней границе
        this._placeBase(grid, baseX, baseY);

        // 2. Игрок рядом с базой
        grid[baseY - 2][baseX] = 'P';

        // 3. Защитные стены вокруг базы
        this._placeBaseDefenses(grid, baseX, baseY);

        // 4. Спавны врагов сверху
        this._placeEnemySpawns(grid);

        // 5. 🆕 Структурированные слои обороны
        const defenseLines = 3 + Math.floor(difficulty / 3);
        this._generateDefenseLines(grid, defenseLines, steelChance, fortifiedChance);

        // 6. 🆕 Комнаты и кластеры между линиями
        this._generateRooms(grid, difficulty, steelChance, fortifiedChance);

        // 7. Водные препятствия (структурированно)
        const waterPools = 1 + Math.floor(difficulty / 2);
        this._generateWaterPools(grid, waterPools);

        // 8. Кусты (группами)
        const bushClusters = 2 + Math.floor(difficulty / 2);
        this._generateBushClusters(grid, bushClusters);

        // 9. Гарантируем проходимость
        this._ensurePassability(grid, baseX, baseY);

        return grid.map(row => row.join(''));
    }

    _placeBase(grid, baseX, baseY) {
        // База 2x2 в нижних строках
        for (let dy = 0; dy < 2; dy++) {
            for (let dx = 0; dx < 2; dx++) {
                if (this._isValid(grid, baseX + dx, baseY + dy)) {
                    grid[baseY + dy][baseX + dx] = 'B';
                }
            }
        }
    }

    _placeBaseDefenses(grid, baseX, baseY) {
        // Укреплённые стены вокруг базы
        const defenses = [
            // Верхняя линия защиты
            [baseY - 1, baseX - 1], [baseY - 1, baseX],
            [baseY - 1, baseX + 1], [baseY - 1, baseX + 2],
            // Боковые стены
            [baseY, baseX - 1], [baseY + 1, baseX - 1],
            [baseY, baseX + 2], [baseY + 1, baseX + 2],
        ];

        for (const [y, x] of defenses) {
            if (this._isValid(grid, x, y) && grid[y][x] === '.') {
                grid[y][x] = '@';
            }
        }
    }

    _placeEnemySpawns(grid) {
        // 3 спавна в верхней части
        const spawns = [
            [2, 1],
            [2, Math.floor(this.gridSize / 2)],
            [2, this.gridSize - 2]
        ];
        for (const [y, x] of spawns) {
            if (this._isValid(grid, x, y)) grid[y][x] = 'E';
        }
    }

    /**
     * 🆕 Горизонтальные линии обороны с проходами.
     * Гарантируют структурированность карты.
     */
    _generateDefenseLines(grid, count, steelChance, fortifiedChance) {
        // Равномерно распределяем линии по карте (между спавнами и базой)
        const startY = 5;
        const endY = this.gridSize - 6;
        const spacing = (endY - startY) / (count + 1);

        for (let i = 0; i < count; i++) {
            const lineY = Math.round(startY + spacing * (i + 1));

            // 1-3 прохода в линии
            const passageCount = 1 + Math.floor(Math.random() * 3);
            const passages = new Set();
            for (let p = 0; p < passageCount; p++) {
                const px = 2 + Math.floor(Math.random() * (this.gridSize - 4));
                passages.add(px);
                passages.add(px + 1); // широкий проход (2 тайла)
            }

            // Размещаем стену
            for (let x = 1; x < this.gridSize - 1; x++) {
                if (passages.has(x)) continue;
                if (grid[lineY][x] !== '.') continue;

                const rand = Math.random();
                if (rand < steelChance) grid[lineY][x] = '=';
                else if (rand < steelChance + fortifiedChance) grid[lineY][x] = '@';
                else grid[lineY][x] = '#';

                // Иногда добавляем второй ряд для толщины
                if (Math.random() < 0.3 && this._isValid(grid, x, lineY + 1) && grid[lineY + 1][x] === '.') {
                    grid[lineY + 1][x] = grid[lineY][x];
                }
            }
        }
    }

    /**
     * 🆕 Комнаты и кластеры между линиями обороны.
     */
    _generateRooms(grid, difficulty, steelChance, fortifiedChance) {
        const roomCount = 3 + Math.floor(difficulty / 2);

        for (let i = 0; i < roomCount; i++) {
            const roomX = 2 + Math.floor(Math.random() * (this.gridSize - 6));
            const roomY = 4 + Math.floor(Math.random() * (this.gridSize - 10));
            const roomW = 2 + Math.floor(Math.random() * 3); // 2-4
            const roomH = 2 + Math.floor(Math.random() * 2); // 2-3

            // Тип комнаты
            const roomType = Math.random();

            if (roomType < 0.4) {
                // Сплошной блок
                this._fillRect(grid, roomX, roomY, roomW, roomH, steelChance, fortifiedChance);
            } else if (roomType < 0.7) {
                // П-образная структура
                this._fillRect(grid, roomX, roomY, roomW, 1, steelChance, fortifiedChance);
                this._fillRect(grid, roomX, roomY, 1, roomH, steelChance, fortifiedChance);
                this._fillRect(grid, roomX + roomW - 1, roomY, 1, roomH, steelChance, fortifiedChance);
            } else {
                // L-образная структура
                this._fillRect(grid, roomX, roomY, roomW, 1, steelChance, fortifiedChance);
                this._fillRect(grid, roomX, roomY, 1, roomH, steelChance, fortifiedChance);
            }
        }
    }

    _fillRect(grid, x, y, w, h, steelChance, fortifiedChance) {
        for (let dy = 0; dy < h; dy++) {
            for (let dx = 0; dx < w; dx++) {
                const px = x + dx, py = y + dy;
                if (!this._isValid(grid, px, py)) continue;
                if (grid[py][px] !== '.') continue;
                if (this._isInProtectedZone(px, py)) continue;

                const rand = Math.random();
                if (rand < steelChance) grid[py][px] = '=';
                else if (rand < steelChance + fortifiedChance) grid[py][px] = '@';
                else grid[py][px] = '#';
            }
        }
    }

    _generateWaterPools(grid, count) {
        for (let i = 0; i < count; i++) {
            const poolX = 3 + Math.floor(Math.random() * (this.gridSize - 8));
            const poolY = 5 + Math.floor(Math.random() * (this.gridSize - 12));
            const poolW = 2 + Math.floor(Math.random() * 2);
            const poolH = 2 + Math.floor(Math.random() * 2);

            for (let dy = 0; dy < poolH; dy++) {
                for (let dx = 0; dx < poolW; dx++) {
                    const x = poolX + dx, y = poolY + dy;
                    if (this._isValid(grid, x, y) && grid[y][x] === '.') {
                        grid[y][x] = '~';
                    }
                }
            }
        }
    }

    _generateBushClusters(grid, count) {
        for (let i = 0; i < count; i++) {
            const bx = 2 + Math.floor(Math.random() * (this.gridSize - 5));
            const by = 3 + Math.floor(Math.random() * (this.gridSize - 8));
            const bw = 2 + Math.floor(Math.random() * 3);
            const bh = 2;

            for (let dy = 0; dy < bh; dy++) {
                for (let dx = 0; dx < bw; dx++) {
                    const x = bx + dx, y = by + dy;
                    if (this._isValid(grid, x, y) && grid[y][x] === '.') {
                        grid[y][x] = '*';
                    }
                }
            }
        }
    }

    _ensurePassability(grid, baseX, baseY) {
        const spawns = [
            [1, 2],
            [Math.floor(this.gridSize / 2), 2],
            [this.gridSize - 2, 2]
        ];

        for (const [startX, startY] of spawns) {
            const path = this._findPath(grid, startX, startY, baseX, baseY);
            if (path.length === 0) {
                this._clearPathToBase(grid, startX, startY, baseX, baseY);
            }
        }
    }

    _findPath(grid, startX, startY, targetX, targetY) {
        const queue = [{ x: startX, y: startY, path: [] }];
        const visited = new Set();
        visited.add(`${startX},${startY}`);

        const directions = [
            { dx: 0, dy: -1 }, { dx: 1, dy: 0 },
            { dx: 0, dy: 1 }, { dx: -1, dy: 0 }
        ];

        let iterations = 0;
        const maxIterations = 2000;

        while (queue.length > 0 && iterations < maxIterations) {
            iterations++;
            const current = queue.shift();

            const dist = Math.abs(current.x - targetX) + Math.abs(current.y - targetY);
            if (dist <= 3) return current.path;

            for (const { dx, dy } of directions) {
                const nx = current.x + dx, ny = current.y + dy;
                const key = `${nx},${ny}`;

                if (visited.has(key)) continue;
                if (!this._isValid(grid, nx, ny)) continue;

                const cell = grid[ny][nx];
                if (cell === '#' || cell === '=' || cell === '@' || cell === '~') continue;

                visited.add(key);
                queue.push({ x: nx, y: ny, path: [...current.path, { x: nx, y: ny }] });
            }
        }
        return [];
    }

    _clearPathToBase(grid, startX, startY, targetX, targetY) {
        // Используем BFS чтобы найти кратчайший путь с минимальным удалением стен
        const queue = [{ x: startX, y: startY, wallsToRemove: [] }];
        const visited = new Map();
        visited.set(`${startX},${startY}`, []);

        const directions = [
            { dx: 0, dy: -1 }, { dx: 1, dy: 0 },
            { dx: 0, dy: 1 }, { dx: -1, dy: 0 }
        ];

        let bestPath = null;
        let iterations = 0;

        while (queue.length > 0 && iterations < 3000) {
            iterations++;
            const current = queue.shift();

            const dist = Math.abs(current.x - targetX) + Math.abs(current.y - targetY);
            if (dist <= 3) {
                if (!bestPath || current.wallsToRemove.length < bestPath.length) {
                    bestPath = current.wallsToRemove;
                }
                continue;
            }

            for (const { dx, dy } of directions) {
                const nx = current.x + dx, ny = current.y + dy;
                if (!this._isValid(grid, nx, ny)) continue;

                const key = `${nx},${ny}`;
                const cell = grid[ny][nx];
                let newWalls = [...current.wallsToRemove];

                if (cell === '#' || cell === '@') {
                    newWalls.push({ x: nx, y: ny });
                } else if (cell === '=' || cell === '~' || cell === 'B') {
                    continue; // не трогаем сталь, воду, базу
                }

                const existing = visited.get(key);
                if (!existing || newWalls.length < existing.length) {
                    visited.set(key, newWalls);
                    queue.push({ x: nx, y: ny, wallsToRemove: newWalls });
                }
            }
        }

        if (bestPath) {
            for (const { x, y } of bestPath) {
                grid[y][x] = '.';
            }
        } else {
            // Fallback: прямая линия
            const dx = targetX - startX;
            const dy = targetY - startY;
            const steps = Math.max(Math.abs(dx), Math.abs(dy));
            for (let i = 0; i <= steps; i++) {
                const x = Math.round(startX + (dx * i) / steps);
                const y = Math.round(startY + (dy * i) / steps);
                if (this._isValid(grid, x, y)) {
                    const cell = grid[y][x];
                    if (cell === '#' || cell === '@') grid[y][x] = '.';
                }
            }
        }
    }

    _isInProtectedZone(x, y) {
        if (y < 3) return true;
        if (y >= this.gridSize - 4) {
            const centerX = Math.floor(this.gridSize / 2);
            if (x >= centerX - 3 && x <= centerX + 3) return true;
        }
        return false;
    }

    _isValid(grid, x, y) {
        return x >= 0 && x < this.gridSize && y >= 0 && y < this.gridSize;
    }
}