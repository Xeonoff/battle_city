import { DIRECTIONS, TANK_SIZE, BASE_PLAYER_SPEED, BULLET_SIZE } from '../config/constants.js';
import { ENEMY_TYPES } from '../config/enemyTypes.js';
import { Bullet } from './Bullet.js';
import { rectsOverlap } from '../core/utils.js';
import { chooseBestDirection } from '../ai/EnemyAI.js';

export class Tank {
    constructor(x, y, direction, isPlayer = false, enemyType = 'BASIC') {
        this.x = x;
        this.y = y;
        this.direction = direction;
        this.isPlayer = isPlayer;
        this.width = TANK_SIZE;
        this.height = TANK_SIZE;
        this.isMoving = false;
        this.isActive = true;
        this.flashTimer = 0;
        this.lastShotTime = 0;
        this.spawnTime = Date.now();
        this.spawnInvincible = isPlayer ? 0 : 1500;
        this.lastDecisionTime = 0;
        this.decisionInterval = 300 + Math.random() * 200;

        if (isPlayer) {
            this.type = 'PLAYER';
            this.color = '#4CAF50';
            this.turretColor = '#2E7D32';
            this.hp = 1;
            this.baseSpeed = BASE_PLAYER_SPEED;
            this.shootCooldownMs = 250;
            this.baseBulletSpeed = 7;
        } else {
            const type = ENEMY_TYPES[enemyType];
            this.type = type.name;
            this.enemyTypeKey = enemyType;
            this.color = type.color;
            this.turretColor = type.turretColor;
            this.hp = type.hp;
            this.maxHp = type.hp;
            this.baseSpeed = type.speed;
            this.shootCooldownMs = type.shootCooldownMs;
            this.baseBulletSpeed = type.bulletSpeed;
            this.score = type.score;
            this.dropChance = type.dropChance;
        }
    }

    getSpeed(state) {
        if (this.isPlayer && state.playerBuffs.star.active) {
            return this.baseSpeed * 1.8;
        }
        return this.baseSpeed;
    }

    update(dt, state) {
        if (this.flashTimer > 0) this.flashTimer -= dt;
        if (this.spawnInvincible > 0) this.spawnInvincible -= dt * 16.667;

        if (!this.isPlayer && this.isActive) {
            const levelSpeedMult = 1 + (state.level - 1) * 0.05;
            this.currentSpeed = this.baseSpeed * levelSpeedMult;

            const now = Date.now();
            if (now - this.lastDecisionTime > this.decisionInterval) {
                this.lastDecisionTime = now;
                this.direction = chooseBestDirection(this, state);
            }

            const shootChance = this.type === 'power' ? 0.035 : 0.02;
            if (Math.random() < shootChance * dt) {
                this.shoot(state);
            }

            this.move(dt, state);
        }
    }

    move(dt, state) {
        let newX = this.x;
        let newY = this.y;
        const currentSpeed = this.getSpeed(state) * dt;

        switch (this.direction) {
            case DIRECTIONS.UP: newY -= currentSpeed; break;
            case DIRECTIONS.RIGHT: newX += currentSpeed; break;
            case DIRECTIONS.DOWN: newY += currentSpeed; break;
            case DIRECTIONS.LEFT: newX -= currentSpeed; break;
        }

        const blocked = this._checkWallCollision(newX, newY, state) ||
                       this._checkTankCollision(newX, newY, state);

        if (!blocked) {
            this.x = newX;
            this.y = newY;
        } else if (!this.isPlayer) {
            this.lastDecisionTime = 0;
            const oppositeDir = (this.direction + 2) % 4;
            const possibleDirs = [0, 1, 2, 3].filter(d => d !== this.direction && d !== oppositeDir);
            this.direction = possibleDirs[Math.floor(Math.random() * possibleDirs.length)];
        }

        const canvas = document.getElementById('gameCanvas');
        this.x = Math.max(0, Math.min(canvas.width - this.width, this.x));
        this.y = Math.max(0, Math.min(canvas.height - this.height, this.y));
    }

    _checkTankCollision(newX, newY, state) {
        const tankRect = { x: newX, y: newY, width: this.width, height: this.height };
        const others = [state.player, ...state.enemies].filter(t => t && t !== this && t.isActive);
        return others.some(other => rectsOverlap(tankRect, {
            x: other.x, y: other.y, width: other.width, height: other.height
        }));
    }

    _checkWallCollision(newX, newY, state) {
        const tankRect = { x: newX, y: newY, width: this.width, height: this.height };

        for (const wall of state.walls) {
            if (wall.hp > 0 && rectsOverlap(tankRect, wall.getRect())) return true;
        }
        if (state.base && !state.base.isDestroyed && rectsOverlap(tankRect, state.base.getRect())) return true;
        for (const water of state.waters) {
            if (rectsOverlap(tankRect, water.getRect())) return true;
        }
        return false;
    }

