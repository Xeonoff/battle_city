import { eventBus } from '../core/EventBus.js';
import { EVENTS } from '../config/constants.js';
import { maybeDropBonus } from './BonusSystem.js';
import { Material } from '../entities/Material.js'; // 🆕
import { TILE_SIZE } from '../config/constants.js';
import { rectsOverlap } from '../core/utils.js';
import { audioManager } from '../main.js';

export class CollisionSystem {
    constructor(state, particles) {
        this.state = state;
        this.particles = particles;
        this.canvas = document.getElementById('gameCanvas');
    }

    update(dt) {
        this.state.bullets.forEach(bullet => {
            bullet.update(dt, this.state, this.canvas, {
                wall: (wall, isRicochet, bullet) => {
                    const hx = bullet.x + bullet.width / 2;
                    const hy = bullet.y + bullet.height / 2;

                    if (isRicochet) {
                        this.particles.emitSparks(hx, hy, 8);
                        audioManager.play('ricochet');
                        return;
                    }

                    if (wall.type === 'steel') {
                        this.particles.emitSparks(hx, hy, 18);
                        audioManager.play('ricochet');
                    } else if (wall.type === 'brick') {
                        this.particles.emitBrickDebris(hx, hy, 10);
                        audioManager.play('hit');
                        if (wall.hp <= 0) {
                            audioManager.play('break');
                            this._dropMaterial(wall);
                        }
                    } else if (wall.type === 'fortified') {
                        this.particles.emitConcreteDust(hx, hy, 12);
                        audioManager.play('hit');
                        if (wall.hp <= 0) {
                            audioManager.play('break');
                            this._dropMaterial(wall);
                        }
                    }

                    // 🆕 Heavy bullet splash урон по соседним стенам
                    if (bullet && bullet.bulletType === 'heavy') {
                        this._applySplashDamageToWalls(hx, hy, TILE_SIZE * 1.25, 1, wall);
                    }
                },
                base: () => {
                    const bx = this.state.base.x + this.state.base.width / 2;
                    const by = this.state.base.y + this.state.base.height / 2;
                    this.particles.emitExplosion(bx, by, 60);
                    audioManager.play('explosion');
                    this.state.base.isDestroyed = true;
                    eventBus.emit(EVENTS.BASE_DESTROYED);
                },
                enemy: (tank) => {
                    const hx = bullet.x + bullet.width / 2;
                    const hy = bullet.y + bullet.height / 2;
                    this.particles.emitSparks(hx, hy, 5);

                    const killed = tank.takeDamage(1);

                    if (bullet.bulletType === 'heavy' && killed) {
                        this._applySplashDamage(hx, hy, TILE_SIZE * 2, 1, tank);
                    }

                    if (killed) {
                        const tx = tank.x + tank.width / 2;
                        const ty = tank.y + tank.height / 2;
                        this.particles.emitExplosion(tx, ty, 30);
                        audioManager.play('explosion');
                        tank.isActive = false;
                        this.state.score += tank.score || 100;
                        this.state.enemyCount++;
                        maybeDropBonus(tank, this.state);
                        eventBus.emit(EVENTS.ENEMY_KILLED, tank);
                    } else {
                        audioManager.play('collision');
                    }
                },
                player: (tank) => {
                    if (this.state.playerBuffs.shield.active) {
                        const hx = bullet.x + bullet.width / 2;
                        const hy = bullet.y + bullet.height / 2;
                        this.particles.emitSparks(hx, hy, 10);
                        audioManager.play('ricochet');
                        return;
                    }
                    const killed = tank.takeDamage(1);
                    if (killed) {
                        tank.isActive = false;
                        this.state.lives--;
                        const px = tank.x + tank.width / 2;
                        const py = tank.y + tank.height / 2;
                        this.particles.emitExplosion(px, py, 40);
                        audioManager.play('explosion');
                        eventBus.emit(EVENTS.PLAYER_HIT, { lives: this.state.lives });
                    } else {
                        audioManager.play('hit');
                    }
                }
            });
        });
        this.state.bullets = this.state.bullets.filter(b => b.isActive);
        this.state.enemies = this.state.enemies.filter(e => e.isActive);
    }

