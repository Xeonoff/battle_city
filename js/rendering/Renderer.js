import { BackgroundRenderer } from './BackgroundRenderer.js';
import { HUDRenderer } from './HUDRenderer.js';

export class Renderer {
    constructor(canvas, state, particles, inventoryRenderer) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.state = state;
        this.particles = particles;
        this.inventoryRenderer = inventoryRenderer;
        this.background = new BackgroundRenderer(canvas);
        this.hud = new HUDRenderer();
    }

    render() {
        const ctx = this.ctx;
        const s = this.state;

        // 1. Земля
        this.background.draw(ctx);

        // 2. Вода
        s.waters.forEach(w => w.draw(ctx));

        // 3. Стены
        s.walls.forEach(w => w.draw(ctx));

        // 4. База
        if (s.base) s.base.draw(ctx);

        // 5. Материалы на земле 🆕
        s.materials.forEach(m => m.draw(ctx));

        // 6. Бонусы
        s.bonuses.forEach(b => b.draw(ctx));

        // 7. Потоки огня (под танками) 🆕
        s.flameStreams.forEach(f => f.draw(ctx));

        // 8. Пули
        s.bullets.forEach(b => b.draw(ctx));

        // 9. Танки
        s.enemies.forEach(e => e.draw(ctx, s));
        if (s.player && s.player.isActive) s.player.draw(ctx, s);

        // 10. Партиклы
        this.particles.draw(ctx);

        // 11. Кусты поверх танков
        s.bushes.forEach(b => b.draw(ctx));

        // 12. HUD (HP бар + баффы)
        this.hud.draw(ctx, s);

        // 13. Инвентарь 🆕
        if (this.inventoryRenderer) {
            this.inventoryRenderer.draw(ctx, s.inventory, this.canvas);
        }
    }

    rebuildBackground() {
        this.background.rebuild();
    }
}