const DEFAULT_COMPUTE_UNITS = 200000;
const DEFAULT_COMPUTE_UNIT_PRICE = 1000n; // micro-lamports
const DEFAULT_BASE_FEE = 5000n; // lamports
/**
 * Solana gas (compute budget) estimation.
 */
export class SolanaEstimator {
    constructor(cache) {
        this.cache = cache;
    }
    /**
     * Estimate Solana compute budget fees.
     */
    async estimate(computeUnits = DEFAULT_COMPUTE_UNITS, computeUnitPrice = DEFAULT_COMPUTE_UNIT_PRICE) {
        const priorityFee = (BigInt(computeUnits) * computeUnitPrice) / 1000000n;
        const estimatedCost = DEFAULT_BASE_FEE + priorityFee;
        return {
            computeUnits,
            computeUnitPrice,
            baseFee: DEFAULT_BASE_FEE,
            estimatedCost,
        };
    }
    /**
     * Get the current compute unit price from network.
     */
    async getComputeUnitPrice(rpcUrl) {
        const cacheKey = `solana:cup:${rpcUrl}`;
        const cached = this.cache.get(cacheKey);
        if (cached)
            return cached.gasPrice;
        // In production, this would query Solana's recent prioritization fees
        const price = DEFAULT_COMPUTE_UNIT_PRICE;
        this.cache.set(cacheKey, {
            gasPrice: price,
            timestamp: Date.now(),
        });
        return price;
    }
    /**
     * Estimate compute units for a transaction.
     * Returns default estimate; in production, uses simulateTransaction.
     */
    async estimateComputeUnits(_tx) {
        return DEFAULT_COMPUTE_UNITS;
    }
    /**
     * Calculate total estimated cost for a Solana transaction.
     */
    async estimateTotal(computeUnits = DEFAULT_COMPUTE_UNITS, computeUnitPrice) {
        const price = computeUnitPrice ?? DEFAULT_COMPUTE_UNIT_PRICE;
        return this.estimate(computeUnits, price);
    }
}
//# sourceMappingURL=solana.js.map