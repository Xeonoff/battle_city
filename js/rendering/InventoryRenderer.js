/**
 * Компактный инвентарь 1×8 с красивыми иконками материалов.
 */
export class InventoryRenderer {
    constructor() {
        this.slotSize = 34;
        this.gap = 2;
        this.padding = 6;
    }

    draw(ctx, inventory, canvas) {
        if (!inventory) return;

        const slots = inventory.getSlots();
        const activeIndex = inventory.getActiveIndex();

        const totalWidth = 8 * this.slotSize + 7 * this.gap;
        const startX = canvas.width - totalWidth - this.padding;
        const startY = this.padding;

        ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
        const panelPad = 3;
        ctx.fillRect(
            startX - panelPad,
            startY - panelPad,
            totalWidth + panelPad * 2,
            this.slotSize + panelPad * 2
        );

        for (let i = 0; i < 8; i++) {
            const x = startX + i * (this.slotSize + this.gap);
            this._drawSlot(ctx, slots[i], x, startY, i === activeIndex, i + 1);
        }
    }

    _drawSlot(ctx, slot, x, y, isActive, slotNumber) {
        if (isActive) {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
        } else {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.04)';
        }
        ctx.fillRect(x, y, this.slotSize, this.slotSize);

        ctx.strokeStyle = isActive ? 'rgba(255, 255, 255, 0.6)' : 'rgba(255, 255, 255, 0.12)';
        ctx.lineWidth = isActive ? 1.5 : 1;
        ctx.strokeRect(x + 0.5, y + 0.5, this.slotSize - 1, this.slotSize - 1);

        ctx.fillStyle = isActive ? 'rgba(255, 255, 255, 0.7)' : 'rgba(255, 255, 255, 0.3)';
        ctx.font = '8px monospace';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        ctx.fillText(slotNumber.toString(), x + 2, y + 1);

