/**
 * Simple gas price cache with TTL.
 */
export class GasPriceCache {
    constructor(config) {
        this.store = new Map();
        this.ttl = config?.cacheTtlMs ?? 30000;
    }
    get(key) {
        const entry = this.store.get(key);
        if (!entry)
            return undefined;
        if (Date.now() - entry.timestamp > this.ttl) {
            this.store.delete(key);
            return undefined;
        }
        return entry;
    }
    set(key, data) {
        this.store.set(key, { ...data, timestamp: Date.now() });
    }
    has(key) {
        const entry = this.get(key);
        return entry !== undefined;
    }
    clear() {
        this.store.clear();
    }
    /**
     * Prune expired entries.
     */
    prune() {
        const now = Date.now();
        for (const [key, entry] of this.store) {
            if (now - entry.timestamp > this.ttl) {
                this.store.delete(key);
            }
        }
    }
}
//# sourceMappingURL=cache.js.map