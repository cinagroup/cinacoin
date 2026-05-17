/**
 * State Storage Abstraction
 *
 * Provides a pluggable storage backend for cross-chain state.
 */
/**
 * In-memory storage implementation (for testing and server-side use).
 */
export class InMemoryStorage {
    constructor() {
        this.store = new Map();
    }
    async get(key) {
        const raw = this.store.get(key);
        if (raw === undefined)
            return null;
        try {
            return JSON.parse(raw);
        }
        catch {
            return null;
        }
    }
    async set(key, value) {
        this.store.set(key, JSON.stringify(value));
    }
    async delete(key) {
        this.store.delete(key);
    }
    async clear() {
        this.store.clear();
    }
}
/**
 * LocalStorage implementation (for browser use).
 */
export class LocalStorage {
    async get(key) {
        const raw = localStorage.getItem(key);
        if (raw === null)
            return null;
        try {
            return JSON.parse(raw);
        }
        catch {
            return null;
        }
    }
    async set(key, value) {
        localStorage.setItem(key, JSON.stringify(value));
    }
    async delete(key) {
        localStorage.removeItem(key);
    }
    async clear() {
        localStorage.clear();
    }
}
//# sourceMappingURL=storage.js.map