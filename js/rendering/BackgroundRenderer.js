import { TILE_SIZE } from '../config/constants.js';

export class BackgroundRenderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.offscreen = null;
    }

    rebuild() {
        this.offscreen = document.createElement('canvas');
        this.offscreen.width = this.canvas.width;
        this.offscreen.height = this.canvas.height;
        const ctx = this.offscreen.getContext('2d');

        ctx.fillStyle = '#3a5520';
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        for (let x = 0; x < this.canvas.width; x += TILE_SIZE) {
            for (let y = 0; y < this.canvas.height; y += TILE_SIZE) {
                let seed = Math.abs((x * 73856093) ^ (y * 19349663));
                const r = () => {
                    seed = (seed * 9301 + 49297) % 233280;
                    return seed / 233280;
                };
                const r1 = r(), r2 = r(), r3 = r();
                const v = Math.floor(r1 * 16) - 8;
                ctx.fillStyle = `rgb(${58 + v}, ${85 + v}, ${32 + Math.floor(v / 2)})`;
                ctx.fillRect(x + 1, y + 1, TILE_SIZE - 2, TILE_SIZE - 2);

                ctx.strokeStyle = 'rgba(0, 0, 0, 0.15)';
                ctx.lineWidth = 1;
                ctx.strokeRect(x, y, TILE_SIZE, TILE_SIZE);

                if (r2 < 0.25) {
                    ctx.fillStyle = 'rgba(30, 40, 15, 0.4)';
                    ctx.beginPath();
                    ctx.arc(x + r1 * TILE_SIZE, y + r2 * TILE_SIZE, 1.5 + r3, 0, Math.PI * 2);
                    ctx.fill();
                }
                if (r2 > 0.75) {
                    ctx.fillStyle = 'rgba(120, 180, 60, 0.35)';
                    ctx.beginPath();
                    ctx.arc(x + r3 * TILE_SIZE, y + r1 * TILE_SIZE, 1 + r2, 0, Math.PI * 2);
                    ctx.fill();
                }
                if (r3 < 0.1) {
                    ctx.fillStyle = 'rgba(90, 80, 60, 0.6)';
                    ctx.beginPath();
                    ctx.arc(x + r1 * TILE_SIZE, y + r2 * TILE_SIZE, 1.5, 0, Math.PI * 2);
                    ctx.fill();
                }
            }
        }
    }

    draw(ctx) {
        if (this.offscreen) ctx.drawImage(this.offscreen, 0, 0);
        else {
            ctx.fillStyle = '#3a5520';
            ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        }
    }
}