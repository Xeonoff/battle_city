import { eventBus } from '../core/EventBus.js';
import { EVENTS } from '../config/constants.js';
import { maybeDropBonus } from './BonusSystem.js';

export class CollisionSystem {
    constructor(state, particles) {
        this.state = state;
        this.particles = particles;
        this.canvas = document.getElementById('gameCanvas');
    }

    update(dt) {
        this.state.bullets.forEach(bullet => {
            bullet.update(dt, this.state, this.canvas, {
                wall: (wall, isRicochet) => {
                    const hx = bullet.x + bullet.width / 2;
                    const hy = bullet.y + bullet.height / 2;
                    if (isRicochet) {
                        this.particles.emitSparks(hx, hy, 8);
                    } else if (wall.type === 'steel') {
                        this.particles.emitSparks(hx, hy, 18);
                    } else if (wall.type === 'brick') {
                        this.particles.emitBrickDebris(hx, hy, 10);
                    } else if (wall.type === 'fortified') {
                        this.particles.emitConcreteDust(hx, hy, 12);
                    }
                },
                base: () => {
                    const bx = this.state.base.x + this.state.base.width / 2;
                    const by = this.state.base.y + this.state.base.height / 2;
                    this.particles.emitExplosion(bx, by, 60);
                    this.state.base.isDestroyed = true;
                    eventBus.emit(EVENTS.BASE_DESTROYED);
                },
                enemy: (tank) => {
                    const hx = bullet.x + bullet.width / 2;
                    const hy = bullet.y + bullet.height / 2;
                    this.particles.emitSparks(hx, hy, 5);

                    tank.hp--;
                    tank.flashTimer = 10;
                    if (tank.hp <= 0) {
                        const tx = tank.x + tank.width / 2;
                        const ty = tank.y + tank.height / 2;
                        this.particles.emitExplosion(tx, ty, 30);
                        tank.isActive = false;
                        this.state.score += tank.score || 100;
                        this.state.enemyCount++;
                        maybeDropBonus(tank, this.state);
                        eventBus.emit(EVENTS.ENEMY_KILLED, tank);
                    }
                },
                player: (tank) => {
                    if (this.state.playerBuffs.shield.active) {
                        const hx = bullet.x + bullet.width / 2;
                        const hy = bullet.y + bullet.height / 2;
                        this.particles.emitSparks(hx, hy, 10);
                        return;
                    }
                    tank.isActive = false;
                    this.state.lives--;
                    const px = tank.x + tank.width / 2;
                    const py = tank.y + tank.height / 2;
                    this.particles.emitExplosion(px, py, 40);
                    eventBus.emit(EVENTS.PLAYER_HIT, { lives: this.state.lives });
                }
            });
        });
        this.state.bullets = this.state.bullets.filter(b => b.isActive);
        this.state.enemies = this.state.enemies.filter(e => e.isActive);
    }
}