import { DIRECTIONS } from '../config/constants.js';

/**
 * Рендерер танков в стиле детализированного пиксель-арта.
 * Каждый тип танка имеет уникальный визуальный стиль.
 */
export class TankRenderer {
    constructor() {
        // Кэш для предрасчётов
        this.time = 0;
    }

    draw(ctx, tank, state) {
        if (!tank.isActive) return;

        this.time = Date.now();

        // === Эффекты баффов (под танком) ===
        this._drawBuffEffects(ctx, tank, state);

        // Мигание при уроне
        if (tank.flashTimer > 0 && Math.floor(tank.flashTimer) % 4 < 2) return;
        // Мигание при спавне
        if (tank.spawnInvincible > 0 && Math.floor(this.time / 150) % 2 === 0) {
            ctx.globalAlpha = 0.5;
        }

        // Рисуем танк с поворотом в направлении движения
        ctx.save();
        ctx.translate(tank.x + tank.width / 2, tank.y + tank.height / 2);
        ctx.rotate((tank.direction * Math.PI) / 2);
        ctx.translate(-tank.width / 2, -tank.height / 2);

        // Вызываем специфичный для типа рендер
        if (tank.isPlayer) {
            this._drawPlayer(ctx, tank);
        } else {
            switch (tank.type) {
                case 'basic': this._drawBasic(ctx, tank); break;
                case 'fast': this._drawFast(ctx, tank); break;
                case 'heavy': this._drawHeavy(ctx, tank); break;
                case 'power': this._drawPower(ctx, tank); break;
                case 'flamethrower': this._drawFlamethrower(ctx, tank); break;
                default: this._drawBasic(ctx, tank);
            }
        }

        ctx.restore();
        ctx.globalAlpha = 1;

        // HP бар (над танком, без поворота)
        if (!tank.isPlayer && tank.maxHp > 1) {
            this._drawHpBar(ctx, tank);
        }
    }

