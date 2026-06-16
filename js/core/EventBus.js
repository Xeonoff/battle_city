/**
 * Простая pub/sub система для loose coupling между модулями.
 */
export class EventBus {
    constructor() {
        this.listeners = new Map();
    }

    on(event, callback) {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, new Set());
        }
        this.listeners.get(event).add(callback);
        return () => this.off(event, callback);
    }

    off(event, callback) {
        this.listeners.get(event)?.delete(callback);
    }

    emit(event, data) {
        this.listeners.get(event)?.forEach(cb => {
            try { cb(data); } catch (e) { console.error(`EventBus error [${event}]:`, e); }
        });
    }

    clear() {
        this.listeners.clear();
    }
}

// Singleton instance
export const eventBus = new EventBus();