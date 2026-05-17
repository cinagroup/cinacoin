import type { GasCache, GasPriceData, GasEstimatorConfig } from './types.js';
/**
 * Simple gas price cache with TTL.
 */
export declare class GasPriceCache implements GasCache {
    private store;
    private ttl;
    constructor(config?: GasEstimatorConfig);
    get(key: string): GasPriceData | undefined;
    set(key: string, data: GasPriceData): void;
    has(key: string): boolean;
    clear(): void;
    /**
     * Prune expired entries.
     */
    prune(): void;
}
//# sourceMappingURL=cache.d.ts.map