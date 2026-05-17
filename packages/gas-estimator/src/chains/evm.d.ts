import type { EvmGasEstimate, FeeHistoryEntry, GasPriceData, LegacyGasEstimate, GasCache, GasPricePrediction } from './types.js';
/**
 * EVM gas estimation supporting EIP-1559 and legacy transactions.
 */
export declare class EVMEstimator {
    private cache;
    constructor(cache: GasCache);
    /**
     * Estimate gas for an EIP-1559 transaction.
     */
    estimate(gasLimit: bigint, baseFeePerGas: bigint, priorityFeePerGas: bigint): Promise<EvmGasEstimate>;
    /**
     * Estimate gas for a legacy transaction.
     */
    estimateLegacy(gasLimit: bigint, gasPrice: bigint): Promise<LegacyGasEstimate>;
    /**
     * Get gas price from the cache or a provider.
     */
    getGasPrice(rpcUrl: string): Promise<GasPriceData>;
    /**
     * Get fee history for fee analysis.
     */
    getFeeHistory(_blockCount: number, _newestBlock?: string, _rewardPercentiles?: number[]): Promise<FeeHistoryEntry[]>;
    /**
     * Predict gas prices for different speed tiers.
     */
    predict(baseFeePerGas: bigint, history: FeeHistoryEntry[]): Promise<GasPricePrediction>;
}
//# sourceMappingURL=evm.d.ts.map