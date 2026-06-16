import { ENEMY_TYPES } from '../config/enemyTypes.js';

export class TooltipController {
    constructor(canvas, state) {
        this.canvas = canvas;
        this.state = state;
        this.el = document.getElementById('tooltip');
        canvas.addEventListener('mousemove', this._onMove.bind(this));
        canvas.addEventListener('mouseleave', () => this.hide());
    }

    _onMove(e) {
        if (this.state.gameOver) { this.hide(); return; }
        const rect = this.canvas.getBoundingClientRect();
        const sx = this.canvas.width / rect.width;
        const sy = this.canvas.height / rect.height;
        const mx = (e.clientX - rect.left) * sx;
        const my = (e.clientY - rect.top) * sy;

        const info = this._hitTest(mx, my);
        if (info) this._show(info, e.clientX, e.clientY);
        else this.hide();
    }

    _hitTest(mx, my) {
        const s = this.state;
        const hit = (obj) => mx >= obj.x && mx <= obj.x + obj.width &&
                              my >= obj.y && my <= obj.y + obj.height;

        for (const b of s.bonuses) {
            if (b.isActive && hit(b)) {
                const sec = Math.ceil(Math.max(0, b.lifetime - (Date.now() - b.spawnTime)) / 1000);
                return {
                    emoji: b.type.emoji, title: b.type.displayName,
                    stats: [{ label: 'Осталось', value: `${sec}с` }],
                    desc: b.type.description
                };
            }
        }
        for (const e of s.enemies) {
            if (e.isActive && hit(e)) {
                const t = ENEMY_TYPES[e.enemyTypeKey];
                return {
                    emoji: '', title: t.displayName,
                    stats: [
                        { label: 'HP', value: `${e.hp}/${e.maxHp}` },
                        { label: 'Очки', value: `${e.score}` },
                        { label: 'Скорость', value: e.baseSpeed.toFixed(1) }
                    ],
                    desc: t.description
                };
            }
        }
        if (s.player?.isActive && hit(s.player)) {
            return {
                emoji: '🟢', title: 'Ваш танк',
                stats: [
                    { label: 'HP', value: `${s.player.hp}` },
                    { label: 'Жизни', value: `${s.lives}` }
                ],
                desc: 'Используйте стрелки для движения, пробел для стрельбы.'
            };
        }
        if (s.base && !s.base.isDestroyed && hit(s.base)) {
            return { emoji: '🏠', title: s.base.displayName, stats: [], desc: s.base.description };
        }
        for (const w of s.walls) {
            if (w.hp > 0 && hit(w)) {
                return {
                    emoji: '', title: w.displayName,
                    stats: [{ label: 'Прочность', value: w.hp === Infinity ? '∞' : `${w.hp}/${w.maxHp}` }],
                    desc: w.description
                };
            }
        }
        for (const b of s.bushes) if (hit(b)) return { emoji: '', title: b.displayName, stats: [], desc: b.description };
        for (const w of s.waters) if (hit(w)) return { emoji: '', title: w.displayName, stats: [], desc: w.description };
        return null;
    }

    _show(info, mx, my) {
        let html = `<div class="tooltip-header">`;
        if (info.emoji) html += `<span class="tooltip-emoji">${info.emoji}</span>`;
        html += `<span class="tooltip-title">${info.title}</span></div><div class="tooltip-desc">`;
        info.stats?.forEach(s => {
            html += `<div class="tooltip-stat"><span class="tooltip-stat-label">${s.label}:</span>
                     <span class="tooltip-stat-value">${s.value}</span></div>`;
        });
        if (info.desc) {
            html += info.stats?.length
                ? `<div style="margin-top:6px;color:#bbb;font-size:0.85rem;border-top:1px dashed rgba(255,204,0,0.2);padding-top:6px;">${info.desc}</div>`
                : info.desc;
        }
        html += `</div>`;
        this.el.innerHTML = html;
        this.el.classList.add('show');

        const r = this.el.getBoundingClientRect();
        let x = mx + 15, y = my + 15;
        if (x + r.width > window.innerWidth - 10) x = mx - r.width - 15;
        if (y + r.height > window.innerHeight - 10) y = my - r.height - 15;
        this.el.style.left = x + 'px';
        this.el.style.top = y + 'px';
    }

    hide() { this.el.classList.remove('show'); }
}