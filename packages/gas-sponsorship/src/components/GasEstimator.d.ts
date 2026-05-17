import type { FC } from "react";
import type { GasEstimate, SponsorshipConfig } from "../types";
export interface GasEstimatorProps {
    /** Gas estimate data from GasSponsor. */
    estimate: GasEstimate;
    /** Optional sponsorship config — when provided, shows sponsorship status. */
    sponsorshipConfig?: SponsorshipConfig | null;
    /** Current paymaster balance (wei) — shows low-balance warning if threshold set. */
    paymasterBalanceWei?: bigint;
    /** Native token symbol (auto-filled from estimate chain). */
    tokenSymbol?: string;
}
/**
 * Displays estimated gas cost in native token and USD,
 * sponsorship availability, and paymaster balance status.
 */
export declare const GasEstimator: FC<GasEstimatorProps>;
//# sourceMappingURL=GasEstimator.d.ts.map