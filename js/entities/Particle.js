export class Particle {
    constructor(opts) {
        this.x = opts.x;
        this.y = opts.y;
        this.vx = opts.vx || 0;
        this.vy = opts.vy || 0;
        this.life = opts.life || 30;
        this.maxLife = this.life;
        this.size = opts.size || 3;
        this.color = opts.color || '#fff';
        this.gravity = opts.gravity || 0;
        this.friction = opts.friction || 0.98;
        this.shape = opts.shape || 'circle'; // circle | square | spark
        this.fade = opts.fade !== undefined ? opts.fade : true;
        this.shrink = opts.shrink !== undefined ? opts.shrink : true;
        this.rotation = opts.rotation || 0;
        this.rotationSpeed = opts.rotationSpeed || 0;
    }

    update(dt) {
        this.vy += this.gravity * dt;
        // трение с учётом dt
        const f = Math.pow(this.friction, dt);
        this.vx *= f;
        this.vy *= f;
        this.x += this.vx * dt;
        this.y += this.vy * dt;
        this.life -= dt;
        this.rotation += this.rotationSpeed * dt;
    }

    isDead() {
        return this.life <= 0;
    }

    draw(ctx) {
        const t = Math.max(0, this.life / this.maxLife);
        const alpha = this.fade ? t : 1;
        const size = this.shrink ? this.size * t : this.size;
        if (size <= 0.1 || alpha <= 0.01) return;

        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.translate(this.x, this.y);
        if (this.rotation) ctx.rotate(this.rotation);

        if (this.shape === 'circle') {
            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.arc(0, 0, size, 0, Math.PI * 2);
            ctx.fill();
        } else if (this.shape === 'square') {
            ctx.fillStyle = this.color;
            ctx.fillRect(-size, -size, size * 2, size * 2);
        } else if (this.shape === 'spark') {
            // Линия-искра в направлении движения
            const len = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
            if (len > 0.1) {
                const nx = -this.vx / len;
                const ny = -this.vy / len;
                const grad = ctx.createLinearGradient(0, 0, nx * size * 3, ny * size * 3);
                grad.addColorStop(0, this.color);
                grad.addColorStop(1, 'rgba(0,0,0,0)');
                ctx.strokeStyle = grad;
                ctx.lineWidth = size;
                ctx.lineCap = 'round';
                ctx.beginPath();
                ctx.moveTo(0, 0);
                ctx.lineTo(nx * size * 3, ny * size * 3);
                ctx.stroke();
            } else {
                ctx.fillStyle = this.color;
                ctx.beginPath();
                ctx.arc(0, 0, size, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        ctx.restore();
    }
}