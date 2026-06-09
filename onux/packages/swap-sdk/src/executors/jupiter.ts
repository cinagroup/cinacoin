/**
 * Jupiter Executor (Solana)
 *
 * Provides swap quotes and execution via Jupiter Aggregator on Solana.
 * Jupiter is the largest Solana DEX aggregator, routing across Raydium,
 * Orca, Serum, and other Solana liquidity sources.
 *
 * Note: This executor provides the quote and transaction data.
 * Actual execution requires a Solana wallet adapter (not viem).
 */

import type { SwapExecutor } from "../router.js";
import type { SwapQuote, SwapQuoteParams, SwapRoute, SwapTransaction, TokenInfo } from "../types.js";
import { calculateMinimumReceived } from "../slippage.js";
import type { WalletClient, Transport, Chain, Account } from "viem";

// ============================================================
// Constants
// ============================================================

const JUPITER_API_BASE = "https://quote-api.jup.ag/v6";

interface JupiterQuoteResponse {
  inputMint: string;
  inAmount: string;
  outputMint: string;
  outAmount: string;
  otherAmountThreshold: string;
  swapMode: string;
  slippageBps: number;
  platformFee: { amount?: string; feeBps?: number } | null;
  priceImpactPct: string;
  routePlan: Array<{
    swapInfo: {
      ammKey: string;
      label: string;
      inputMint: string;
      outputMint: string;
      inAmount: string;
      outAmount: string;
      feeAmount: string;
      feeMint: string;
    };
    percent: number;
  }>;
  contextSlot?: number;
  timeTaken?: number;
}

interface JupiterSwapResponse {
  swapTransaction: string; // Base64-encoded transaction
  lastValidBlockHeight: number;
  prioritizationFeeLamports?: number;
  computeUnitLimit?: number;
}

// Known Solana token addresses
const SOLANA_TOKENS: Record<string, TokenInfo> = {
  "So11111111111111111111111111111111111111112": {
    address: "So11111111111111111111111111111111111111112" as `0x${string}`,
    symbol: "SOL",
    name: "Wrapped SOL",
    decimals: 9,
  },
  "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v": {
    address: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v" as `0x${string}`,
    symbol: "USDC",
    name: "USD Coin",
    decimals: 6,
  },
  "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB": {
    address: "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB" as `0x${string}`,
    symbol: "USDT",
    name: "Tether USD",
    decimals: 6,
  },
  "JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN": {
    address: "JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN" as `0x${string}`,
    symbol: "JUP",
    name: "Jupiter",
    decimals: 6,
  },
  "DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263": {
    address: "DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263" as `0x${string}`,
    symbol: "BONK",
    name: "Bonk",
    decimals: 5,
  },
};

// ============================================================
// JupiterExecutor
// ============================================================

export class JupiterExecutor implements SwapExecutor {
  public readonly name = "jupiter";

  private timeoutMs: number;

  constructor(options?: { timeoutMs?: number }) {
    this.timeoutMs = options?.timeoutMs ?? 8_000;
  }

