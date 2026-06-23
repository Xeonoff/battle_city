import { TILE_SIZE } from '../config/constants.js';
import { Wall } from '../entities/Wall.js';

export class InventorySystem {
    constructor(state) {
        this.state = state;
        // 🆕 8 слотов вместо 9
        this.slots = Array(8).fill(null).map(() => ({ type: null, count: 0 }));
        this.activeSlot = 0;
        this.materialsPerBlock = 3;
    }

    clear() {
        this.slots.forEach(slot => {
            slot.type = null;
            slot.count = 0;
        });
        this.activeSlot = 0;
    }
    
    addMaterial(type) {
        const existingSlot = this.slots.find(s => s.type === type);
        if (existingSlot) {
            existingSlot.count++;
            return;
        }

        const emptySlot = this.slots.find(s => s.type === null);
        if (emptySlot) {
            emptySlot.type = type;
            emptySlot.count = 1;
            return;
        }
    }

    getActiveSlot() {
        return this.slots[this.activeSlot];
    }

    setActiveSlot(index) {
        // 🆕 проверка для 8 слотов (индексы 0-7)
        if (index >= 0 && index < 8) {
            this.activeSlot = index;
        }
    }

    canPlaceBlock() {
        const slot = this.getActiveSlot();
        return slot && slot.type && slot.count >= this.materialsPerBlock;
    }

    placeBlock(canvasX, canvasY) {
        if (!this.canPlaceBlock()) return false;

        const gx = Math.floor(canvasX / TILE_SIZE);
        const gy = Math.floor(canvasY / TILE_SIZE);
        const x = gx * TILE_SIZE;
        const y = gy * TILE_SIZE;

        if (!this._isCellFree(x, y)) return false;

        const slot = this.getActiveSlot();
        const wall = new Wall(x, y, slot.type);
        this.state.walls.push(wall);

        slot.count -= this.materialsPerBlock;
        if (slot.count <= 0) {
            slot.type = null;
            slot.count = 0;
        }

        return true;
    }

    _isCellFree(x, y) {
        const rect = { x, y, width: TILE_SIZE, height: TILE_SIZE };

        for (const wall of this.state.walls) {
            if (wall.hp > 0) {
                const wr = wall.getRect();
                if (rect.x < wr.x + wr.width && rect.x + rect.width > wr.x &&
                    rect.y < wr.y + wr.height && rect.y + rect.height > wr.y) {
                    return false;
                }
            }
        }

        for (const water of this.state.waters) {
            const wr = water.getRect();
            if (rect.x < wr.x + wr.width && rect.x + rect.width > wr.x &&
                rect.y < wr.y + wr.height && rect.y + rect.height > wr.y) {
                return false;
            }
        }

        for (const bush of this.state.bushes) {
            const br = bush.getRect();
            if (rect.x < br.x + br.width && rect.x + rect.width > br.x &&
                rect.y < br.y + br.height && rect.y + rect.height > br.y) {
                return false;
            }
        }

        if (this.state.base && !this.state.base.isDestroyed) {
            const br = this.state.base.getRect();
            if (rect.x < br.x + br.width && rect.x + rect.width > br.x &&
                rect.y < br.y + br.height && rect.y + rect.height > br.y) {
                return false;
            }
        }

        const tanks = [this.state.player, ...this.state.enemies].filter(t => t && t.isActive);
        for (const tank of tanks) {
            const tr = { x: tank.x, y: tank.y, width: tank.width, height: tank.height };
            if (rect.x < tr.x + tr.width && rect.x + rect.width > tr.x &&
                rect.y < tr.y + tr.height && rect.y + rect.height > tr.y) {
                return false;
            }
        }

        return true;
    }

    getSlots() {
        return this.slots;
    }

    getActiveIndex() {
        return this.activeSlot;
    }
}