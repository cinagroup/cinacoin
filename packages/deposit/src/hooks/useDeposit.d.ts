import { DepositRequest, DepositResult, TrackDepositParams } from "../types";
import { DepositService } from "../provider";
export interface UseDepositReturn {
    /** Whether a deposit is currently in progress. */
    isLoading: boolean;
    /** The most recent deposit result (if any). */
    deposit: DepositResult | null;
    /** Error from the last operation (if any). */
    error: Error | null;
    /** Initiate a deposit — sets loading, returns a result with redirect URL. */
    initiateDeposit: (request: DepositRequest) => Promise<DepositResult>;
    /** Track deposit status by ID. */
    trackDeposit: (params: TrackDepositParams) => Promise<DepositResult>;
    /** Clear the current deposit state. */
    reset: () => void;
}
export interface UseDepositOptions {
    /** Override the default DepositService instance. */
    service?: DepositService;
    /** Polling interval in ms for status tracking. Default: 5000. */
    pollIntervalMs?: number;
    /** Maximum number of polling attempts before stopping. Default: 60 (5 min at 5s). */
    maxPolls?: number;
}
/**
 * Hook to manage deposit initiation and status tracking.
 *
 * @example
 * ```tsx
 * const { initiateDeposit, deposit, isLoading, error } = useDeposit();
 *
 * const handleDeposit = async () => {
 *   const result = await initiateDeposit({
 *     exchangeId: "binance",
 *     asset: "USDC",
 *     network: "base",
 *     amount: 100,
 *   });
 *   // redirect user: window.open(result.depositUrl)
 * };
 * ```
 */
export declare function useDeposit(options?: UseDepositOptions): UseDepositReturn;
//# sourceMappingURL=useDeposit.d.ts.map