    _dropMaterial(wall) {
        // 80% шанс дропа материала
        if (Math.random() < 0.8) {
            this.state.materials.push(new Material(wall.x, wall.y, wall.type));
        }
    }

    _applySplashDamage(cx, cy, radius, damage, sourceTank = null) {
        const splashRect = {
            x: cx - radius / 2,
            y: cy - radius / 2,
            width: radius,
            height: radius
        };

        // Урон врагам в радиусе
        this.state.enemies.forEach(enemy => {
            if (!enemy.isActive) return;
            if (enemy === sourceTank) return; // не бьём повторно по инициатору
            const er = { x: enemy.x, y: enemy.y, width: enemy.width, height: enemy.height };
            if (rectsOverlap(splashRect, er)) {
                const killed = enemy.takeDamage(damage);
                this.particles.emitSparks(
                    enemy.x + enemy.width / 2,
                    enemy.y + enemy.height / 2, 3
                );
                if (killed) {
                    enemy.isActive = false;
                    this.state.score += enemy.score || 100;
                    this.state.enemyCount++;
                    this.particles.emitExplosion(
                        enemy.x + enemy.width / 2,
                        enemy.y + enemy.height / 2, 20
                    );
                    audioManager.play('explosion');
                    maybeDropBonus(enemy, this.state);
                }
            }
        });

        // Урон игроку в радиусе (только от вражеских пуль)
        if (this.state.player && this.state.player.isActive) {
            const pr = {
                x: this.state.player.x, y: this.state.player.y,
                width: this.state.player.width, height: this.state.player.height
            };
            if (rectsOverlap(splashRect, pr)) {
                if (!this.state.playerBuffs.shield.active) {
                    const killed = this.state.player.takeDamage(damage);
                    if (killed) {
                        this.state.player.isActive = false;
                        this.state.lives--;
                        this.particles.emitExplosion(
                            this.state.player.x + this.state.player.width / 2,
                            this.state.player.y + this.state.player.height / 2, 40
                        );
                        audioManager.play('explosion');
                        eventBus.emit(EVENTS.PLAYER_HIT, { lives: this.state.lives });
                    }
                }
            }
        }

        // Визуальный эффект
        this.particles.emitExplosion(cx, cy, 15);
    }
    _applySplashDamageToWalls(cx, cy, radius, damage, sourceWall) {
        const destroyedWalls = [];

        for (const wall of this.state.walls) {
            // Пропускаем стену, по которой уже попали (иначе двойной урон)
            if (wall === sourceWall) continue;
            if (wall.hp <= 0) continue;

            const wallCx = wall.x + wall.width / 2;
            const wallCy = wall.y + wall.height / 2;
            const distSq = (cx - wallCx) ** 2 + (cy - wallCy) ** 2;

            if (distSq <= radius * radius) {
                // Сталь не получает урона от splash (она неразрушима)
                if (wall.type === 'steel') {
                    // Только искры
                    this.particles.emitSparks(wallCx, wallCy, 5);
                    audioManager.play('ricochet');
                    continue;
                }

                // Наносим урон кирпичу/бетону
                wall.hp -= damage;

                // Визуальные эффекты по типу
                const wx = wall.x + wall.width / 2;
                const wy = wall.y + wall.height / 2;

                if (wall.type === 'brick') {
                    this.particles.emitBrickDebris(wx, wy, 6);
                } else if (wall.type === 'fortified') {
                    this.particles.emitConcreteDust(wx, wy, 8);
                }

                // Если разрушилась от splash — дроп материала и звук
                if (wall.hp <= 0) {
                    audioManager.play('break');
                    this._dropMaterial(wall);
                    destroyedWalls.push(wall);
                } else {
                    audioManager.play('hit');
                }
            }
        }

        // Общий взрывной эффект в точке попадания
        this.particles.emitExplosion(cx, cy, 12);
        audioManager.play('explosion');
    }
}