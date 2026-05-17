import type { SolanaGasEstimate, GasCache } from './types.js';
/**
 * Solana gas (compute budget) estimation.
 */
export declare class SolanaEstimator {
    private cache;
    constructor(cache: GasCache);
    /**
     * Estimate Solana compute budget fees.
     */
    estimate(computeUnits?: number, computeUnitPrice?: bigint): Promise<SolanaGasEstimate>;
    /**
     * Get the current compute unit price from network.
     */
    getComputeUnitPrice(rpcUrl: string): Promise<bigint>;
    /**
     * Estimate compute units for a transaction.
     * Returns default estimate; in production, uses simulateTransaction.
     */
    estimateComputeUnits(_tx: string): Promise<number>;
    /**
     * Calculate total estimated cost for a Solana transaction.
     */
    estimateTotal(computeUnits?: number, computeUnitPrice?: bigint): Promise<SolanaGasEstimate>;
}
//# sourceMappingURL=solana.d.ts.map