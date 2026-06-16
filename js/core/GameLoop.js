/**
 * Игровой цикл с независимостью от герцовки (delta time).
 */
export class GameLoop {
    constructor({ update, render, onFpsUpdate }) {
        this.update = update;
        this.render = render;
        this.onFpsUpdate = onFpsUpdate;

        this.animationFrameId = null;
        this.lastFrameTime = performance.now();

        this.frameCount = 0;
        this.fpsTime = 0;

        this._loop = this._loop.bind(this);
    }

    start() {
        this.lastFrameTime = performance.now();
        this.animationFrameId = requestAnimationFrame(this._loop);
    }

    stop() {
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
    }

    _loop(timestamp) {
        const elapsed = timestamp - this.lastFrameTime;
        const dt = Math.min(elapsed / 16.667, 3); // нормализация к 60 FPS
        this.lastFrameTime = timestamp;

        this.frameCount++;
        this.fpsTime += elapsed;
        if (this.fpsTime >= 1000) {
            const fps = Math.round(this.frameCount * 1000 / this.fpsTime);
            this.onFpsUpdate?.(fps);
            this.frameCount = 0;
            this.fpsTime = 0;
        }

        this.update(dt);
        this.render();

        this.animationFrameId = requestAnimationFrame(this._loop);
    }
}