        // Содержимое
        if (slot.type && slot.count > 0) {
            this._drawMaterial(ctx, slot.type, x, y, slot.count);
        }
    }

    _drawMaterial(ctx, type, x, y, count) {
        const cx = x + this.slotSize / 2;
        const cy = y + this.slotSize / 2 - 1;
        const size = 16;

        this._drawMaterialIcon(ctx, type, cx, cy, size);

        ctx.fillStyle = '#fff';
        ctx.font = 'bold 10px monospace';
        ctx.textAlign = 'right';
        ctx.textBaseline = 'bottom';
        ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
        ctx.shadowBlur = 2;
        ctx.fillText(count.toString(), x + this.slotSize - 2, y + this.slotSize - 1);
        ctx.shadowBlur = 0;
    }

    _drawMaterialIcon(ctx, type, cx, cy, size) {
        ctx.save();

        if (type === 'brick') {
            this._drawBrickIcon(ctx, cx, cy, size);
        } else if (type === 'fortified') {
            this._drawFortifiedIcon(ctx, cx, cy, size);
        } else if (type === 'steel') {
            this._drawSteelIcon(ctx, cx, cy, size);
        }

        ctx.restore();
    }

    _drawBrickIcon(ctx, cx, cy, size) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.beginPath();
        ctx.ellipse(cx + 1, cy + 2, size * 0.6, size * 0.2, 0, 0, Math.PI * 2);
        ctx.fill();

        const gradient1 = ctx.createLinearGradient(cx - size / 2, cy - size / 2, cx + size / 2, cy + size / 2);
        gradient1.addColorStop(0, '#A0522D');
        gradient1.addColorStop(0.5, '#8B4513');
        gradient1.addColorStop(1, '#6B3410');
        ctx.fillStyle = gradient1;

        ctx.beginPath();
        ctx.moveTo(cx - size * 0.4, cy - size * 0.3);
        ctx.lineTo(cx - size * 0.1, cy - size * 0.5);
        ctx.lineTo(cx + size * 0.2, cy - size * 0.2);
        ctx.lineTo(cx, cy + size * 0.3);
        ctx.lineTo(cx - size * 0.3, cy + size * 0.2);
        ctx.closePath();
        ctx.fill();

        ctx.strokeStyle = 'rgba(60, 30, 10, 0.6)';
        ctx.lineWidth = 0.8;
        ctx.stroke();

        const gradient2 = ctx.createLinearGradient(cx, cy, cx + size / 2, cy + size / 2);
        gradient2.addColorStop(0, '#CD853F');
        gradient2.addColorStop(1, '#8B4513');
        ctx.fillStyle = gradient2;

        ctx.beginPath();
        ctx.moveTo(cx + size * 0.1, cy - size * 0.1);
        ctx.lineTo(cx + size * 0.4, cy);
        ctx.lineTo(cx + size * 0.3, cy + size * 0.3);
        ctx.lineTo(cx + size * 0.05, cy + size * 0.15);
        ctx.closePath();
        ctx.fill();

        ctx.strokeStyle = 'rgba(60, 30, 10, 0.6)';
        ctx.stroke();

        ctx.strokeStyle = 'rgba(40, 20, 5, 0.7)';
        ctx.lineWidth = 0.6;
        ctx.beginPath();
        ctx.moveTo(cx - size * 0.2, cy - size * 0.1);
        ctx.lineTo(cx, cy + size * 0.05);
        ctx.lineTo(cx + size * 0.1, cy + size * 0.2);
        ctx.stroke();

        ctx.strokeStyle = 'rgba(255, 200, 150, 0.5)';
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        ctx.moveTo(cx - size * 0.3, cy - size * 0.25);
        ctx.lineTo(cx - size * 0.15, cy - size * 0.35);
        ctx.stroke();
    }

    _drawFortifiedIcon(ctx, cx, cy, size) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.beginPath();
        ctx.ellipse(cx + 1, cy + 2, size * 0.6, size * 0.2, 0, 0, Math.PI * 2);
        ctx.fill();

        const gradient1 = ctx.createLinearGradient(cx - size / 2, cy - size / 2, cx + size / 2, cy + size / 2);
        gradient1.addColorStop(0, '#B0B0B0');
        gradient1.addColorStop(0.5, '#808080');
        gradient1.addColorStop(1, '#505050');
        ctx.fillStyle = gradient1;

        ctx.beginPath();
        ctx.moveTo(cx - size * 0.35, cy - size * 0.25);
        ctx.lineTo(cx - size * 0.05, cy - size * 0.45);
        ctx.lineTo(cx + size * 0.25, cy - size * 0.15);
        ctx.lineTo(cx + size * 0.1, cy + size * 0.3);
        ctx.lineTo(cx - size * 0.25, cy + size * 0.25);
        ctx.closePath();
        ctx.fill();

        ctx.strokeStyle = 'rgba(40, 40, 40, 0.6)';
        ctx.lineWidth = 0.8;
        ctx.stroke();

        const gradient2 = ctx.createLinearGradient(cx, cy, cx + size / 2, cy + size / 2);
        gradient2.addColorStop(0, '#A0A0A0');
        gradient2.addColorStop(1, '#606060');
        ctx.fillStyle = gradient2;

        ctx.beginPath();
        ctx.moveTo(cx + size * 0.15, cy - size * 0.05);
        ctx.lineTo(cx + size * 0.4, cy + size * 0.1);
        ctx.lineTo(cx + size * 0.25, cy + size * 0.35);
        ctx.lineTo(cx + size * 0.05, cy + size * 0.2);
        ctx.closePath();
        ctx.fill();

        ctx.strokeStyle = 'rgba(40, 40, 40, 0.6)';
        ctx.stroke();

        ctx.strokeStyle = '#2a2a2a';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(cx - size * 0.2, cy + size * 0.1);
        ctx.lineTo(cx + size * 0.2, cy + size * 0.1);
        ctx.stroke();

        ctx.strokeStyle = '#606060';
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        ctx.moveTo(cx - size * 0.2, cy + size * 0.08);
        ctx.lineTo(cx + size * 0.2, cy + size * 0.08);
        ctx.stroke();

        ctx.strokeStyle = 'rgba(30, 30, 30, 0.8)';
        ctx.lineWidth = 0.7;
        ctx.beginPath();
        ctx.moveTo(cx - size * 0.15, cy - size * 0.2);
        ctx.lineTo(cx, cy);
        ctx.lineTo(cx + size * 0.15, cy + size * 0.15);
        ctx.stroke();

        ctx.strokeStyle = 'rgba(220, 220, 220, 0.6)';
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        ctx.moveTo(cx - size * 0.25, cy - size * 0.2);
        ctx.lineTo(cx - size * 0.1, cy - size * 0.3);
        ctx.stroke();
    }

    _drawSteelIcon(ctx, cx, cy, size) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.beginPath();
        ctx.ellipse(cx + 1, cy + 2, size * 0.6, size * 0.2, 0, 0, Math.PI * 2);
        ctx.fill();

        const gradient1 = ctx.createLinearGradient(cx - size / 2, cy - size / 2, cx + size / 2, cy + size / 2);
        gradient1.addColorStop(0, '#C0C0C0');
        gradient1.addColorStop(0.3, '#808080');
        gradient1.addColorStop(0.7, '#696969');
        gradient1.addColorStop(1, '#404040');
        ctx.fillStyle = gradient1;

        ctx.beginPath();
        ctx.moveTo(cx - size * 0.3, cy - size * 0.3);
        ctx.lineTo(cx + size * 0.05, cy - size * 0.45);
        ctx.lineTo(cx + size * 0.35, cy - size * 0.15);
        ctx.lineTo(cx + size * 0.2, cy + size * 0.25);
        ctx.lineTo(cx - size * 0.15, cy + size * 0.3);
        ctx.closePath();
        ctx.fill();

        ctx.strokeStyle = 'rgba(30, 30, 30, 0.7)';
        ctx.lineWidth = 0.8;
        ctx.stroke();

        const gradient2 = ctx.createLinearGradient(cx, cy, cx + size / 2, cy + size / 2);
        gradient2.addColorStop(0, '#B0B0B0');
        gradient2.addColorStop(1, '#505050');
        ctx.fillStyle = gradient2;

        ctx.beginPath();
        ctx.moveTo(cx + size * 0.1, cy);
        ctx.lineTo(cx + size * 0.4, cy + size * 0.15);
        ctx.lineTo(cx + size * 0.3, cy + size * 0.4);
        ctx.lineTo(cx + size * 0.05, cy + size * 0.25);
        ctx.closePath();
        ctx.fill();

        ctx.strokeStyle = 'rgba(30, 30, 30, 0.7)';
        ctx.stroke();

        ctx.fillStyle = '#404050';
        ctx.beginPath();
        ctx.arc(cx - size * 0.15, cy - size * 0.1, 1.2, 0, Math.PI * 2);
        ctx.arc(cx + size * 0.1, cy + size * 0.15, 1.2, 0, Math.PI * 2);
        ctx.fill();

        const highlight = ctx.createRadialGradient(
            cx - size * 0.2, cy - size * 0.2, 0,
            cx - size * 0.2, cy - size * 0.2, size * 0.3
        );
        highlight.addColorStop(0, 'rgba(255, 255, 255, 0.8)');
        highlight.addColorStop(0.5, 'rgba(255, 255, 255, 0.3)');
        highlight.addColorStop(1, 'rgba(255, 255, 255, 0)');
        ctx.fillStyle = highlight;
        ctx.beginPath();
        ctx.arc(cx - size * 0.2, cy - size * 0.2, size * 0.3, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = 'rgba(240, 240, 255, 0.7)';
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        ctx.moveTo(cx - size * 0.25, cy - size * 0.25);
        ctx.lineTo(cx - size * 0.1, cy - size * 0.15);
        ctx.stroke();
    }

    getSlotRect(index, canvas) {
        const totalWidth = 8 * this.slotSize + 7 * this.gap;
        const startX = canvas.width - totalWidth - this.padding;
        const startY = this.padding;
        const x = startX + index * (this.slotSize + this.gap);
        return { x, y: startY, width: this.slotSize, height: this.slotSize };
    }
}