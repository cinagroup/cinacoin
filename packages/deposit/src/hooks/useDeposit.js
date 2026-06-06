import { useState, useCallback, useEffect, useRef } from "react";
import { DepositStatus, } from "../types";
import { depositService as defaultService } from "../provider";
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
export function useDeposit(options = {}) {
    const { service = defaultService, pollIntervalMs = 5000, maxPolls = 60, } = options;
    const [deposit, setDeposit] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const pollCount = useRef(0);
    const intervalRef = useRef(null);
    // Cleanup polling on unmount
    useEffect(() => {
        return () => {
            if (intervalRef.current)
                clearInterval(intervalRef.current);
        };
    }, []);
    /** Start polling for deposit status updates. */
    const startPolling = useCallback((params) => {
        if (intervalRef.current)
            clearInterval(intervalRef.current);
        pollCount.current = 0;
        intervalRef.current = setInterval(async () => {
            pollCount.current += 1;
            if (pollCount.current > maxPolls) {
                if (intervalRef.current)
                    clearInterval(intervalRef.current);
                return;
            }
            try {
                const result = service.trackDeposit(params);
                setDeposit(result);
                // Stop polling on terminal status
                if (result.status === DepositStatus.COMPLETED ||
                    result.status === DepositStatus.FAILED) {
                    if (intervalRef.current)
                        clearInterval(intervalRef.current);
                }
            }
            catch (err) {
                setError(err instanceof Error ? err : new Error(String(err)));
                if (intervalRef.current)
                    clearInterval(intervalRef.current);
            }
        }, pollIntervalMs);
    }, [service, pollIntervalMs, maxPolls]);
    const initiateDeposit = useCallback(async (request) => {
        setIsLoading(true);
        setError(null);
        try {
            const result = service.initiateDeposit(request);
            setDeposit(result);
            // Start polling after a brief delay (user needs time to redirect)
            setTimeout(() => {
                startPolling({ depositId: result.depositId, exchangeId: request.exchangeId });
            }, 3000);
            return result;
        }
        catch (err) {
            const errorObj = err instanceof Error ? err : new Error(String(err));
            setError(errorObj);
            throw errorObj;
        }
        finally {
            setIsLoading(false);
        }
    }, [service, startPolling]);
    const trackDeposit = useCallback(async (params) => {
        setIsLoading(true);
        setError(null);
        try {
            const result = service.trackDeposit(params);
            setDeposit(result);
            startPolling(params);
            return result;
        }
        catch (err) {
            const errorObj = err instanceof Error ? err : new Error(String(err));
            setError(errorObj);
            throw errorObj;
        }
        finally {
            setIsLoading(false);
        }
    }, [service, startPolling]);
    const reset = useCallback(() => {
        if (intervalRef.current)
            clearInterval(intervalRef.current);
        pollCount.current = 0;
        setDeposit(null);
        setIsLoading(false);
        setError(null);
    }, []);
    return {
        isLoading,
        deposit,
        error,
        initiateDeposit,
        trackDeposit,
        reset,
    };
}
//# sourceMappingURL=useDeposit.js.map