import { DIRECTIONS, BULLET_SIZE } from '../config/constants.js';
import { rectsOverlap } from '../core/utils.js';

export class Bullet {
    constructor(x, y, direction, isPlayer, speed = 7, ricochet = false) {
        this.x = x;
        this.y = y;
        this.isPlayer = isPlayer;
        this.width = BULLET_SIZE;
        this.height = BULLET_SIZE;
        this.isActive = true;
        this.ricochet = ricochet;
        this.bounces = 0;
        this.maxBounces = ricochet ? 10 : 0;
        this.trail = [];

        switch (direction) {
            case DIRECTIONS.UP:    this.vx = 0; this.vy = -speed; break;
            case DIRECTIONS.RIGHT: this.vx = speed; this.vy = 0; break;
            case DIRECTIONS.DOWN:  this.vx = 0; this.vy = speed; break;
            case DIRECTIONS.LEFT:  this.vx = -speed; this.vy = 0; break;
        }
    }

    update(dt, state, canvas, onHit) {
        if (this.ricochet) {
            this.trail.push({ x: this.x + this.width / 2, y: this.y + this.height / 2 });
            if (this.trail.length > 6) this.trail.shift();
        }

        this.x += this.vx * dt;
        this.y += this.vy * dt;

        // Границы canvas
        let hitBoundary = null;
        if (this.x < 0) { this.x = 0; hitBoundary = 'x'; }
        else if (this.x + this.width > canvas.width) { this.x = canvas.width - this.width; hitBoundary = 'x'; }
        if (this.y < 0) { this.y = 0; hitBoundary = hitBoundary || 'y'; }
        else if (this.y + this.height > canvas.height) { this.y = canvas.height - this.height; hitBoundary = hitBoundary || 'y'; }

        if (hitBoundary) {
            if (this.ricochet && this.bounces < this.maxBounces) {
                if (hitBoundary === 'x') this.vx = -this.vx;
                if (hitBoundary === 'y') this.vy = -this.vy;
                this.bounces++;
            } else {
                this.isActive = false;
                return;
            }
        }

        const bulletRect = { x: this.x, y: this.y, width: this.width, height: this.height };

        // Стены
        for (const wall of state.walls) {
            if (wall.hp <= 0) continue;
            if (rectsOverlap(bulletRect, wall.getRect())) {
                if (this.ricochet) {
                    this._performRicochet(wall.getRect());
                    onHit.wall?.(wall, true); // true = рикошет, стена не повреждена
                    return;
                } else {
                    if (wall.type === 'steel') {
                        onHit.wall?.(wall, false);
                        this.isActive = false;
                    } else {
                        wall.hp--;
                        onHit.wall?.(wall, false);
                        this.isActive = false;
                    }
                    return;
                }
            }
        }

        // База
        if (state.base && !state.base.isDestroyed && rectsOverlap(bulletRect, state.base.getRect())) {
            this.isActive = false;
            onHit.base();
            return;
        }

        // Танки
        const tanks = this.isPlayer ? state.enemies : (state.player ? [state.player] : []);
        for (const tank of tanks) {
            if (!tank || !tank.isActive) continue;
            if (rectsOverlap(bulletRect, { x: tank.x, y: tank.y, width: tank.width, height: tank.height })) {
                this.isActive = false;
                if (this.isPlayer) {
                    if (tank.spawnInvincible > 0) return;
                    onHit.enemy(tank);
                } else {
                    if (tank.spawnInvincible > 0) return;
                    onHit.player(tank);
                }
                return;
            }
        }
    }

    _performRicochet(wallRect) {
        const bulletRect = { x: this.x, y: this.y, width: this.width, height: this.height };
        const overlapX = Math.min(bulletRect.x + bulletRect.width, wallRect.x + wallRect.width) -
                         Math.max(bulletRect.x, wallRect.x);
        const overlapY = Math.min(bulletRect.y + bulletRect.height, wallRect.y + wallRect.height) -
                         Math.max(bulletRect.y, wallRect.y);

        if (overlapX < overlapY) {
            this.vx = -this.vx;
            this.x = this.vx > 0 ? wallRect.x + wallRect.width : wallRect.x - this.width;
        } else {
            this.vy = -this.vy;
            this.y = this.vy > 0 ? wallRect.y + wallRect.height : wallRect.y - this.height;
        }
        this.bounces++;
        if (this.bounces >= this.maxBounces) this.isActive = false;
    }

    draw(ctx) {
        if (!this.isActive) return;

        if (this.ricochet) {
            if (this.trail.length > 1) {
                ctx.strokeStyle = 'rgba(255, 0, 255, 0.3)';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(this.trail[0].x, this.trail[0].y);
                for (let i = 1; i < this.trail.length; i++) {
                    ctx.lineTo(this.trail[i].x, this.trail[i].y);
                }
                ctx.stroke();
            }

            const cx = this.x + this.width / 2;
            const cy = this.y + this.height / 2;
            const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, this.width * 2);
            gradient.addColorStop(0, 'rgba(255, 0, 255, 0.8)');
            gradient.addColorStop(0.5, 'rgba(255, 100, 255, 0.3)');
            gradient.addColorStop(1, 'rgba(255, 0, 255, 0)');
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(cx, cy, this.width * 2, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#FF00FF';
            ctx.beginPath();
            ctx.arc(cx, cy, this.width * 0.8, 0, Math.PI * 2);
            ctx.fill();

            ctx.strokeStyle = '#FFF';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.arc(cx, cy, this.width * 0.5, 0, Math.PI * 2);
            ctx.stroke();
        } else {
            ctx.fillStyle = this.isPlayer ? '#4FC3F7' : '#FFD740';
            ctx.fillRect(this.x, this.y, this.width, this.height);
        }
    }
}