  async isAvailable(): Promise<boolean> {
    try {
      const res = await fetch(`${JUPITER_API_BASE}/quote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          inputMint: "So11111111111111111111111111111111111111112",
          outputMint: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
          amount: "1000000000",
          slippageBps: 50,
        }),
      });
      return res.ok;
    } catch {
      return false;
    }
  }

  async getQuote(params: SwapQuoteParams): Promise<SwapQuote> {
    const inputMint = this.resolveSolanaAddress(params.fromToken);
    const outputMint = this.resolveSolanaAddress(params.toToken);

    const url = new URL(`${JUPITER_API_BASE}/quote`);
    url.searchParams.set("inputMint", inputMint);
    url.searchParams.set("outputMint", outputMint);
    url.searchParams.set("amount", params.fromAmount.toString());
    url.searchParams.set("slippageBps", params.slippageBps.toString());
    url.searchParams.set("onlyDirectRoutes", "false");
    url.searchParams.set("asLegacyTransaction", "true");

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const res = await fetch(url.toString(), { signal: controller.signal });
      clearTimeout(timeout);

      if (!res.ok) {
        throw new Error(`Jupiter quote failed: ${res.status} ${res.statusText}`);
      }

      const data: JupiterQuoteResponse = await res.json();
      return this.buildQuoteFromResponse(params, data);
    } catch (err) {
      clearTimeout(timeout);
      // Fallback quote
      return this.fallbackQuote(params);
    }
  }

  private buildQuoteFromResponse(
    params: SwapQuoteParams,
    data: JupiterQuoteResponse,
  ): SwapQuote {
    const toAmount = BigInt(data.outAmount);

    const route: SwapRoute[] = data.routePlan.map((hop) => ({
      protocol: hop.swapInfo.label || "jupiter",
      fromToken: this.fromSolanaAddress(hop.swapInfo.inputMint),
      toToken: this.fromSolanaAddress(hop.swapInfo.outputMint),
      fromAmount: BigInt(hop.swapInfo.inAmount),
      toAmount: BigInt(hop.swapInfo.outAmount),
      gasEstimate: 200_000n,
    }));

    return {
      id: `jupiter-${Date.now()}-${crypto.randomUUID().slice(0, 8)}`,
      fromToken: params.fromToken,
      toToken: params.toToken,
      fromAmount: params.fromAmount,
      toAmount,
      priceImpact: parseFloat(data.priceImpactPct) || 0,
      route,
      gasEstimate: 200_000n,
      minimumReceived: calculateMinimumReceived(toAmount, params.slippageBps),
      provider: this.name,
      expiresAt: Date.now() + 30_000,
      chainId: params.chainId,
    };
  }

  private fallbackQuote(params: SwapQuoteParams): SwapQuote {
    return {
      id: `jupiter-${Date.now()}-${crypto.randomUUID().slice(0, 8)}`,
      fromToken: params.fromToken,
      toToken: params.toToken,
      fromAmount: params.fromAmount,
      toAmount: 0n,
      priceImpact: 0,
      route: [{
        protocol: "jupiter",
        fromToken: params.fromToken,
        toToken: params.toToken,
        fromAmount: params.fromAmount,
        toAmount: 0n,
        gasEstimate: 200_000n,
      }],
      gasEstimate: 200_000n,
      minimumReceived: calculateMinimumReceived(0n, params.slippageBps),
      provider: this.name,
      expiresAt: Date.now() + 30_000,
      chainId: params.chainId,
    };
  }

  async getTransaction(quote: SwapQuote, slippageBps: number): Promise<SwapTransaction> {
    const inputMint = this.resolveSolanaAddress(quote.fromToken);
    const outputMint = this.resolveSolanaAddress(quote.toToken);

    // First get a fresh quote with the updated slippage
    const quoteUrl = new URL(`${JUPITER_API_BASE}/quote`);
    quoteUrl.searchParams.set("inputMint", inputMint);
    quoteUrl.searchParams.set("outputMint", outputMint);
    quoteUrl.searchParams.set("amount", quote.fromAmount.toString());
    quoteUrl.searchParams.set("slippageBps", slippageBps.toString());
    quoteUrl.searchParams.set("asLegacyTransaction", "true");

    const quoteRes = await fetch(quoteUrl.toString());
    if (!quoteRes.ok) {
      throw new Error(`Jupiter quote for tx failed: ${quoteRes.status}`);
    }

    // Then get the swap transaction
    const swapUrl = new URL(`${JUPITER_API_BASE}/swap`);
    swapUrl.searchParams.set("quoteResponse", JSON.stringify(await quoteRes.json()));

    const swapRes = await fetch(swapUrl.toString(), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });

    if (!swapRes.ok) {
      throw new Error(`Jupiter swap tx failed: ${swapRes.status}`);
    }

    const swapData: JupiterSwapResponse = await swapRes.json();

    // Encode the base64 transaction as hex data for the SwapTransaction interface
    // In production, this would be handled by a Solana-specific adapter
    return {
      to: "JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4" as `0x${string}`,
      value: 0n,
      data: `0x${Buffer.from(swapData.swapTransaction, "base64").toString("hex")}` as `0x${string}`,
      gasLimit: BigInt(swapData.computeUnitLimit ?? 1_400_000),
    };
  }

  async executeTransaction(
    _tx: SwapTransaction,
    _walletClient: WalletClient<Transport, Chain, Account>,
  ): Promise<`0x${string}`> {
    throw new Error(
      "JupiterExecutor.executeTransaction requires a Solana wallet adapter, not viem. " +
      "Use the Solana-specific transaction sender from the returned SwapTransaction.data.",
    );
  }

  async getSupportedTokens(chainId: number): Promise<TokenInfo[]> {
    if (chainId === 101 || chainId === 1151111081099710) { // Solana mainnet chain IDs
      return Object.values(SOLANA_TOKENS);
    }
    return [];
  }

  // ============================================================
  // Helpers
  // ============================================================

  private resolveSolanaAddress(token: string | `0x${string}`): string {
    if (token === "native") return "So11111111111111111111111111111111111111112";
    return token;
  }

  private fromSolanaAddress(addr: string): `0x${string}` | "native" {
    const SOL = "So11111111111111111111111111111111111111112";
    return addr === SOL ? "native" : (addr as `0x${string}`);
  }
}
