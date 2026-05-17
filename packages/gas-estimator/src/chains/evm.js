/**
 * EVM gas estimation supporting EIP-1559 and legacy transactions.
 */
export class EVMEstimator {
    constructor(cache) {
        this.cache = cache;
    }
    /**
     * Estimate gas for an EIP-1559 transaction.
     */
    async estimate(gasLimit, baseFeePerGas, priorityFeePerGas) {
        const maxFeePerGas = baseFeePerGas * 2n + priorityFeePerGas;
        const estimatedCost = gasLimit * maxFeePerGas;
        return {
            gasLimit,
            maxFeePerGas,
            maxPriorityFeePerGas: priorityFeePerGas,
            baseFeePerGas,
            estimatedCost,
        };
    }
    /**
     * Estimate gas for a legacy transaction.
     */
    async estimateLegacy(gasLimit, gasPrice) {
        const estimatedCost = gasLimit * gasPrice;
        return { gasLimit, gasPrice, estimatedCost };
    }
    /**
     * Get gas price from the cache or a provider.
     */
    async getGasPrice(rpcUrl) {
        const cacheKey = `gas:${rpcUrl}`;
        const cached = this.cache.get(cacheKey);
        if (cached)
            return cached;
        // In production, this would call eth_gasPrice
        // Here we simulate with a fallback
        const data = {
            gasPrice: 20000000000n, // 20 gwei default
            timestamp: Date.now(),
        };
        this.cache.set(cacheKey, data);
        return data;
    }
    /**
     * Get fee history for fee analysis.
     */
    async getFeeHistory(_blockCount, _newestBlock, _rewardPercentiles) {
        // In production, this would call eth_feeHistory
        // Return simulated data
        return [
            { baseFeePerGas: 20000000000n, gasUsedRatio: 0.5 },
            { baseFeePerGas: 22000000000n, gasUsedRatio: 0.7 },
            { baseFeePerGas: 18000000000n, gasUsedRatio: 0.3 },
        ];
    }
    /**
     * Predict gas prices for different speed tiers.
     */
    async predict(baseFeePerGas, history) {
        const avgGasUsedRatio = history.reduce((sum, h) => sum + h.gasUsedRatio, 0) / history.length;
        // Slow: next block, minimal priority fee
        const slowPriorityFee = baseFeePerGas / 10n;
        // Standard: moderate priority
        const stdPriorityFee = baseFeePerGas / 5n;
        // Fast: high priority
        const fastPriorityFee = baseFeePerGas / 2n;
        return {
            slow: {
                maxFeePerGas: baseFeePerGas * 2n + slowPriorityFee,
                maxPriorityFeePerGas: slowPriorityFee,
                estimatedTime: 120, // seconds
            },
            standard: {
                maxFeePerGas: baseFeePerGas * 2n + stdPriorityFee,
                maxPriorityFeePerGas: stdPriorityFee,
                estimatedTime: 30,
            },
            fast: {
                maxFeePerGas: baseFeePerGas * 2n + fastPriorityFee,
                maxPriorityFeePerGas: fastPriorityFee,
                estimatedTime: 10,
            },
        };
    }
}
//# sourceMappingURL=evm.js.map