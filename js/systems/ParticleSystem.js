import { Particle } from '../entities/Particle.js';

export class ParticleSystem {
    constructor() {
        this.particles = [];
    }

    update(dt) {
        for (const p of this.particles) p.update(dt);
        this.particles = this.particles.filter(p => !p.isDead());
    }

    draw(ctx) {
        for (const p of this.particles) p.draw(ctx);
    }

    add(p) {
        this.particles.push(p);
    }

    clear() {
        this.particles = [];
    }

    // ====== Эмиттеры ======

    /** Искры от попадания в сталь / рикошета / щита */
    emitSparks(x, y, count = 12) {
        const colors = ['#FFD700', '#FFA500', '#FF6347', '#FFFF00', '#FFF'];
        for (let i = 0; i < count; i++) {
            const a = Math.random() * Math.PI * 2;
            const s = 2 + Math.random() * 5;
            this.add(new Particle({
                x, y,
                vx: Math.cos(a) * s,
                vy: Math.sin(a) * s,
                life: 18 + Math.random() * 18,
                size: 1 + Math.random() * 2,
                color: colors[Math.floor(Math.random() * colors.length)],
                shape: 'spark',
                friction: 0.88,
                gravity: 0.12
            }));
        }
    }

    /** Кирпичная крошка */
    emitBrickDebris(x, y, count = 10) {
        const colors = ['#8B4513', '#A0522D', '#5D2F0A', '#D2691E', '#6B3410'];
        for (let i = 0; i < count; i++) {
            const a = Math.random() * Math.PI * 2;
            const s = 1 + Math.random() * 3;
            this.add(new Particle({
                x, y,
                vx: Math.cos(a) * s,
                vy: Math.sin(a) * s - 1,
                life: 30 + Math.random() * 30,
                size: 2 + Math.random() * 3,
                color: colors[Math.floor(Math.random() * colors.length)],
                shape: 'square',
                friction: 0.88,
                gravity: 0.22,
                rotationSpeed: (Math.random() - 0.5) * 0.4
            }));
        }
    }

    /** Бетонная пыль от укреплённой стены */
    emitConcreteDust(x, y, count = 12) {
        const colors = ['#9E9E9E', '#BDBDBD', '#757575', '#616161'];
        for (let i = 0; i < count; i++) {
            const a = Math.random() * Math.PI * 2;
            const s = 1 + Math.random() * 2.5;
            this.add(new Particle({
                x, y,
                vx: Math.cos(a) * s,
                vy: Math.sin(a) * s,
                life: 35 + Math.random() * 25,
                size: 1 + Math.random() * 2,
                color: colors[Math.floor(Math.random() * colors.length)],
                shape: 'circle',
                friction: 0.93,
                gravity: 0.08
            }));
        }
        // Небольшие осколки
        for (let i = 0; i < count / 2; i++) {
            const a = Math.random() * Math.PI * 2;
            const s = 2 + Math.random() * 3;
            this.add(new Particle({
                x, y,
                vx: Math.cos(a) * s,
                vy: Math.sin(a) * s - 0.5,
                life: 25 + Math.random() * 20,
                size: 2 + Math.random() * 2,
                color: '#424242',
                shape: 'square',
                friction: 0.9,
                gravity: 0.25,
                rotationSpeed: (Math.random() - 0.5) * 0.5
            }));
        }
    }

    /** Взрыв танка / базы */
    emitExplosion(x, y, count = 30) {
        // Огненное ядро (быстрые крупные частицы)
        const fireColors = ['#FFF8DC', '#FFD700', '#FFA500', '#FF6347', '#FF4500', '#8B0000'];
        for (let i = 0; i < count; i++) {
            const a = Math.random() * Math.PI * 2;
            const s = 1 + Math.random() * 5;
            this.add(new Particle({
                x, y,
                vx: Math.cos(a) * s,
                vy: Math.sin(a) * s,
                life: 25 + Math.random() * 30,
                size: 3 + Math.random() * 5,
                color: fireColors[Math.floor(Math.random() * fireColors.length)],
                shape: 'circle',
                friction: 0.9,
                gravity: 0.05
            }));
        }
        // Дым (медленно поднимается)
        for (let i = 0; i < count / 2; i++) {
            const a = Math.random() * Math.PI * 2;
            const s = 0.5 + Math.random() * 1.5;
            this.add(new Particle({
                x, y,
                vx: Math.cos(a) * s,
                vy: Math.sin(a) * s - 0.5,
                life: 50 + Math.random() * 40,
                size: 5 + Math.random() * 6,
                color: ['#2C2C2C', '#424242', '#555', '#1A1A1A'][Math.floor(Math.random() * 4)],
                shape: 'circle',
                friction: 0.96,
                gravity: -0.04
            }));
        }
        // Металлические осколки
        for (let i = 0; i < count / 3; i++) {
            const a = Math.random() * Math.PI * 2;
            const s = 3 + Math.random() * 4;
            this.add(new Particle({
                x, y,
                vx: Math.cos(a) * s,
                vy: Math.sin(a) * s - 1,
                life: 40 + Math.random() * 30,
                size: 2 + Math.random() * 2,
                color: ['#555', '#777', '#333'][Math.floor(Math.random() * 3)],
                shape: 'square',
                friction: 0.92,
                gravity: 0.25,
                rotationSpeed: (Math.random() - 0.5) * 0.6
            }));
        }
    }

    /** Партиклы подбора бонуса */
    emitBonusPickup(x, y, color) {
        // Цветные искры
        for (let i = 0; i < 18; i++) {
            const a = Math.random() * Math.PI * 2;
            const s = 2 + Math.random() * 3;
            this.add(new Particle({
                x, y,
                vx: Math.cos(a) * s,
                vy: Math.sin(a) * s - 1,
                life: 35 + Math.random() * 25,
                size: 2 + Math.random() * 2,
                color: color,
                shape: 'circle',
                friction: 0.9,
                gravity: 0.1
            }));
        }
        // Золотые "звёздочки" по кругу
        for (let i = 0; i < 8; i++) {
            const a = (i / 8) * Math.PI * 2;
            this.add(new Particle({
                x, y,
                vx: Math.cos(a) * 4,
                vy: Math.sin(a) * 4,
                life: 40,
                size: 2.5,
                color: '#FFFF00',
                shape: 'spark',
                friction: 0.88
            }));
        }
    }

    /** Лёгкий эффект от пули, пролетающей сквозь кусты */
    emitLeaves(x, y, count = 3) {
        const colors = ['#228B22', '#3CB371', '#2E8B57', '#6B8E23'];
        for (let i = 0; i < count; i++) {
            const a = Math.random() * Math.PI * 2;
            const s = 0.5 + Math.random() * 1;
            this.add(new Particle({
                x, y,
                vx: Math.cos(a) * s,
                vy: Math.sin(a) * s - 0.3,
                life: 50 + Math.random() * 30,
                size: 2 + Math.random() * 2,
                color: colors[Math.floor(Math.random() * colors.length)],
                shape: 'circle',
                friction: 0.95,
                gravity: 0.05,
                rotationSpeed: (Math.random() - 0.5) * 0.2
            }));
        }
    }
}