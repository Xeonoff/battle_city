import { DIRECTIONS, TILE_SIZE } from '../config/constants.js';

/**
 * Поток огня от танка-огнемётчика.
 * Следует за владельцем, поворачивается с ним, состоит из разлетающихся партиклов.
 */
export class FlameStream {
    constructor(owner) {
        this.owner = owner; // ссылка на танк-владелец
        this.isActive = true;
        this.isSpawning = true;
        this.spawnTime = Date.now();
        this.duration = 2000; // 2 секунды активного горения

        // 🆕 Система партиклов
        this.particles = [];
        this.lastSpawnTime = 0;
        this.spawnInterval = 40; // новый залп каждые 40мс

        // 🆕 Система урона (тики 2 раза в секунду)
        this.lastDamageTime = 0;
        this.damageInterval = 500;
        this.damage = 1;
        this.range = TILE_SIZE * 4;
        this.coneAngle = Math.PI / 9;

        // Отслеживаем каких танков уже повредили в текущем тике
        // чтобы не наносить множественный урон одним залпом
        this.hitThisTick = new Set();
    }

    update(dt, state, onHit) {
        const now = Date.now();
        const elapsed = now - this.spawnTime;

        // Проверка: жив ли владелец
        if (!this.owner || !this.owner.isActive) {
            this.isSpawning = false;
        }

        // Прекращаем спавн после duration (но партиклы продолжают жить)
        if (elapsed > this.duration) {
            this.isSpawning = false;
        }

        // Спавн новых партиклов (ТОЛЬКО пока isSpawning)
        if (this.isSpawning && now - this.lastSpawnTime > this.spawnInterval) {
            this.lastSpawnTime = now;
            this._spawnParticleBurst();
        }

        for (const p of this.particles) {
            p.x += p.vx * dt;
            p.y += p.vy * dt;
            p.life -= dt;
            // Лёгкое "расширение" огненного потока
            p.vx *= Math.pow(0.985, dt);
            p.vy *= Math.pow(0.985, dt);
            // Дым поднимается вверх со временем
            if (p.life / p.maxLife < 0.5) {
                p.vy -= 0.02 * dt;
            }
        }
        this.particles = this.particles.filter(p => p.life > 0);

        // Нанесение урона тиками (только пока активно)
        if (this.isSpawning && now - this.lastDamageTime > this.damageInterval) {
            this.lastDamageTime = now;
            this.hitThisTick.clear();
            this._applyDamage(state, onHit);
        }

        // 🆕 Помечаем неактивным ТОЛЬКО когда всё догорело
        if (!this.isSpawning && this.particles.length === 0) {
            this.isActive = false;
        }
    }

    _spawnParticleBurst() {
        const owner = this.owner;
        // Точка "дула" — перед танком в направлении его движения
        const cx = owner.x + owner.width / 2;
        const cy = owner.y + owner.height / 2;

        let muzzleX = cx, muzzleY = cy;
        let baseAngle;
        switch (owner.direction) {
            case DIRECTIONS.UP:
                muzzleY -= owner.height / 2;
                baseAngle = -Math.PI / 2;
                break;
            case DIRECTIONS.DOWN:
                muzzleY += owner.height / 2;
                baseAngle = Math.PI / 2;
                break;
            case DIRECTIONS.LEFT:
                muzzleX -= owner.width / 2;
                baseAngle = Math.PI;
                break;
            case DIRECTIONS.RIGHT:
                muzzleX += owner.width / 2;
                baseAngle = 0;
                break;
        }

        // Спавним 3-5 партиклов с разбросом
        const burstCount = 3 + Math.floor(Math.random() * 3);
        for (let i = 0; i < burstCount; i++) {
            // Случайный угол в пределах конуса
            const angleOffset = (Math.random() - 0.5) * this.coneAngle * 2;
            const angle = baseAngle + angleOffset;

            // Случайная скорость
            const speed = 2.5 + Math.random() * 2.5;
            const vx = Math.cos(angle) * speed;
            const vy = Math.sin(angle) * speed;

            // Случайное время жизни (в "кадрах при 60fps")
            const life = 35 + Math.random() * 25;

            // Случайное начальное смещение от дула
            const spread = Math.random() * 3;
            const px = muzzleX + Math.cos(angle) * spread;
            const py = muzzleY + Math.sin(angle) * spread;

            this.particles.push({
                x: px,
                y: py,
                vx, vy,
                life,
                maxLife: life,
                size: 2 + Math.random() * 1.5,
                maxSize: 7 + Math.random() * 3,
                // Случайный оттенок огня
                hueShift: Math.random() * 30
            });
        }
    }

