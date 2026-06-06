import type { PublicClient, UserOperation } from "viem";
import type { GasEstimate, SponsorshipConfig, SponsorshipResult } from "../types";
export interface UseGasSponsorshipReturn {
    /** Estimate gas for a user operation. */
    estimateGas: (userOperation: Partial<UserOperation>) => Promise<GasEstimate | null>;
    /** Sponsor a user operation with the current config. */
    sponsorUserOperation: (userOperation: UserOperation) => Promise<SponsorshipResult | null>;
    /** Current gas price (wei) or null. */
    gasPrice: bigint | null;
    /** Whether a call is in progress. */
    isLoading: boolean;
    /** Last error encountered. */
    error: Error | null;
    /** Whether the current chain supports gas sponsorship. */
    isSupported: boolean;
    /** The active chain ID. */
    chainId: number | undefined;
}
/**
 * React hook for gas sponsorship operations.
 *
 * @param publicClient - viem PublicClient for the target chain.
 * @param config - Optional sponsorship config; omit to disable sponsorship.
 * @param chainId - Active chain ID (auto-detected if omitted).
 * @returns Sponsorship helpers + state.
 */
export declare function useGasSponsorship(publicClient?: PublicClient, config?: SponsorshipConfig, chainId?: number): UseGasSponsorshipReturn;
//# sourceMappingURL=useGasSponsorship.d.ts.map