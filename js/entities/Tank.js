import { DIRECTIONS, TANK_SIZE, BASE_PLAYER_SPEED, BULLET_SIZE, PLAYER_HP } from '../config/constants.js';
import { ENEMY_TYPES } from '../config/enemyTypes.js';
import { Bullet } from './Bullet.js';
import { FlameStream } from './FlameStream.js';
import { rectsOverlap } from '../core/utils.js';
import { chooseBestDirection } from '../ai/EnemyAI.js';
import { TankRenderer } from '../rendering/TankRenderer.js';
import { audioManager } from '../main.js';

const tankRenderer = new TankRenderer();

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
            this.hp = PLAYER_HP;
            this.maxHp = PLAYER_HP;
            this.baseSpeed = BASE_PLAYER_SPEED;
            this.shootCooldownMs = 250;
            this.baseBulletSpeed = 7;
        } else {
            const type = ENEMY_TYPES[enemyType];
            this.type = type.name;
            this.enemyTypeKey = enemyType;
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

            const shootChance = this.type === 'power' ? 0.035
                : this.type === 'flamethrower' ? 0.01
                : 0.02;
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

        audioManager.play('fire');

        if (this.isPlayer) {
            if (state.playerBuffs.triple.active) {
                this._shootMultiple(3, state);
            } else {
                this._shootSingle(this.direction, state);
            }
        } else {
            switch (this.type) {
                case 'power':
                    this._shootDoubleParallel(state);
                    break;
                case 'flamethrower':
                    this._shootFlame(state);
                    break;
                default:
                    this._shootSingle(this.direction, state);
            }
        }
    }

    _shootDoubleParallel(state) {
        const offset = 4;
        let bx1, by1, bx2, by2;

        switch (this.direction) {
            case DIRECTIONS.UP:
                bx1 = this.x + this.width / 2 - offset - BULLET_SIZE / 2;
                bx2 = this.x + this.width / 2 + offset - BULLET_SIZE / 2;
                by1 = by2 = this.y - BULLET_SIZE;
                break;
            case DIRECTIONS.DOWN:
                bx1 = this.x + this.width / 2 - offset - BULLET_SIZE / 2;
                bx2 = this.x + this.width / 2 + offset - BULLET_SIZE / 2;
                by1 = by2 = this.y + this.height;
                break;
            case DIRECTIONS.LEFT:
                bx1 = bx2 = this.x - BULLET_SIZE;
                by1 = this.y + this.height / 2 - offset - BULLET_SIZE / 2;
                by2 = this.y + this.height / 2 + offset - BULLET_SIZE / 2;
                break;
            case DIRECTIONS.RIGHT:
                bx1 = bx2 = this.x + this.width;
                by1 = this.y + this.height / 2 - offset - BULLET_SIZE / 2;
                by2 = this.y + this.height / 2 + offset - BULLET_SIZE / 2;
                break;
        }

        state.bullets.push(new Bullet(bx1, by1, this.direction, false, this.baseBulletSpeed, false, 'power'));
        state.bullets.push(new Bullet(bx2, by2, this.direction, false, this.baseBulletSpeed, false, 'power'));
    }

    _shootFlame(state) {
        // Позиция старта потока — впереди танка
        state.flameStreams.push(new FlameStream(this));
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

        // 🆕 Определяем тип снаряда
        let bulletType = 'normal';
        if (this.isPlayer) {
            if (state.playerBuffs.explosive.active) {
                bulletType = 'heavy'; // 🆕 игрок с баффом "Взрывной" стреляет heavy
            }
        } else {
            if (this.type === 'heavy') {
                bulletType = 'heavy'; // 🆕 HEAVY враги стреляют heavy
            }
        }

        state.bullets.push(new Bullet(bx, by, direction, this.isPlayer, speed, ricochet, bulletType));
    }

    takeDamage(amount = 1) {
        this.hp -= amount;
        this.flashTimer = 10;
        return this.hp <= 0;
    }

    draw(ctx, state) {
        tankRenderer.draw(ctx, this, state);
    }
}