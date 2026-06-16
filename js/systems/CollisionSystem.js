import { eventBus } from '../core/EventBus.js';
import { EVENTS } from '../config/constants.js';
import { maybeDropBonus } from './BonusSystem.js';

/**
 * Система обрабатывает столкновения пуль с объектами.
 */
export class CollisionSystem {
    constructor(state) {
        this.state = state;
        this.canvas = document.getElementById('gameCanvas');
    }

    update(dt) {
        this.state.bullets.forEach(bullet => {
            bullet.update(dt, this.state, this.canvas, {
                base: () => {
                    this.state.base.isDestroyed = true;
                    eventBus.emit(EVENTS.BASE_DESTROYED);
                },
                enemy: (tank) => {
                    tank.hp--;
                    tank.flashTimer = 10;
                    if (tank.hp <= 0) {
                        tank.isActive = false;
                        this.state.score += tank.score || 100;
                        this.state.enemyCount++;
                        maybeDropBonus(tank, this.state);
                        eventBus.emit(EVENTS.ENEMY_KILLED, tank);
                    }
                },
                player: (tank) => {
                    if (this.state.playerBuffs.shield.active) return;
                    tank.isActive = false;
                    this.state.lives--;
                    eventBus.emit(EVENTS.PLAYER_HIT, { lives: this.state.lives });
                }
            });
        });
        this.state.bullets = this.state.bullets.filter(b => b.isActive);
        this.state.enemies = this.state.enemies.filter(e => e.isActive);
    }
}