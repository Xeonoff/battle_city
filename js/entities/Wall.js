import { TILE_SIZE } from '../config/constants.js';

export class Wall {
    constructor(x, y, type = 'brick') {
        this.x = x;
        this.y = y;
        this.width = TILE_SIZE;
        this.height = TILE_SIZE;
        this.type = type;

        switch (type) {
            case 'brick':
                this.maxHp = 2;
                this.displayName = '🟫 Кирпичная стена';
                this.description = 'Разрушается 2 попаданиями';
                break;
            case 'steel':
                this.maxHp = Infinity;
                this.displayName = '⬛ Стальная стена';
                this.description = 'Неразрушимая. Только рикошет.';
                break;
            case 'fortified':
                this.maxHp = 3;
                this.displayName = '🔲 Укреплённая стена';
                this.description = 'Бетон с арматурой. 3 попадания.';
                break;
        }
        this.hp = this.maxHp;
    }

    getRect() {
        return { x: this.x, y: this.y, width: this.width, height: this.height };
    }

    draw(ctx) {
        if (this.hp <= 0) return;

        if (this.type === 'brick') {
            const dmg = this.maxHp - this.hp;
            ctx.fillStyle = dmg === 0 ? '#8B4513' : '#5D2F0A';
            ctx.fillRect(this.x, this.y, this.width, this.height);
            ctx.fillStyle = dmg === 0 ? '#A0522D' : '#3D1F06';
            for (let i = 0; i < this.width; i += 4) {
                for (let j = 0; j < this.height; j += 4) {
                    if ((i + j) % 8 === 0) ctx.fillRect(this.x + i, this.y + j, 2, 2);
                }
            }
            if (dmg > 0) {
                ctx.strokeStyle = '#000';
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(this.x + 4, this.y + 4);
                ctx.lineTo(this.x + this.width / 2, this.y + this.height / 2);
                ctx.lineTo(this.x + this.width - 4, this.y + this.height - 4);
                ctx.stroke();
            }
        } else if (this.type === 'steel') {
            ctx.fillStyle = '#696969';
            ctx.fillRect(this.x, this.y, this.width, this.height);
            ctx.fillStyle = '#808080';
            for (let i = 0; i < this.width; i += 6) {
                for (let j = 0; j < this.height; j += 6) {
                    if ((i + j) % 12 === 0) ctx.fillRect(this.x + i, this.y + j, 3, 3);
                }
            }
            ctx.fillStyle = '#3a3a3a';
            ctx.beginPath();
            ctx.arc(this.x + 4, this.y + 4, 2, 0, Math.PI * 2);
            ctx.arc(this.x + this.width - 4, this.y + 4, 2, 0, Math.PI * 2);
            ctx.arc(this.x + 4, this.y + this.height - 4, 2, 0, Math.PI * 2);
            ctx.arc(this.x + this.width - 4, this.y + this.height - 4, 2, 0, Math.PI * 2);
            ctx.fill();
        } else if (this.type === 'fortified') {
            const dmg = this.maxHp - this.hp;
            const colors = ['#808080', '#606060', '#404040'];
            ctx.fillStyle = colors[Math.min(dmg, 2)];
            ctx.fillRect(this.x, this.y, this.width, this.height);
            ctx.strokeStyle = dmg === 0 ? '#a0a0a0' : '#303030';
            ctx.lineWidth = 2;
            for (let row = 0; row < 3; row++) {
                const y = this.y + 5 + row * 7;
                ctx.beginPath();
                ctx.moveTo(this.x + 2, y);
                ctx.lineTo(this.x + this.width - 2, y);
                ctx.stroke();
            }
            ctx.strokeStyle = dmg === 0 ? '#909090' : '#2a2a2a';
            ctx.lineWidth = 1;
            for (let col = 0; col < 3; col++) {
                const x = this.x + 6 + col * 7;
                ctx.beginPath();
                ctx.moveTo(x, this.y + 2);
                ctx.lineTo(x, this.y + this.height - 2);
                ctx.stroke();
            }
            if (dmg > 0) {
                ctx.strokeStyle = '#000';
                ctx.lineWidth = 1;
                ctx.beginPath();
                for (let i = 0; i < dmg * 2; i++) {
                    const sx = this.x + 3 + (i * 5) % (this.width - 6);
                    const sy = this.y + 3 + (i * 7) % (this.height - 6);
                    ctx.moveTo(sx, sy);
                    ctx.lineTo(sx + 4, sy + 4);
                }
                ctx.stroke();
            }
        }
    }
}