    shoot(state) {
        if (!this.isActive) return;
        const now = Date.now();
        if (now - this.lastShotTime < this.shootCooldownMs) return;
        this.lastShotTime = now;

        if (this.isPlayer && state.playerBuffs.triple.active) {
            this._shootMultiple(3, state);
        } else {
            this._shootSingle(this.direction, state);
        }
    }

    _shootMultiple(count, state) {
        const dirs = [this.direction, (this.direction + 1) % 4, (this.direction + 3) % 4];
        dirs.slice(0, count).forEach(d => this._shootSingle(d, state));
    }

    _shootSingle(direction, state) {
        let bx, by;
        switch (direction) {
            case DIRECTIONS.UP:
                bx = this.x + this.width / 2 - BULLET_SIZE / 2;
                by = this.y - BULLET_SIZE;
                break;
            case DIRECTIONS.RIGHT:
                bx = this.x + this.width;
                by = this.y + this.height / 2 - BULLET_SIZE / 2;
                break;
            case DIRECTIONS.DOWN:
                bx = this.x + this.width / 2 - BULLET_SIZE / 2;
                by = this.y + this.height;
                break;
            case DIRECTIONS.LEFT:
                bx = this.x - BULLET_SIZE;
                by = this.y + this.height / 2 - BULLET_SIZE / 2;
                break;
        }

        const ricochet = this.isPlayer && state.playerBuffs.ricochet.active;
        const speed = this.isPlayer && state.playerBuffs.star.active
            ? this.baseBulletSpeed * 1.5
            : this.baseBulletSpeed;

        state.bullets.push(new Bullet(bx, by, direction, this.isPlayer, speed, ricochet));
    }

    draw(ctx, state) {
        if (!this.isActive) return;

        // Shield effect
        if (this.isPlayer && state.playerBuffs.shield.active) {
            const remaining = state.playerBuffs.shield.endTime - Date.now();
            const alpha = Math.min(0.8, Math.max(0.3, remaining / 10000));
            ctx.strokeStyle = `rgba(33, 150, 243, ${alpha})`;
            ctx.lineWidth = 3;
            ctx.beginPath();
            const radius = this.width * 0.85 + Math.sin(Date.now() / 100) * 2;
            ctx.arc(this.x + this.width / 2, this.y + this.height / 2, radius, 0, Math.PI * 2);
            ctx.stroke();
        }

        if (this.isPlayer && state.playerBuffs.star.active) {
            ctx.strokeStyle = `rgba(255, 193, 7, ${0.4 + Math.sin(Date.now() / 100) * 0.2})`;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(this.x + this.width / 2, this.y + this.height / 2, this.width * 0.9, 0, Math.PI * 2);
            ctx.stroke();
        }

        if (this.flashTimer > 0 && Math.floor(this.flashTimer) % 4 < 2) return;

        if (this.spawnInvincible > 0 && Math.floor(Date.now() / 150) % 2 === 0) {
            ctx.globalAlpha = 0.5;
        }

        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.width, this.height);

        ctx.fillStyle = '#333';
        switch (this.direction) {
            case DIRECTIONS.UP:
                ctx.fillRect(this.x + this.width / 2 - 2, this.y - 6, 4, 8); break;
            case DIRECTIONS.RIGHT:
                ctx.fillRect(this.x + this.width, this.y + this.height / 2 - 2, 8, 4); break;
            case DIRECTIONS.DOWN:
                ctx.fillRect(this.x + this.width / 2 - 2, this.y + this.height, 4, 8); break;
            case DIRECTIONS.LEFT:
                ctx.fillRect(this.x - 8, this.y + this.height / 2 - 2, 8, 4); break;
        }

        ctx.fillStyle = this.turretColor;
        ctx.fillRect(this.x + 4, this.y + 4, this.width - 8, this.height - 8);

        ctx.globalAlpha = 1;

        if (!this.isPlayer && this.maxHp > 1) {
            const barWidth = this.width;
            const barHeight = 3;
            const barY = this.y - 6;
            ctx.fillStyle = '#333';
            ctx.fillRect(this.x, barY, barWidth, barHeight);
            const ratio = this.hp / this.maxHp;
            ctx.fillStyle = ratio > 0.5 ? '#4CAF50' : (ratio > 0.25 ? '#FF9800' : '#F44336');
            ctx.fillRect(this.x, barY, barWidth * ratio, barHeight);
        }

        if (!this.isPlayer) {
            let marker = '';
            if (this.type === 'fast') marker = 'F';
            else if (this.type === 'heavy') marker = 'H';
            else if (this.type === 'power') marker = 'P';
            if (marker) {
                ctx.fillStyle = '#fff';
                ctx.font = 'bold 10px monospace';
                ctx.textAlign = 'center';
                ctx.fillText(marker, this.x + this.width / 2, this.y + this.height / 2 + 3);
            }
        }
    }
}