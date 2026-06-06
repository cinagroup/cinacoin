import { useState, useEffect, useCallback, useRef } from "react";
import { createBlockchainApi } from "../client.js";
// ---------------------------------------------------------------------------
// Shared client (reuses the same singleton as useBlockchainApi)
// ---------------------------------------------------------------------------
// Import via module-level reference to avoid circularity; if the hook
// module hasn't loaded the singleton yet we fall back to a fresh instance.
let _portfolioClient = null;
function getPortfolioClient() {
    if (!_portfolioClient) {
        _portfolioClient = createBlockchainApi({
            rpcUrls: typeof process !== "undefined" && process.env?.NEXT_PUBLIC_RPC_URLS
                ? JSON.parse(process.env.NEXT_PUBLIC_RPC_URLS)
                : undefined,
            metadataBaseUrl: typeof process !== "undefined"
                ? process.env.NEXT_PUBLIC_METADATA_BASE_URL
                : undefined,
            defaultChainId: typeof process !== "undefined" && process.env?.NEXT_PUBLIC_DEFAULT_CHAIN_ID
                ? Number(process.env.NEXT_PUBLIC_DEFAULT_CHAIN_ID)
                : undefined,
        });
    }
    return _portfolioClient;
}
/**
 * Portfolio overview hook — fetches native + ERC-20 token balances
 * for a given address and computes total USD value.
 *
 * @param address - Wallet address (required). Pass `undefined` to skip.
 * @param chainId - EVM chain id to query.
 * @param tokenAddresses - Optional list of ERC-20 addresses to include.
 *
 * ```tsx
 * const { tokens, totalUsd, isLoading } = useTokenPortfolio(address, 1);
 * ```
 */
export function useTokenPortfolio(address, chainId, tokenAddresses) {
    const client = getPortfolioClient();
    const [tokens, setTokens] = useState([]);
    const [totalUsd, setTotalUsd] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const abortRef = useRef(null);
    const fetchPortfolio = useCallback(() => {
        if (!address) {
            setTokens([]);
            setTotalUsd(0);
            return;
        }
        abortRef.current?.abort();
        const controller = new AbortController();
        abortRef.current = controller;
        setIsLoading(true);
        setError(null);
        client
            .getTokenBalances(address, chainId, tokenAddresses)
            .then((result) => {
            if (!controller.signal.aborted) {
                setTokens(result);
                // Compute total USD value from individual token values.
                // Tokens with priceUsd get valueUsd = balance * price.
                const total = result.reduce((sum, t) => {
                    if (t.valueUsd != null)
                        return sum + t.valueUsd;
                    if (t.priceUsd != null) {
                        return sum + Number(t.balance) * t.priceUsd / Math.pow(10, t.decimals);
                    }
                    return sum;
                }, 0);
                setTotalUsd(total);
                setIsLoading(false);
            }
        })
            .catch((err) => {
            if (!controller.signal.aborted) {
                setError(err instanceof Error ? err : new Error(String(err)));
                setIsLoading(false);
            }
        });
    }, [address, chainId, tokenAddresses, client]);
    useEffect(() => {
        fetchPortfolio();
        return () => {
            abortRef.current?.abort();
        };
    }, [fetchPortfolio]);
    return {
        tokens,
        totalUsd,
        isLoading,
        error,
        refetch: fetchPortfolio,
    };
}
//# sourceMappingURL=useTokenPortfolio.js.map