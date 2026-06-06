import { GasPriceCache } from './cache.js';
import { EVMEstimator } from './chains/evm.js';
import { SolanaEstimator } from './chains/solana.js';
/**
 * GasEstimator — Unified gas estimation for EVM and Solana chains.
 */
export class GasEstimator {
    constructor(config = {}) {
        this.cache = new GasPriceCache(config);
        this.evm = new EVMEstimator(this.cache);
        this.solana = new SolanaEstimator(this.cache);
    }
    /**
     * Estimate EVM gas (EIP-1559).
     */
    async estimateEvm(gasLimit, baseFeePerGas, priorityFeePerGas) {
        return this.evm.estimate(gasLimit, baseFeePerGas, priorityFeePerGas);
    }
    /**
     * Estimate Solana compute budget.
     */
    async estimateSolana(computeUnits, computeUnitPrice) {
        return this.solana.estimate(computeUnits, computeUnitPrice);
    }
    /**
     * Get current gas price for an EVM chain.
     */
    async getGasPrice(rpcUrl) {
        return this.evm.getGasPrice(rpcUrl);
    }
    /**
     * Get fee history for EVM chains.
     */
    async getFeeHistory(blockCount, newestBlock, rewardPercentiles) {
        return this.evm.getFeeHistory(blockCount, newestBlock, rewardPercentiles);
    }
    /**
     * Predict gas prices for different speed tiers.
     */
    async predictGasPrices(baseFeePerGas, history) {
        return this.evm.predict(baseFeePerGas, history);
    }
    /**
     * Get the gas cache.
     */
    getCache() {
        return this.cache;
    }
    /**
     * Clear all cached gas data.
     */
    clearCache() {
        this.cache.clear();
    }
}
//# sourceMappingURL=estimator.js.map