import type { TokenInfo, TokenListCache } from './types.js';
/**
 * In-memory token metadata cache with TTL support.
 */
export declare class LRUTokenCache implements TokenListCache {
    private store;
    private maxSize;
    constructor(maxSize?: number);
    get(key: string): TokenInfo[] | undefined;
    set(key: string, tokens: TokenInfo[]): void;
    has(key: string): boolean;
    delete(key: string): boolean;
    clear(): void;
    getTimestamp(key: string): number | undefined;
    /**
     * Check if a cached entry is stale.
     */
    isStale(key: string, maxAgeMs: number): boolean;
}
export declare const defaultCache: LRUTokenCache;
//# sourceMappingURL=cache.d.ts.map