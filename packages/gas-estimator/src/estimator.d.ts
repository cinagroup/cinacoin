import { GasPriceCache } from './cache.js';
import type { GasEstimatorConfig, EvmGasEstimate, SolanaGasEstimate, GasPriceData, GasPricePrediction, FeeHistoryEntry } from './types.js';
/**
 * GasEstimator — Unified gas estimation for EVM and Solana chains.
 */
export declare class GasEstimator {
    private evm;
    private solana;
    private cache;
    constructor(config?: GasEstimatorConfig);
    /**
     * Estimate EVM gas (EIP-1559).
     */
    estimateEvm(gasLimit: bigint, baseFeePerGas: bigint, priorityFeePerGas: bigint): Promise<EvmGasEstimate>;
    /**
     * Estimate Solana compute budget.
     */
    estimateSolana(computeUnits?: number, computeUnitPrice?: bigint): Promise<SolanaGasEstimate>;
    /**
     * Get current gas price for an EVM chain.
     */
    getGasPrice(rpcUrl: string): Promise<GasPriceData>;
    /**
     * Get fee history for EVM chains.
     */
    getFeeHistory(blockCount: number, newestBlock?: string, rewardPercentiles?: number[]): Promise<FeeHistoryEntry[]>;
    /**
     * Predict gas prices for different speed tiers.
     */
    predictGasPrices(baseFeePerGas: bigint, history: FeeHistoryEntry[]): Promise<GasPricePrediction>;
    /**
     * Get the gas cache.
     */
    getCache(): GasPriceCache;
    /**
     * Clear all cached gas data.
     */
    clearCache(): void;
}
//# sourceMappingURL=estimator.d.ts.map