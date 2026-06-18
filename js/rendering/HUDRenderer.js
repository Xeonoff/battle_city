export class HUDRenderer {
    constructor() {
        this.padding = {
            startX: 10,
            startY: 10,
            gapAfterHpBar: 8,
            gapBetweenBuffs: 4 
        };
        this.hpBar = {
            width: 140,
            height: 20,
            innerHeight: 12
        };
        this.buffItem = {
            width: 140,
            height: 28
        };
    }
    draw(ctx, state) {
        const startX = this.padding.startX;
        let currentY = this.padding.startY;

        // === 1. HP бар игрока (ВСЕГДА сверху) ===
        if (state.player && state.player.isActive && state.player.maxHp > 1) {
            this._drawHpBar(ctx, state, startX, currentY);
            currentY += this.hpBar.height + this.padding.gapAfterHpBar;
        }

        // === 2. Баффы (ПОД HP баром) ===
        this._drawBuffs(ctx, state, startX, currentY);
    }

    _drawHpBar(ctx, state, x, y) {
        const { width, height, innerHeight } = this.hpBar;
        const ratio = state.player.hp / state.player.maxHp;

        // Фон панели
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(x - 2, y - 2, width + 4, height + 4);
        ctx.strokeStyle = 'rgba(76, 175, 80, 0.8)';
        ctx.lineWidth = 2;
        ctx.strokeRect(x - 2, y - 2, width + 4, height + 4);

        // Иконка сердца
        ctx.font = '14px sans-serif';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = '#fff';
        ctx.fillText('❤️', x + 4, y + height / 2);

        // Полоса HP
        const hpBarX = x + 24;
        const hpBarWidth = width - 50;
        const hpBarY = y + (height - innerHeight) / 2;

        // Фон полосы
        ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        ctx.fillRect(hpBarX, hpBarY, hpBarWidth, innerHeight);

        // Заполнение (цвет зависит от % HP)
        let color;
        if (ratio > 0.66) color = '#4CAF50';
        else if (ratio > 0.33) color = '#FF9800';
        else color = '#F44336';

        ctx.fillStyle = color;
        ctx.fillRect(hpBarX, hpBarY, hpBarWidth * ratio, innerHeight);

        // Разделители сегментов
        if (state.player.maxHp > 1) {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
            for (let i = 1; i < state.player.maxHp; i++) {
                const sx = hpBarX + (hpBarWidth / state.player.maxHp) * i;
                ctx.fillRect(sx - 0.5, hpBarY, 1, innerHeight);
            }
        }

        // Текст HP
        ctx.font = 'bold 11px monospace';
        ctx.fillStyle = '#fff';
        ctx.textAlign = 'right';
        ctx.fillText(`${state.player.hp}/${state.player.maxHp}`, x + width - 6, y + height / 2);
    }

    _drawBuffs(ctx, state, startX, startY) {
        const buffs = {
            shield: { emoji: '🛡️', name: 'Щит' },
            triple: { emoji: '⚡', name: 'Тройной' },
            ricochet: { emoji: '🔄', name: 'Рикошет' },
            star: { emoji: '⭐', name: 'Скорость' }
        };

        const active = Object.entries(state.playerBuffs)
            .filter(([_, b]) => b.active)
            .map(([k, b]) => ({ key: k, buff: b }));

        if (active.length === 0) return;

        const { width, height } = this.buffItem;
        const padding = 6;
        const gap = this.padding.gapBetweenBuffs;

        // Фон панели баффов
        const panelHeight = active.length * (height + gap) - gap;
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(startX - 2, startY - 2, width + 4, panelHeight + 4);
        ctx.strokeStyle = 'rgba(76, 175, 80, 0.8)';
        ctx.lineWidth = 2;
        ctx.strokeRect(startX - 2, startY - 2, width + 4, panelHeight + 4);

        const now = Date.now();
        active.forEach(({ key, buff }, i) => {
            const y = startY + i * (height + gap);
            const remaining = Math.max(0, buff.endTime - now);
            const total = buff.duration || 10000;
            const percent = (remaining / total) * 100;
            const seconds = Math.ceil(remaining / 1000);
            const info = buffs[key];

            // Фон элемента
            ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
            ctx.fillRect(startX, y, width, height);

            // Эмодзи
            ctx.font = '18px sans-serif';
            ctx.textAlign = 'left';
            ctx.textBaseline = 'middle';
            ctx.fillText(info.emoji, startX + padding, y + height / 2);

            // Название
            ctx.font = 'bold 11px sans-serif';
            ctx.fillStyle = '#ccc';
            ctx.fillText(info.name, startX + 28, y + 8);

            // Прогресс-бар
            const barX = startX + 28;
            const barY = y + 16;
            const barW = width - 65;
            const barH = 6;

            ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
            ctx.fillRect(barX, barY, barW, barH);

            let barColor;
            if (percent < 25) barColor = '#F44336';
            else if (percent < 50) barColor = '#FF9800';
            else barColor = '#4CAF50';

            ctx.fillStyle = barColor;
            ctx.fillRect(barX, barY, barW * (percent / 100), barH);

            // Таймер
            ctx.font = 'bold 12px monospace';
            ctx.fillStyle = '#fff';
            ctx.textAlign = 'right';
            ctx.fillText(`${seconds}с`, startX + width - padding, y + height / 2);
        });
    }
}