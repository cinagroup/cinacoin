import type { Balance } from "../types.js";
interface UseTokenPortfolioResult {
    /** All token balances (native + ERC-20). */
    tokens: Balance[];
    /** Approximate total portfolio value in USD. */
    totalUsd: number;
    isLoading: boolean;
    error: Error | null;
    refetch: () => void;
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
export declare function useTokenPortfolio(address?: string, chainId?: number, tokenAddresses?: string[]): UseTokenPortfolioResult;
export {};
//# sourceMappingURL=useTokenPortfolio.d.ts.map