    _applyDamage(state, onHit) {
        // Для каждой "живой" партиклы проверяем попадания
        for (const p of this.particles) {
            const pRect = { x: p.x - 2, y: p.y - 2, width: 4, height: 4 };

            // Урон игроку (если поток вражеский)
            if (!this.owner.isPlayer && state.player && state.player.isActive) {
                const pr = {
                    x: state.player.x, y: state.player.y,
                    width: state.player.width, height: state.player.height
                };
                if (this._checkCollision(pRect, pr) && !this.hitThisTick.has(state.player)) {
                    this.hitThisTick.add(state.player);
                    onHit.player(state.player, this.damage);
                }
            }

            // Урон врагам (если поток игрока)
            if (this.owner.isPlayer) {
                for (const enemy of state.enemies) {
                    if (!enemy.isActive) continue;
                    if (this.hitThisTick.has(enemy)) continue;
                    const er = { x: enemy.x, y: enemy.y, width: enemy.width, height: enemy.height };
                    if (this._checkCollision(pRect, er)) {
                        this.hitThisTick.add(enemy);
                        onHit.enemy(enemy, this.damage);
                    }
                }
            }
        }
    }

    _checkCollision(r1, r2) {
        return r1.x < r2.x + r2.width && r1.x + r1.width > r2.x &&
               r1.y < r2.y + r2.height && r1.y + r1.height > r2.y;
    }

    draw(ctx) {
        // Защита от отрицательных значений
        if (this.particles.length === 0) return;

        // Режим смешивания для эффекта "свечения" огня
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';

        for (const p of this.particles) {
            // 🆕 Защита: не допускаем отрицательный life ratio
            const lifeRatio = Math.max(0, p.life / p.maxLife);
            if (lifeRatio <= 0) continue;

            // Размер растёт со временем (огонь расширяется)
            const currentSize = p.size + (p.maxSize - p.size) * (1 - lifeRatio);
            if (currentSize <= 0) continue;

            // Цвет: жёлтый → оранжевый → красный → тёмно-красный
            // В зависимости от lifeRatio
            const r = 255;
            const g = Math.floor(220 * lifeRatio + 30);
            const b = Math.floor(50 * lifeRatio);
            const alpha = Math.min(0.9, lifeRatio * 1.2);

            // Свечение вокруг партикла
            const glow = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, currentSize * 1.8);
            glow.addColorStop(0, `rgba(255, 255, ${150 + p.hueShift}, ${alpha})`);
            glow.addColorStop(0.4, `rgba(${r}, ${g}, ${b}, ${alpha * 0.7})`);
            glow.addColorStop(1, `rgba(${r}, ${Math.max(0, g - 80)}, 0, 0)`);
            ctx.fillStyle = glow;
            ctx.beginPath();
            ctx.arc(p.x, p.y, currentSize * 1.8, 0, Math.PI * 2);
            ctx.fill();

            // Ядро партикла (яркое)
            ctx.fillStyle = `rgba(255, 255, ${200 + Math.floor(p.hueShift)}, ${alpha})`;
            ctx.beginPath();
            // 🆕 Защита: гарантированно положительный радиус
            ctx.arc(p.x, p.y, Math.max(0.5, currentSize * 0.5), 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore();

        ctx.save();
        for (const p of this.particles) {
            const lifeRatio = Math.max(0, p.life / p.maxLife);
            if (lifeRatio > 0.6) continue;

            const smokeAlpha = (0.6 - lifeRatio) * 0.4;
            const smokeSize = p.maxSize * (1 - lifeRatio) * 1.5;
            ctx.fillStyle = `rgba(60, 60, 60, ${smokeAlpha})`;
            ctx.beginPath();
            ctx.arc(p.x, p.y - 1, Math.max(0.5, smokeSize), 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();
    }
}