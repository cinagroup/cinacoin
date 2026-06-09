import { useCallback, useEffect, useState } from "react";
import type { PublicClient, UserOperation } from "viem";
import { GasSponsor } from "../GasSponsor";
import type { GasEstimate, SponsorshipConfig, SponsorshipResult } from "../types";

/** Default chain IDs supported by the bundled paymasters. */
const SUPPORTED_CHAINS = new Set([
  1, 10, 137, 8453, 42161, 59144, 534352, 7777777, 11155111,
]);

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
export function useGasSponsorship(
  publicClient?: PublicClient,
  config?: SponsorshipConfig,
  chainId?: number,
): UseGasSponsorshipReturn {
  const [gasPrice, setGasPrice] = useState<bigint | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const resolvedChainId = chainId ?? (publicClient?.chain?.id);
  const isSupported = resolvedChainId !== undefined && SUPPORTED_CHAINS.has(resolvedChainId);
  const sponsor = publicClient ? new GasSponsor(publicClient) : null;

  // Fetch gas price on mount / chain change
  useEffect(() => {
    if (!sponsor || !resolvedChainId) return;
    let cancelled = false;
    sponsor.getGasPrice(resolvedChainId).then((price) => {
      if (!cancelled) setGasPrice(price);
    }).catch(() => {
      // Silently ignore — gasPrice stays null
    });
    return () => {
      cancelled = true;
    };
  }, [sponsor, resolvedChainId]);

  const estimateGas = useCallback(
    async (userOperation: Partial<UserOperation>): Promise<GasEstimate | null> => {
      if (!sponsor || !resolvedChainId) {
        setError(new Error("GasSponsor not initialized"));
        return null;
      }
      setIsLoading(true);
      setError(null);
      try {
        const estimate = await sponsor.estimateGas(userOperation, resolvedChainId);
        return estimate;
      } catch (e) {
        const err = e instanceof Error ? e : new Error(String(e));
        setError(err);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [sponsor, resolvedChainId],
  );

  const sponsorUserOperation = useCallback(
    async (userOperation: UserOperation): Promise<SponsorshipResult | null> => {
      if (!sponsor || !resolvedChainId || !config) {
        setError(new Error("GasSponsor or config not provided"));
        return null;
      }
      setIsLoading(true);
      setError(null);
      try {
        const result = await sponsor.sponsorUserOperation(userOperation, config, resolvedChainId);
        return result;
      } catch (e) {
        const err = e instanceof Error ? e : new Error(String(e));
        setError(err);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [sponsor, resolvedChainId, config],
  );

  return {
    estimateGas,
    sponsorUserOperation,
    gasPrice,
    isLoading,
    error,
    isSupported,
    chainId: resolvedChainId,
  };
}
