import type { Balance, Transaction, TokenMetadata } from "../types.js";
interface UseBalanceResult {
    balance: Balance | null;
    formatted: string;
    symbol: string;
    isLoading: boolean;
    error: Error | null;
    refetch: () => void;
}
/**
 * Fetch the native token balance for a given address.
 *
 * @param address - Wallet address (required). Pass `undefined` to skip.
 * @param chainId - EVM chain id (defaults to client default).
 *
 * ```tsx
 * const { balance, formatted, symbol, isLoading } = useBalance(address, 1);
 * ```
 */
export declare function useBalance(address?: string, chainId?: number): UseBalanceResult;
interface UseTransactionHistoryResult {
    transactions: Transaction[];
    isLoading: boolean;
    error: Error | null;
    cursor: string | undefined;
    hasMore: boolean;
    loadMore: () => void;
    refetch: () => void;
}
/**
 * Fetch transaction history for a given address.
 *
 * @param address - Wallet address (required). Pass `undefined` to skip.
 * @param chainId - EVM chain id.
 * @param limit - Items per page (default 20).
 *
 * ```tsx
 * const { transactions, isLoading, loadMore } = useTransactionHistory(address, 1);
 * ```
 */
export declare function useTransactionHistory(address?: string, chainId?: number, limit?: number): UseTransactionHistoryResult;
interface UseENSResult {
    address: string | null;
    isLoading: boolean;
    error: Error | null;
    refetch: () => void;
}
/**
 * Resolve an ENS name to an Ethereum address.
 *
 * @param name - ENS name (e.g. `vitalik.eth`). Pass `undefined` to skip.
 *
 * ```tsx
 * const { address, isLoading } = useENS("vitalik.eth");
 * ```
 */
export declare function useENS(name?: string): UseENSResult;
interface UseReverseENSResult {
    name: string | null;
    isLoading: boolean;
    error: Error | null;
    refetch: () => void;
}
/**
 * Reverse ENS lookup — get the ENS name for an address.
 *
 * @param address - Ethereum address. Pass `undefined` to skip.
 *
 * ```tsx
 * const { name, isLoading } = useReverseENS("0x…");
 * ```
 */
export declare function useReverseENS(address?: string): UseReverseENSResult;
interface UseTokenMetadataResult {
    metadata: TokenMetadata | null;
    name: string;
    symbol: string;
    decimals: number;
    logo: string | undefined;
    isLoading: boolean;
    error: Error | null;
    refetch: () => void;
}
/**
 * Fetch ERC-20 token metadata by contract address.
 *
 * @param tokenAddress - Contract address. Pass `undefined` to skip.
 * @param chainId - EVM chain id.
 *
 * ```tsx
 * const { name, symbol, decimals } = useTokenMetadata("0x…");
 * ```
 */
export declare function useTokenMetadata(tokenAddress?: string, chainId?: number): UseTokenMetadataResult;
export {};
//# sourceMappingURL=useBlockchainApi.d.ts.map