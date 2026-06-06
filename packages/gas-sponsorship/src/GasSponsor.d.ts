import type { Address, Hex, PublicClient, UserOperation } from "viem";
import type { SponsorshipConfig, GasEstimate, SponsorshipResult, PaymasterBalance } from "./types";
/**
 * Enterprise gas sponsorship manager for smart accounts.
 *
 * Wraps paymaster integration (Pimlico, Alchemy, Candle) with gas
 * estimation, price lookups, and paymaster balance management.
 */
export declare class GasSponsor {
    /** Public client for on-chain reads. */
    readonly publicClient: PublicClient;
    constructor(publicClient: PublicClient);
    /**
     * Estimate gas for a user operation.
     *
     * @param userOperation - Partial user operation with callData & sender.
     * @param chainId - Target chain ID.
     * @returns Full gas estimate with wei and USD cost.
     */
    estimateGas(userOperation: Partial<UserOperation>, chainId: number): Promise<GasEstimate>;
    /**
     * Sponsor a user operation by attaching paymaster data.
     *
     * @param userOperation - User operation to sponsor.
     * @param config - Sponsorship configuration.
     * @param chainId - Target chain ID.
     * @returns Sponsorship result with both original and sponsored operations.
     */
    sponsorUserOperation(userOperation: UserOperation, config: SponsorshipConfig, chainId: number): Promise<SponsorshipResult>;
    /**
     * Get current base gas price for a chain (acts as maxPriorityFeePerGas fallback).
     *
     * @param chainId - Target chain ID.
     * @returns Gas price in wei.
     */
    getGasPrice(chainId: number): Promise<bigint>;
    /**
     * Get EIP-1559 max fee per gas for a chain.
     *
     * @param chainId - Target chain ID.
     * @returns Max fee per gas in wei.
     */
    getMaxFeePerGas(chainId: number): Promise<bigint>;
    /**
     * Get the current paymaster balance on a given chain.
     *
     * @param paymasterAddress - Paymaster contract address.
     * @param chainId - Target chain ID.
     * @param threshold - Optional low-balance alert threshold.
     * @returns Paymaster balance info.
     */
    getSponsoredBalance(paymasterAddress: Address, chainId: number, threshold?: bigint): Promise<PaymasterBalance>;
    /**
     * Fund the paymaster by sending native token to its address.
     *
     * NOTE: This constructs transaction parameters but does NOT broadcast.
     * The caller must sign and send via their wallet.
     *
     * @param paymasterAddress - Paymaster contract address.
     * @param chainId - Target chain ID.
     * @param amount - Amount in wei to send.
     * @returns Transaction parameters for funding.
     */
    fundPaymaster(paymasterAddress: Address, _chainId: number, amount: bigint): Promise<{
        to: Address;
        value: bigint;
        data: Hex;
    }>;
}
//# sourceMappingURL=GasSponsor.d.ts.map