    // ========================================
    // === ЭФФЕКТЫ БАФФОВ (кольца вокруг) ===
    // ========================================
    _drawBuffEffects(ctx, tank, state) {
        const cx = tank.x + tank.width / 2;
        const cy = tank.y + tank.height / 2;

        if (tank.isPlayer && state.playerBuffs.shield.active) {
            const remaining = state.playerBuffs.shield.endTime - this.time;
            const alpha = Math.min(0.8, Math.max(0.3, remaining / 10000));
            const pulse = Math.sin(this.time / 100) * 2;

            // Внешнее кольцо
            ctx.strokeStyle = `rgba(33, 150, 243, ${alpha * 0.6})`;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(cx, cy, tank.width * 0.9 + pulse, 0, Math.PI * 2);
            ctx.stroke();

            // Внутреннее свечение
            ctx.strokeStyle = `rgba(33, 150, 243, ${alpha})`;
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(cx, cy, tank.width * 0.75 + pulse, 0, Math.PI * 2);
            ctx.stroke();

            // Блёстки по кругу
            for (let i = 0; i < 6; i++) {
                const angle = (this.time / 500) + (i * Math.PI) / 3;
                const sx = cx + Math.cos(angle) * tank.width * 0.85;
                const sy = cy + Math.sin(angle) * tank.width * 0.85;
                ctx.fillStyle = `rgba(144, 202, 249, ${alpha})`;
                ctx.beginPath();
                ctx.arc(sx, sy, 1.5, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        if (tank.isPlayer && state.playerBuffs.star.active) {
            const pulse = Math.sin(this.time / 80);
            ctx.strokeStyle = `rgba(255, 193, 7, ${0.4 + pulse * 0.2})`;
            ctx.lineWidth = 2;
            ctx.beginPath();
            // Звездообразная форма
            for (let i = 0; i < 8; i++) {
                const angle = (i * Math.PI) / 4 + this.time / 300;
                const r = tank.width * 0.9 + (i % 2 === 0 ? pulse * 2 : 0);
                const sx = cx + Math.cos(angle) * r;
                const sy = cy + Math.sin(angle) * r;
                if (i === 0) ctx.moveTo(sx, sy);
                else ctx.lineTo(sx, sy);
            }
            ctx.closePath();
            ctx.stroke();
        }
    }

    // ========================================
    // === ИГРОК (зелёный с камуфляжем) ===
    // ========================================
    _drawPlayer(ctx, tank) {
        const w = tank.width, h = tank.height;

        ctx.fillStyle = '#2a2a2a';
        ctx.fillRect(0, 2, 4, h - 4);
        ctx.fillRect(w - 4, 2, 4, h - 4);

        ctx.fillStyle = '#1a1a1a';
        const offset = (this.time / 50) % 4;
        for (let i = 0; i < h - 4; i += 4) {
            const y = 2 + ((i + offset) % (h - 4));
            ctx.fillRect(0, y, 4, 1);
            ctx.fillRect(w - 4, y, 4, 1);
        }

        ctx.fillStyle = '#4CAF50';
        ctx.fillRect(4, 4, w - 8, h - 8);

        // Камуфляж пятна
        ctx.fillStyle = '#388E3C';
        ctx.fillRect(6, 6, 5, 3);
        ctx.fillRect(13, 9, 4, 4);
        ctx.fillRect(7, 14, 5, 3);
        ctx.fillRect(14, 16, 3, 3);

        // Светлые блики
        ctx.fillStyle = '#66BB6A';
        ctx.fillRect(5, 5, 2, 1);
        ctx.fillRect(15, 5, 2, 1);

        // Башня (круглая)
        ctx.fillStyle = '#2E7D32';
        ctx.beginPath();
        ctx.arc(w / 2, h / 2, 5, 0, Math.PI * 2);
        ctx.fill();

        // Обводка башни
        ctx.strokeStyle = '#1B5E20';
        ctx.lineWidth = 1;
        ctx.stroke();

        // Люк на башне
        ctx.fillStyle = '#1B5E20';
        ctx.fillRect(w / 2 - 1, h / 2 - 1, 2, 2);

        // Пушка (ствол)
        ctx.fillStyle = '#1B5E20';
        ctx.fillRect(w / 2 - 1.5, -3, 3, 8);
        // Дуло (наконечник)
        ctx.fillStyle = '#000';
        ctx.fillRect(w / 2 - 2, -4, 4, 2);

        if (tank.isMoving) {
            const smokeAlpha = 0.3 + Math.random() * 0.3;
            ctx.fillStyle = `rgba(150, 150, 150, ${smokeAlpha})`;
            ctx.beginPath();
            ctx.arc(w / 2 + (Math.random() - 0.5) * 2, h + 2, 1.5 + Math.random(), 0, Math.PI * 2);
            ctx.fill();
        }
    }

    // ========================================
    // === BASIC (классический красный) ===
    // ========================================
    _drawBasic(ctx, tank) {
        const w = tank.width, h = tank.height;

        // Гусеницы
        ctx.fillStyle = '#1a1a1a';
        ctx.fillRect(0, 3, 4, h - 6);
        ctx.fillRect(w - 4, 3, 4, h - 6);

        // Насечки
        ctx.fillStyle = '#000';
        const offset = (this.time / 60) % 4;
        for (let i = 0; i < h - 6; i += 4) {
            const y = 3 + ((i + offset) % (h - 6));
            ctx.fillRect(0, y, 4, 1);
            ctx.fillRect(w - 4, y, 4, 1);
        }

        // Корпус (красный)
        ctx.fillStyle = '#E53935';
        ctx.fillRect(4, 4, w - 8, h - 8);

        // Тёмные полосы
        ctx.fillStyle = '#B71C1C';
        ctx.fillRect(4, 10, w - 8, 1);
        ctx.fillRect(4, 14, w - 8, 1);

        // Башня (квадратная)
        ctx.fillStyle = '#C62828';
        ctx.fillRect(w / 2 - 4, h / 2 - 4, 8, 8);

        // Болты
        ctx.fillStyle = '#4a4a4a';
        ctx.fillRect(w / 2 - 3, h / 2 - 3, 1, 1);
        ctx.fillRect(w / 2 + 2, h / 2 - 3, 1, 1);
        ctx.fillRect(w / 2 - 3, h / 2 + 2, 1, 1);
        ctx.fillRect(w / 2 + 2, h / 2 + 2, 1, 1);

        // Пушка
        ctx.fillStyle = '#4a4a4a';
        ctx.fillRect(w / 2 - 1, -2, 2, 7);
        ctx.fillStyle = '#000';
        ctx.fillRect(w / 2 - 1.5, -3, 3, 1.5);
    }

    // ========================================
    // === FAST (фиолетовый с неоновыми полосами) ===
    // ========================================
    _drawFast(ctx, tank) {
        const w = tank.width, h = tank.height;

        // Узкие быстрые гусеницы
        ctx.fillStyle = '#1a1a1a';
        ctx.fillRect(1, 4, 3, h - 8);
        ctx.fillRect(w - 4, 4, 3, h - 8);

        // Быстрые насечки (чаще)
        ctx.fillStyle = '#000';
        const offset = (this.time / 30) % 3;
        for (let i = 0; i < h - 8; i += 3) {
            const y = 4 + ((i + offset) % (h - 8));
            ctx.fillRect(1, y, 3, 1);
            ctx.fillRect(w - 4, y, 3, 1);
        }

        // Аэродинамичный корпус (со скошенными углами)
        ctx.fillStyle = '#AB47BC';
        ctx.beginPath();
        ctx.moveTo(5, 5);
        ctx.lineTo(w - 5, 5);
        ctx.lineTo(w - 4, h - 5);
        ctx.lineTo(4, h - 5);
        ctx.closePath();
        ctx.fill();

        // Неоновые полосы (гоночные)
        const stripePulse = Math.sin(this.time / 100) * 0.3 + 0.7;
        ctx.fillStyle = `rgba(255, 64, 129, ${stripePulse})`;
        ctx.fillRect(6, 8, w - 12, 1);
        ctx.fillRect(6, 11, w - 12, 1);
        ctx.fillRect(6, 16, w - 12, 1);

        // Центральная линия
        ctx.fillStyle = '#FF4081';
        ctx.fillRect(w / 2, 6, 1, h - 12);

        // Острая башня (ромб)
        ctx.fillStyle = '#7B1FA2';
        ctx.beginPath();
        ctx.moveTo(w / 2, h / 2 - 5);
        ctx.lineTo(w / 2 + 4, h / 2);
        ctx.lineTo(w / 2, h / 2 + 5);
        ctx.lineTo(w / 2 - 4, h / 2);
        ctx.closePath();
        ctx.fill();

        // Светящееся ядро
        ctx.fillStyle = `rgba(255, 105, 180, ${stripePulse})`;
        ctx.beginPath();
        ctx.arc(w / 2, h / 2, 1.5, 0, Math.PI * 2);
        ctx.fill();

        // Длинная пушка
        ctx.fillStyle = '#4A148C';
        ctx.fillRect(w / 2 - 1, -4, 2, 9);
        // Острый наконечник
        ctx.fillStyle = '#FF4081';
        ctx.beginPath();
        ctx.moveTo(w / 2, -5);
        ctx.lineTo(w / 2 - 1.5, -3);
        ctx.lineTo(w / 2 + 1.5, -3);
        ctx.closePath();
        ctx.fill();

        // Выхлоп пламени при движении
        if (tank.isMoving) {
            ctx.fillStyle = `rgba(255, 105, 180, ${0.5 + Math.random() * 0.3})`;
            ctx.beginPath();
            ctx.moveTo(w / 2 - 2, h - 4);
            ctx.lineTo(w / 2, h + Math.random() * 2);
            ctx.lineTo(w / 2 + 2, h - 4);
            ctx.closePath();
            ctx.fill();
        }
    }

    // ========================================
    // === HEAVY (тёмно-серый, бронированный) ===
    // ========================================
    _drawHeavy(ctx, tank) {
        const w = tank.width, h = tank.height;

        // Двойные массивные гусеницы
        ctx.fillStyle = '#1a1a1a';
        ctx.fillRect(0, 2, 5, h - 4);
        ctx.fillRect(w - 5, 2, 5, h - 4);

        // Крупные насечки
        ctx.fillStyle = '#000';
        const offset = (this.time / 80) % 5;
        for (let i = 0; i < h - 4; i += 5) {
            const y = 2 + ((i + offset) % (h - 4));
            ctx.fillRect(0, y, 5, 2);
            ctx.fillRect(w - 5, y, 5, 2);
        }

        // Толстый бронированный корпус
        ctx.fillStyle = '#455A64';
        ctx.fillRect(5, 3, w - 10, h - 6);

        // Бронеплиты (горизонтальные полосы)
        ctx.fillStyle = '#37474F';
        ctx.fillRect(5, 7, w - 10, 1);
        ctx.fillRect(5, 12, w - 10, 1);
        ctx.fillRect(5, 17, w - 10, 1);

        // Заклёпки по периметру
        ctx.fillStyle = '#263238';
        const rivets = [[6, 4], [w - 7, 4], [6, h - 5], [w - 7, h - 5]];
        rivets.forEach(([rx, ry]) => {
            ctx.beginPath();
            ctx.arc(rx, ry, 1.2, 0, Math.PI * 2);
            ctx.fill();
        });

        // Массивная квадратная башня
        ctx.fillStyle = '#263238';
        ctx.fillRect(w / 2 - 5, h / 2 - 5, 10, 10);

        // Внутренняя деталь башни
        ctx.fillStyle = '#37474F';
        ctx.fillRect(w / 2 - 3, h / 2 - 3, 6, 6);

        // Пулемётная амбразура
        ctx.fillStyle = '#000';
        ctx.fillRect(w / 2 - 1, h / 2 - 1, 2, 2);

        // Толстая пушка (двойной ствол)
        ctx.fillStyle = '#1a1a1a';
        ctx.fillRect(w / 2 - 2, -3, 1.5, 8);
        ctx.fillRect(w / 2 + 0.5, -3, 1.5, 8);
        // Общий дульный срез
        ctx.fillStyle = '#000';
        ctx.fillRect(w / 2 - 2.5, -4, 5, 1.5);

        // Повреждения от попадания (визуально если HP < maxHp)
        if (tank.hp < tank.maxHp) {
            ctx.strokeStyle = '#000';
            ctx.lineWidth = 0.8;
            for (let i = 0; i < (tank.maxHp - tank.hp); i++) {
                const cx = 6 + Math.sin(i * 3) * 4;
                const cy = 8 + i * 4;
                ctx.beginPath();
                ctx.moveTo(cx, cy);
                ctx.lineTo(cx + 3, cy + 2);
                ctx.moveTo(cx + 1, cy + 1);
                ctx.lineTo(cx + 4, cy - 1);
                ctx.stroke();
            }
        }
    }

    // ========================================
    // === POWER (оранжевый с огненными деталями) ===
    // ========================================
    _drawPower(ctx, tank) {
        const w = tank.width, h = tank.height;

        // Гусеницы
        ctx.fillStyle = '#1a1a1a';
        ctx.fillRect(0, 3, 4, h - 6);
        ctx.fillRect(w - 4, 3, 4, h - 6);

        ctx.fillStyle = '#000';
        const offset = (this.time / 50) % 4;
        for (let i = 0; i < h - 6; i += 4) {
            const y = 3 + ((i + offset) % (h - 6));
            ctx.fillRect(0, y, 4, 1);
            ctx.fillRect(w - 4, y, 4, 1);
        }

        // Корпус (оранжевый)
        ctx.fillStyle = '#FF6F00';
        ctx.fillRect(4, 4, w - 8, h - 8);

        // "Радиатор" — вертикальные чёрные полосы
        ctx.fillStyle = '#3a1a00';
        for (let i = 0; i < 4; i++) {
            ctx.fillRect(6 + i * 3, 6, 1, h - 12);
        }

        // Огненные акценты (пульсирующие)
        const firePulse = Math.sin(this.time / 150) * 0.3 + 0.7;
        ctx.fillStyle = `rgba(255, 193, 7, ${firePulse})`;
        ctx.fillRect(5, h - 6, w - 10, 1);
        ctx.fillRect(5, 5, w - 10, 1);

        // Большая круглая башня
        ctx.fillStyle = '#E65100';
        ctx.beginPath();
        ctx.arc(w / 2, h / 2, 5, 0, Math.PI * 2);
        ctx.fill();

        // Ядро башни (пульсирующее)
        ctx.fillStyle = `rgba(255, 235, 59, ${firePulse})`;
        ctx.beginPath();
        ctx.arc(w / 2, h / 2, 2, 0, Math.PI * 2);
        ctx.fill();

        // Огненные "лепестки" вокруг ядра
        ctx.fillStyle = '#FF5722';
        for (let i = 0; i < 4; i++) {
            const angle = (this.time / 400) + (i * Math.PI) / 2;
            const px = w / 2 + Math.cos(angle) * 3.5;
            const py = h / 2 + Math.sin(angle) * 3.5;
            ctx.fillRect(px - 0.8, py - 0.8, 1.6, 1.6);
        }

        // Массивная широкая пушка
        ctx.fillStyle = '#3a1a00';
        ctx.fillRect(w / 2 - 2, -4, 4, 9);
        // Огненный наконечник
        ctx.fillStyle = `rgba(255, 152, 0, ${firePulse})`;
        ctx.fillRect(w / 2 - 2.5, -5, 5, 2);
        ctx.fillStyle = '#FFEB3B';
        ctx.fillRect(w / 2 - 1, -5, 2, 1);
    }
    _drawFlamethrower(ctx, tank) {
        const w = tank.width, h = tank.height;

        // Массивные гусеницы
        ctx.fillStyle = '#1a1a1a';
        ctx.fillRect(0, 3, 4, h - 6);
        ctx.fillRect(w - 4, 3, 4, h - 6);

        // Насечки
        ctx.fillStyle = '#000';
        const offset = (this.time / 70) % 4;
        for (let i = 0; i < h - 6; i += 4) {
            const y = 3 + ((i + offset) % (h - 6));
            ctx.fillRect(0, y, 4, 1);
            ctx.fillRect(w - 4, y, 4, 1);
        }

        // Корпус (тёмно-красный)
        ctx.fillStyle = '#B71C1C';
        ctx.fillRect(4, 4, w - 8, h - 8);

        // Огненные полосы-предупреждения (как у пожарной техники)
        ctx.fillStyle = '#FF6F00';
        ctx.fillRect(4, 7, w - 8, 1.5);
        ctx.fillRect(4, h - 8, w - 8, 1.5);

        // Предупреждающие полосы по диагонали (как на опасной технике)
        ctx.fillStyle = '#FFC107';
        for (let i = 0; i < 3; i++) {
            ctx.fillRect(7 + i * 4, 10, 2, 3);
            ctx.fillRect(7 + i * 4, h - 13, 2, 3);
        }

        // 🆕 БАКИ ДЛЯ ТОПЛИВА (по бокам корпуса)
        // Левый бак
        ctx.fillStyle = '#5D1F0A';
        ctx.fillRect(5, 8, 2, h - 16);
        ctx.fillStyle = '#FF5722';
        ctx.fillRect(5, 10, 2, 2);
        ctx.fillRect(5, h - 12, 2, 2);
        // Правый бак
        ctx.fillStyle = '#5D1F0A';
        ctx.fillRect(w - 7, 8, 2, h - 16);
        ctx.fillStyle = '#FF5722';
        ctx.fillRect(w - 7, 10, 2, 2);
        ctx.fillRect(w - 7, h - 12, 2, 2);

        // Заклёпки на баках
        ctx.fillStyle = '#2a0a0a';
        ctx.beginPath();
        ctx.arc(6, 13, 0.8, 0, Math.PI * 2);
        ctx.arc(6, h - 13, 0.8, 0, Math.PI * 2);
        ctx.arc(w - 6, 13, 0.8, 0, Math.PI * 2);
        ctx.arc(w - 6, h - 13, 0.8, 0, Math.PI * 2);
        ctx.fill();

        // Круглая башня (тёмно-коричневая)
        ctx.fillStyle = '#8B2500';
        ctx.beginPath();
        ctx.arc(w / 2, h / 2, 5, 0, Math.PI * 2);
        ctx.fill();

        // Внутренняя деталь башни
        ctx.fillStyle = '#5D1F0A';
        ctx.beginPath();
        ctx.arc(w / 2, h / 2, 3, 0, Math.PI * 2);
        ctx.fill();

        // 🔥 ТРУБКА ОГНЕМЁТА (длинная, тонкая)
        // Основание трубки (тёмное)
        ctx.fillStyle = '#2a1a0a';
        ctx.fillRect(w / 2 - 1.5, -5, 3, 10);
        // Сам ствол (медно-красный)
        ctx.fillStyle = '#8B3A00';
        ctx.fillRect(w / 2 - 1, -6, 2, 11);
        // Сопло (расширение на конце)
        ctx.fillStyle = '#3a1a0a';
        ctx.beginPath();
        ctx.moveTo(w / 2 - 2.5, -7);
        ctx.lineTo(w / 2 + 2.5, -7);
        ctx.lineTo(w / 2 + 1.5, -5);
        ctx.lineTo(w / 2 - 1.5, -5);
        ctx.closePath();
        ctx.fill();

        // 🔥 АНИМИРОВАННЫЙ ОГОНЁК НА СОПЛЕ (когда стреляет или "готовится")
        const timeSinceShot = Date.now() - tank.lastShotTime;
        const isFiring = timeSinceShot < 500; // в первые 500мс после выстрела — сильное пламя
        const isReady = timeSinceShot > 2500;  // когда кулдаун почти готов — тлеющий огонёк

        if (isFiring || isReady) {
            const flicker = Math.sin(this.time / 40) * 0.3 + 0.7;
            const flameSize = isFiring ? 4 : 2;
            const flameAlpha = isFiring ? 0.9 : 0.5;

            // Свечение вокруг сопла
            const glow = ctx.createRadialGradient(
                w / 2, -8, 0,
                w / 2, -8, flameSize * 2
            );
            glow.addColorStop(0, `rgba(255, 230, 100, ${flameAlpha * flicker})`);
            glow.addColorStop(0.5, `rgba(255, 140, 0, ${flameAlpha * 0.6 * flicker})`);
            glow.addColorStop(1, 'rgba(255, 60, 0, 0)');
            ctx.fillStyle = glow;
            ctx.beginPath();
            ctx.arc(w / 2, -8, flameSize * 2, 0, Math.PI * 2);
            ctx.fill();

            // Ядро огонька
            ctx.fillStyle = `rgba(255, 220, 80, ${flameAlpha * flicker})`;
            ctx.beginPath();
            ctx.arc(w / 2, -8, flameSize * 0.6, 0, Math.PI * 2);
            ctx.fill();

            // Искры (исходят от сопла)
            if (isFiring) {
                for (let i = 0; i < 3; i++) {
                    const sparkAngle = (this.time / 50 + i * 2) % 3 - 1.5;
                    const sparkDist = 3 + Math.sin(this.time / 30 + i) * 2;
                    const sx = w / 2 + Math.sin(sparkAngle) * sparkDist;
                    const sy = -8 - Math.cos(sparkAngle) * sparkDist;
                    ctx.fillStyle = `rgba(255, 200, 50, ${0.8 * flicker})`;
                    ctx.beginPath();
                    ctx.arc(sx, sy, 0.8, 0, Math.PI * 2);
                    ctx.fill();
                }
            }
        }

        // Индикатор уровня топлива (маленькая полоска сбоку башни)
        const fuelPulse = Math.sin(this.time / 300) * 0.2 + 0.8;
        ctx.fillStyle = `rgba(255, 150, 0, ${fuelPulse})`;
        ctx.fillRect(w / 2 + 4, h / 2 - 2, 1, 4);
    }
    // ========================================
    // === HP BAR (над танком) ===
    // ========================================
    _drawHpBar(ctx, tank) {
        const barWidth = tank.width;
        const barHeight = 3;
        const barY = tank.y - 6;
        const ratio = tank.hp / tank.maxHp;

        // Фон
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(tank.x - 1, barY - 1, barWidth + 2, barHeight + 2);

        // Полоса HP
        let color;
        if (ratio > 0.66) color = '#4CAF50';
        else if (ratio > 0.33) color = '#FF9800';
        else color = '#F44336';

        ctx.fillStyle = color;
        ctx.fillRect(tank.x, barY, barWidth * ratio, barHeight);

        // Разделители сегментов
        if (tank.maxHp > 1) {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
            for (let i = 1; i < tank.maxHp; i++) {
                const sx = tank.x + (barWidth / tank.maxHp) * i;
                ctx.fillRect(sx - 0.5, barY, 1, barHeight);
            }
        }
    }
}