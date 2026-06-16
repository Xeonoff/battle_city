import { TILE_SIZE } from '../config/constants.js';

export class Bush {
    constructor(x, y) {
        this.x = x; this.y = y;
        this.width = TILE_SIZE; this.height = TILE_SIZE;
        this.displayName = '🌿 Кусты';
        this.description = 'Танки прячутся внутри. Пули пролетают.';
    }
    getRect() { return { x: this.x, y: this.y, width: this.width, height: this.height }; }
    draw(ctx) {
        ctx.fillStyle = '#3CB371';
        for (let i = 0; i < this.width; i += 6) {
            for (let j = 0; j < this.height; j += 6) {
                if ((i + j) % 12 === 0) {
                    ctx.beginPath();
                    ctx.arc(this.x + i + 3, this.y + j + 3, 3, 0, Math.PI * 2);
                    ctx.fill();
                }
            }
        }
    }
}

export class Water {
    constructor(x, y) {
        this.x = x; this.y = y;
        this.width = TILE_SIZE; this.height = TILE_SIZE;
        this.displayName = '💧 Вода';
        this.description = 'Непроходима для танков. Пули пролетают.';
    }
    getRect() { return { x: this.x, y: this.y, width: this.width, height: this.height }; }
    draw(ctx) {
        ctx.fillStyle = '#1E90FF';
        ctx.fillRect(this.x, this.y, this.width, this.height);
        ctx.strokeStyle = '#00BFFF';
        ctx.lineWidth = 2;
        const t = Date.now() / 500;
        for (let i = 0; i < this.width; i += 8) {
            ctx.beginPath();
            ctx.moveTo(this.x + i, this.y + this.height / 2 + Math.sin(t + i));
            ctx.quadraticCurveTo(
                this.x + i + 4, this.y + this.height / 2 - 3,
                this.x + i + 8, this.y + this.height / 2
            );
            ctx.stroke();
        }
    }
}

export class Base {
    constructor(x, y) {
        this.x = x; this.y = y;
        this.width = TILE_SIZE * 2; this.height = TILE_SIZE * 2;
        this.isDestroyed = false;
        this.displayName = '🏠 Ваша база';
        this.description = 'Главная цель врагов. Уничтожение = поражение.';
    }
    getRect() { return { x: this.x, y: this.y, width: this.width, height: this.height }; }
    draw(ctx) {
        if (this.isDestroyed) {
            ctx.fillStyle = '#FF5252';
            ctx.fillRect(this.x, this.y, this.width, this.height);
            ctx.strokeStyle = '#000';
            ctx.beginPath();
            ctx.moveTo(this.x, this.y); ctx.lineTo(this.x + this.width, this.y + this.height);
            ctx.moveTo(this.x + this.width, this.y); ctx.lineTo(this.x, this.y + this.height);
            ctx.stroke();
        } else {
            ctx.fillStyle = '#FFD700';
            ctx.fillRect(this.x, this.y, this.width, this.height);
            ctx.fillStyle = '#8B4513';
            ctx.beginPath();
            ctx.arc(this.x + this.width / 2, this.y + this.height / 2, this.width / 3, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#FFD700';
            ctx.beginPath();
            ctx.arc(this.x + this.width / 2, this.y + this.height / 2, this.width / 4, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#FF8C00';
            ctx.beginPath();
            ctx.moveTo(this.x + this.width / 2, this.y + this.height / 2);
            ctx.lineTo(this.x + this.width / 2 + 5, this.y + this.height / 2 - 3);
            ctx.lineTo(this.x + this.width / 2 + 5, this.y + this.height / 2 + 3);
            ctx.closePath();
            ctx.fill();
            ctx.fillStyle = '#000';
            ctx.beginPath();
            ctx.arc(this.x + this.width / 2 - 3, this.y + this.height / 2 - 2, 2, 0, Math.PI * 2);
            ctx.arc(this.x + this.width / 2 + 3, this.y + this.height / 2 - 2, 2, 0, Math.PI * 2);
            ctx.fill();
        }
    }
}

export class Bonus {
    constructor(x, y, type) {
        this.x = x; this.y = y;
        this.width = TILE_SIZE; this.height = TILE_SIZE;
        this.type = type;
        this.isActive = true;
        this.spawnTime = Date.now();
        this.lifetime = 15000;
    }
    getRect() { return { x: this.x, y: this.y, width: this.width, height: this.height }; }
    update(state, onCollect) {
        if (Date.now() - this.spawnTime > this.lifetime) {
            this.isActive = false;
            return;
        }
        const p = state.player;
        if (p && p.isActive) {
            const pr = { x: p.x, y: p.y, width: p.width, height: p.height };
            const br = this.getRect();
            if (pr.x < br.x + br.width && pr.x + pr.width > br.x &&
                pr.y < br.y + br.height && pr.y + pr.height > br.y) {
                onCollect(this);
                this.isActive = false;
            }
        }
    }
    draw(ctx) {
        if (!this.isActive) return;
        const remaining = this.lifetime - (Date.now() - this.spawnTime);
        if (remaining < 3000 && Math.floor(Date.now() / 200) % 2 === 0) return;
        const pulse = 1 + Math.sin(Date.now() / 200) * 0.05;
        const cx = this.x + this.width / 2;
        const cy = this.y + this.height / 2;
        ctx.save();
        ctx.translate(cx, cy);
        ctx.scale(pulse, pulse);
        ctx.translate(-cx, -cy);
        ctx.fillStyle = this.type.color;
        ctx.fillRect(this.x, this.y, this.width, this.height);
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.strokeRect(this.x, this.y, this.width, this.height);
        ctx.font = '16px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = '#fff';
        ctx.fillText(this.type.emoji, cx, cy);
        ctx.restore();
    }
}