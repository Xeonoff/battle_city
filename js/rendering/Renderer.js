import { BackgroundRenderer } from './BackgroundRenderer.js';
import { HUDRenderer } from './HUDRenderer.js';

/**
 * Оркестратор рендеринга — собирает всё в нужном порядке.
 */
export class Renderer {
    constructor(canvas, state) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.state = state;
        this.background = new BackgroundRenderer(canvas);
        this.hud = new HUDRenderer();
    }

    render() {
        const ctx = this.ctx;
        const s = this.state;

        this.background.draw(ctx);
        s.waters.forEach(w => w.draw(ctx));
        s.walls.forEach(w => w.draw(ctx));
        if (s.base) s.base.draw(ctx);
        s.bonuses.forEach(b => b.draw(ctx));
        s.bullets.forEach(b => b.draw(ctx));
        s.enemies.forEach(e => e.draw(ctx, s));
        if (s.player && s.player.isActive) s.player.draw(ctx, s);
        s.bushes.forEach(b => b.draw(ctx));
        this.hud.draw(ctx, s);
    }

    rebuildBackground() {
        this.background.rebuild();
    }
}