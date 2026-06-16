export class HUDRenderer {
    draw(ctx, state) {
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

        const startX = 10, startY = 10;
        const itemH = 28, itemW = 140;
        const padding = 6;

        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(startX - 2, startY - 2, itemW + 4, active.length * (itemH + 4) + 4);
        ctx.strokeStyle = 'rgba(76, 175, 80, 0.8)';
        ctx.lineWidth = 2;
        ctx.strokeRect(startX - 2, startY - 2, itemW + 4, active.length * (itemH + 4) + 4);

        const now = Date.now();
        active.forEach(({ key, buff }, i) => {
            const y = startY + i * (itemH + 4);
            const remaining = Math.max(0, buff.endTime - now);
            const total = buff.duration || 10000;
            const percent = (remaining / total) * 100;
            const seconds = Math.ceil(remaining / 1000);
            const info = buffs[key];

            ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
            ctx.fillRect(startX, y, itemW, itemH);

            ctx.font = '18px sans-serif';
            ctx.textAlign = 'left';
            ctx.textBaseline = 'middle';
            ctx.fillText(info.emoji, startX + padding, y + itemH / 2);

            ctx.font = 'bold 11px sans-serif';
            ctx.fillStyle = '#ccc';
            ctx.fillText(info.name, startX + 28, y + 8);

            const barX = startX + 28, barY = y + 16;
            const barW = itemW - 65, barH = 6;
            ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
            ctx.fillRect(barX, barY, barW, barH);

            ctx.fillStyle = percent < 25 ? '#F44336' : (percent < 50 ? '#FF9800' : '#4CAF50');
            ctx.fillRect(barX, barY, barW * (percent / 100), barH);

            ctx.font = 'bold 12px monospace';
            ctx.fillStyle = '#fff';
            ctx.textAlign = 'right';
            ctx.fillText(`${seconds}с`, startX + itemW - padding, y + itemH / 2);
        });
    }
}