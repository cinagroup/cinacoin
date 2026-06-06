/**
 * In-memory token metadata cache with TTL support.
 */
export class LRUTokenCache {
    constructor(maxSize = 50) {
        this.store = new Map();
        this.maxSize = maxSize;
    }
    get(key) {
        const entry = this.store.get(key);
        return entry?.tokens;
    }
    set(key, tokens) {
        if (this.store.size >= this.maxSize) {
            // Evict the oldest entry
            const firstKey = this.store.keys().next().value;
            if (firstKey)
                this.store.delete(firstKey);
        }
        this.store.set(key, { tokens, timestamp: Date.now() });
    }
    has(key) {
        return this.store.has(key);
    }
    delete(key) {
        return this.store.delete(key);
    }
    clear() {
        this.store.clear();
    }
    getTimestamp(key) {
        return this.store.get(key)?.timestamp;
    }
    /**
     * Check if a cached entry is stale.
     */
    isStale(key, maxAgeMs) {
        const timestamp = this.getTimestamp(key);
        if (timestamp === undefined)
            return true;
        return Date.now() - timestamp > maxAgeMs;
    }
}
export const defaultCache = new LRUTokenCache();
//# sourceMappingURL=cache.js.map