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
        
        if (s.inventory) {
            const slots = s.inventory.getSlots();
            const canvas = document.getElementById('gameCanvas');

            for (let i = 0; i < slots.length; i++) {
                const slot = slots[i];
                const rect = this._getInventorySlotRect(i, canvas);

                if (mx >= rect.x && mx <= rect.x + rect.width &&
                    my >= rect.y && my <= rect.y + rect.height) {

                    // Активный слот?
                    const isActive = i === s.inventory.getActiveIndex();

                    if (slot.type && slot.count > 0) {
                        // Слот с материалом
                        const materialInfo = this._getMaterialInfo(slot.type);
                        const canPlace = slot.count >= 3;

                        return {
                            emoji: materialInfo.emoji,
                            title: materialInfo.name,
                            stats: [
                                { label: 'Количество', value: `${slot.count} шт.` },
                                { label: 'Для блока', value: canPlace ? '✅ готово' : `❌ нужно ${3 - slot.count}` },
                                { label: 'Слот', value: isActive ? '🎯 активен' : `нажми ${i + 1}` }
                            ],
                            desc: canPlace
                                ? 'ПКМ на карте — построить блок'
                                : 'Собери ещё материал или выбери другой слот'
                        };
                    } else {
                        // Пустой слот
                        return {
                            emoji: '📦',
                            title: `Слот ${i + 1}`,
                            stats: [
                                { label: 'Статус', value: isActive ? '🎯 активен' : 'пусто' }
                            ],
                            desc: 'Подбери материал на карте, чтобы заполнить'
                        };
                    }
                }
            }
        }

        // 1. Бонусы (высший приоритет)
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

        // 🆕 2. Материалы
        const materialNames = {
            brick: { emoji: '🧱', name: 'Кирпичный лом' },
            fortified: { emoji: '🔲', name: 'Бетонный лом' },
            steel: { emoji: '⬛', name: 'Металлический лом' }
        };
        for (const m of s.materials) {
            if (m.isActive && hit(m)) {
                const info = materialNames[m.type];
                const sec = Math.ceil(Math.max(0, m.lifetime - (Date.now() - m.spawnTime)) / 1000);
                return {
                    emoji: info.emoji, title: info.name,
                    stats: [
                        { label: 'Исчезнет через', value: `${sec}с` },
                        { label: 'Для блока нужно', value: '3 шт.' }
                    ],
                    desc: 'Наедьте танком, чтобы подобрать. ПКМ с 3+ в инвентаре — построить блок.'
                };
            }
        }

        // 3. Враги
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

        // 4. Игрок
        if (s.player?.isActive && hit(s.player)) {
            return {
                emoji: '🟢', title: 'Ваш танк',
                stats: [
                    { label: 'HP', value: `${s.player.hp}/${s.player.maxHp}` },
                    { label: 'Жизни', value: `${s.lives}` }
                ],
                desc: 'Стрелки — движение, Пробел/ЛКМ — стрельба.'
            };
        }

        // 5. База
        if (s.base && !s.base.isDestroyed && hit(s.base)) {
            return { emoji: '🏠', title: s.base.displayName, stats: [], desc: s.base.description };
        }

        // 6. Стены
        for (const w of s.walls) {
            if (w.hp > 0 && hit(w)) {
                return {
                    emoji: '', title: w.displayName,
                    stats: [{ label: 'Прочность', value: w.hp === Infinity ? '∞' : `${w.hp}/${w.maxHp}` }],
                    desc: w.description
                };
            }
        }

        // 7. Кусты
        for (const b of s.bushes) if (hit(b)) return { emoji: '', title: b.displayName, stats: [], desc: b.description };

        // 8. Вода
        for (const w of s.waters) if (hit(w)) return { emoji: '', title: w.displayName, stats: [], desc: w.description };

        return null;
    }

    _getInventorySlotRect(index, canvas) {
        const slotSize = 34;
        const gap = 2;
        const padding = 6;
        const totalWidth = 8 * slotSize + 7 * gap;
        const startX = canvas.width - totalWidth - padding;
        const startY = padding;
        const x = startX + index * (slotSize + gap);
        return { x, y: startY, width: slotSize, height: slotSize };
    }


    _getMaterialInfo(type) {
        const info = {
            brick: { emoji: '🧱', name: 'Кирпичный лом' },
            fortified: { emoji: '🔲', name: 'Бетонный лом' },
            steel: { emoji: '⬛', name: 'Металлический лом' }
        };
        return info[type] || { emoji: '📦', name: 'Материал' };
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