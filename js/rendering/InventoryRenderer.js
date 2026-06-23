/**
 * Компактный инвентарь 1×8 в правом верхнем углу.
 * Прозрачные ячейки, тонкие границы.
 */
export class InventoryRenderer {
    constructor() {
        this.slotSize = 34;        // маленькие ячейки
        this.gap = 2;               // минимальный промежуток
        this.padding = 6;           // отступ от края canvas
    }

    draw(ctx, inventory, canvas) {
        if (!inventory) return;

        const slots = inventory.getSlots();
        const activeIndex = inventory.getActiveIndex();

        const totalWidth = 8 * this.slotSize + 7 * this.gap;
        const startX = canvas.width - totalWidth - this.padding;
        const startY = this.padding;

        // Полупрозрачный фон панели
        ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
        const panelPad = 3;
        ctx.fillRect(
            startX - panelPad,
            startY - panelPad,
            totalWidth + panelPad * 2,
            this.slotSize + panelPad * 2
        );

        // Рисуем 8 слотов в ряд
        for (let i = 0; i < 8; i++) {
            const x = startX + i * (this.slotSize + this.gap);
            this._drawSlot(ctx, slots[i], x, startY, i === activeIndex, i + 1);
        }
    }

    _drawSlot(ctx, slot, x, y, isActive, slotNumber) {
        // Фон слота — почти прозрачный
        if (isActive) {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
        } else {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.04)';
        }
        ctx.fillRect(x, y, this.slotSize, this.slotSize);

        // Тонкая граница — серая, без жёлтого
        ctx.strokeStyle = isActive ? 'rgba(255, 255, 255, 0.6)' : 'rgba(255, 255, 255, 0.12)';
        ctx.lineWidth = isActive ? 1.5 : 1;
        ctx.strokeRect(x + 0.5, y + 0.5, this.slotSize - 1, this.slotSize - 1);

        // Номер слота — мелкий, в углу
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
        const size = 14;

        // Иконка материала — маленькие осколки
        this._drawDebrisIcon(ctx, type, cx, cy, size);

        // Количество — внизу справа
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 10px monospace';
        ctx.textAlign = 'right';
        ctx.textBaseline = 'bottom';
        ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
        ctx.shadowBlur = 2;
        ctx.fillText(count.toString(), x + this.slotSize - 2, y + this.slotSize - 1);
        ctx.shadowBlur = 0;
    }

    _drawDebrisIcon(ctx, type, cx, cy, size) {
        if (type === 'brick') {
            // Кирпичные осколки
            ctx.fillStyle = '#8B4513';
            ctx.beginPath();
            ctx.moveTo(cx - size / 2, cy - size / 3);
            ctx.lineTo(cx - size / 4, cy - size / 2);
            ctx.lineTo(cx, cy - size / 4);
            ctx.lineTo(cx - size / 6, cy + size / 4);
            ctx.closePath();
            ctx.fill();

            ctx.fillStyle = '#A0522D';
            ctx.beginPath();
            ctx.moveTo(cx + size / 6, cy - size / 4);
            ctx.lineTo(cx + size / 2, cy - size / 6);
            ctx.lineTo(cx + size / 3, cy + size / 3);
            ctx.lineTo(cx, cy + size / 4);
            ctx.closePath();
            ctx.fill();

            ctx.fillStyle = '#6B3410';
            ctx.fillRect(cx - size / 8, cy, size / 4, size / 6);
        } else if (type === 'fortified') {
            // Бетонные осколки
            ctx.fillStyle = '#808080';
            ctx.beginPath();
            ctx.moveTo(cx - size / 2, cy);
            ctx.lineTo(cx - size / 3, cy - size / 2);
            ctx.lineTo(cx, cy - size / 3);
            ctx.lineTo(cx - size / 6, cy + size / 4);
            ctx.closePath();
            ctx.fill();

            ctx.fillStyle = '#606060';
            ctx.beginPath();
            ctx.moveTo(cx + size / 8, cy - size / 4);
            ctx.lineTo(cx + size / 2, cy - size / 6);
            ctx.lineTo(cx + size / 3, cy + size / 3);
            ctx.lineTo(cx + size / 8, cy + size / 4);
            ctx.closePath();
            ctx.fill();

            // Арматура
            ctx.strokeStyle = '#404040';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(cx - size / 4, cy + size / 8);
            ctx.lineTo(cx + size / 4, cy + size / 8);
            ctx.stroke();
        } else if (type === 'steel') {
            // Металлические осколки
            ctx.fillStyle = '#696969';
            ctx.beginPath();
            ctx.moveTo(cx - size / 2, cy - size / 6);
            ctx.lineTo(cx - size / 3, cy - size / 2);
            ctx.lineTo(cx, cy - size / 4);
            ctx.lineTo(cx - size / 4, cy + size / 3);
            ctx.closePath();
            ctx.fill();

            ctx.fillStyle = '#808080';
            ctx.beginPath();
            ctx.moveTo(cx + size / 8, cy - size / 3);
            ctx.lineTo(cx + size / 2, cy);
            ctx.lineTo(cx + size / 4, cy + size / 3);
            ctx.lineTo(cx, cy + size / 6);
            ctx.closePath();
            ctx.fill();

            // Блик
            ctx.strokeStyle = '#a0a0a0';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(cx - size / 4, cy - size / 4);
            ctx.lineTo(cx - size / 6, cy - size / 8);
            ctx.stroke();
        }
    }
}