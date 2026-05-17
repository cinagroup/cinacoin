import type { Address, Hex, UserOperation } from "viem";
/**
 * Configuration for gas sponsorship via a paymaster.
 */
export interface SponsorshipConfig {
    /** Pimlico / Alchemy / Candle paymaster URL. */
    paymasterUrl: string;
    /** Paymaster contract address on the target chain. */
    paymasterAddress?: Address;
    /** Whether to sponsor gas for the user operation. */
    sponsorGas: boolean;
    /** Maximum gas limit (in units) the sponsor will cover. */
    maxGasLimit?: bigint;
    /** Alert threshold: notify when paymaster balance drops below this. */
    balanceThreshold?: bigint;
}
/**
 * Estimated gas breakdown for a user operation.
 */
export interface GasEstimate {
    /** Gas limit for verification. */
    verificationGasLimit: bigint;
    /** Gas limit for call execution. */
    callGasLimit: bigint;
    /** Pre-verification gas paid upfront. */
    preVerificationGas: bigint;
    /** Max fee per gas (EIP-1559). */
    maxFeePerGas: bigint;
    /** Max priority fee per gas (EIP-1559). */
    maxPriorityFeePerGas: bigint;
    /** Total gas limit (sum of all limits). */
    totalGasLimit: bigint;
    /** Estimated total cost in native token (wei). */
    estimatedCostWei: bigint;
    /** Approximate USD value of the estimated cost (0 if unavailable). */
    estimatedCostUsd: number;
    /** Chain ID the estimate was computed for. */
    chainId: number;
}
/**
 * Result after sponsoring a user operation with a paymaster.
 */
export interface SponsorshipResult {
    /** Original user operation (unmodified). */
    userOperation: UserOperation;
    /** User operation with paymaster fields populated. */
    sponsoredUserOperation: UserOperation;
    /** Paymaster address that provided sponsorship. */
    paymasterAddress: Address;
    /** `paymasterAndData` hex blob attached to the operation. */
    paymasterAndData: Hex;
    /** Gas sponsored amount (in wei). */
    sponsoredGasWei: bigint;
    /** Chain ID. */
    chainId: number;
}
/**
 * Native token metadata for a supported chain.
 */
export interface ChainNativeToken {
    symbol: string;
    decimals: number;
    name: string;
}
/**
 * Paymaster provider identifiers.
 */
export type PaymasterProvider = "pimlico" | "alchemy" | "candle";
/**
 * Status of a paymaster balance check.
 */
export interface PaymasterBalance {
    paymasterAddress: Address;
    chainId: number;
    balanceWei: bigint;
    balanceFormatted: string;
    /** Whether balance is below the configured alert threshold. */
    isLow: boolean;
}
//# sourceMappingURL=types.d.ts.map