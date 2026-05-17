/**
 * Swap SDK Type Definitions
 *
 * Defines the core types for the CinaConnect Swap Aggregator SDK.
 */
import type { Address } from "viem";
/**
 * Parameters for requesting a swap quote.
 */
export interface SwapQuoteParams {
    /** Source token address (or native token identifier) */
    fromToken: Address | "native";
    /** Destination token address (or native token identifier) */
    toToken: Address | "native";
    /** Input amount in the smallest unit (wei for ETH, base units for ERC-20) */
    fromAmount: bigint;
    /** Chain ID for the target network */
    chainId: number;
    /** Maximum acceptable slippage in basis points (e.g., 50 = 0.5%) */
    slippageBps: number;
    /** Recipient address (defaults to sender) */
    recipient?: Address;
    /** Fee recipient for protocol fee sharing */
    feeRecipient?: Address;
    /** Fee in basis points (0 to disable) */
    feeBps?: number;
}
/**
 * A single route hop within a swap.
 */
export interface SwapRoute {
    /** DEX / protocol name */
    protocol: string;
    /** Input token for this hop */
    fromToken: Address | "native";
    /** Output token for this hop */
    toToken: Address | "native";
    /** Input amount for this hop */
    fromAmount: bigint;
    /** Expected output amount for this hop */
    toAmount: bigint;
    /** Estimated gas for this hop */
    gasEstimate: bigint;
}
/**
 * A complete swap quote from a single DEX provider.
 */
export interface SwapQuote {
    /** Unique quote ID */
    id: string;
    /** Source token */
    fromToken: Address | "native";
    /** Destination token */
    toToken: Address | "native";
    /** Input amount */
    fromAmount: bigint;
    /** Expected output amount */
    toAmount: bigint;
    /** Price impact percentage (0-100) */
    priceImpact: number;
    /** Route hops */
    route: SwapRoute[];
    /** Total estimated gas */
    gasEstimate: bigint;
    /** Minimum amount received after slippage */
    minimumReceived: bigint;
    /** Source DEX / provider */
    provider: string;
    /** Unix timestamp when this quote expires */
    expiresAt: number;
    /** Encoded transaction data for execution */
    tx?: SwapTransaction;
}
/**
 * Transaction data required to execute a swap.
 */
export interface SwapTransaction {
    /** Target contract address */
    to: Address;
    /** ETH value to send (for native token swaps) */
    value: bigint;
    /** Encoded calldata */
    data: `0x${string}`;
    /** Gas limit estimate */
    gasLimit: bigint;
}
/**
 * Receipt returned after a successful swap execution.
 */
export interface SwapReceipt {
    /** Transaction hash */
    txHash: `0x${string}`;
    /** Quote ID that was executed */
    quoteId: string;
    /** Actual input amount */
    fromAmount: bigint;
    /** Actual output amount received */
    toAmount: bigint;
    /** Gas used */
    gasUsed: bigint;
    /** Gas price paid */
    gasPrice: bigint;
    /** Block number */
    blockNumber: bigint;
    /** Whether the swap succeeded */
    success: boolean;
}
/**
 * Token metadata.
 */
export interface TokenInfo {
    /** Token address */
    address: Address;
    /** Token symbol */
    symbol: string;
    /** Token name */
    name: string;
    /** Number of decimals */
    decimals: number;
    /** Token logo URI */
    logoURI?: string;
    /** Whether the token is on a default list */
    isDefault?: boolean;
}
/**
 * Price impact calculation result.
 */
export interface PriceImpact {
    /** Impact percentage (0-100) */
    percentage: number;
    /** Severity level */
    severity: "low" | "medium" | "high" | "critical";
    /** Warning message if applicable */
    warning?: string;
}
/**
 * Aggregated swap result — the best quote across all providers.
 */
export interface BestQuote {
    /** The best individual quote */
    quote: SwapQuote;
    /** All quotes returned (for comparison) */
    allQuotes: SwapQuote[];
    /** Savings vs the second-best option (in output tokens) */
    savingsVsSecond: bigint;
}
/**
 * Parameters for executing a swap.
 */
export interface SwapExecuteParams {
    /** The quote to execute */
    quote: SwapQuote;
    /** Override slippage (defaults to quote's original) */
    slippageBps?: number;
    /** Max gas price to accept (wei) */
    maxGasPrice?: bigint;
    /** Transaction timeout (ms) */
    timeoutMs?: number;
}
//# sourceMappingURL=types.d.ts.map