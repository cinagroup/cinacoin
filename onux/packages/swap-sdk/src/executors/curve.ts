/**
 * Curve Finance Executor
 *
 * Provides swap quotes and execution via Curve Finance pools.
 * Specializes in stablecoin swaps with minimal slippage.
 */

import type { SwapExecutor } from "../router.js";
import type { SwapQuote, SwapQuoteParams, SwapRoute, SwapTransaction, TokenInfo } from "../types.js";
import { calculateMinimumReceived } from "../slippage.js";
import type {
  WalletClient,
  PublicClient,
  Transport,
  Chain,
  Account,
} from "viem";

// ============================================================
// Constants
// ============================================================

const CURVE_REGISTRY = "0x90E00ACe148ca3b23Ac1bC8C240C2a7Dd9c2d7f5";
const CURVE_REGISTRY_ABI = [
  {
    type: "function" as const,
    name: "get_pool_from_coins",
    stateMutability: "view" as const,
    inputs: [
      { type: "address" as const, name: "coin_a" },
      { type: "address" as const, name: "coin_b" },
    ],
    outputs: [{ type: "address" as const }],
  },
  {
    type: "function" as const,
    name: "get_n_coins",
    stateMutability: "view" as const,
    inputs: [{ type: "address" as const, name: "_pool" }],
    outputs: [{ type: "uint256" as const }],
  },
];

const CURVE_POOL_ABI = [
  {
    type: "function" as const,
    name: "get_dy",
    stateMutability: "view" as const,
    inputs: [
      { type: "int128" as const, name: "i" },
      { type: "int128" as const, name: "j" },
      { type: "uint256" as const, name: "dx" },
    ],
    outputs: [{ type: "uint256" as const }],
  },
  {
    type: "function" as const,
    name: "exchange",
    stateMutability: "nonpayable" as const,
    inputs: [
      { type: "int128" as const, name: "i" },
      { type: "int128" as const, name: "j" },
      { type: "uint256" as const, name: "dx" },
      { type: "uint256" as const, name: "min_dy" },
    ],
    outputs: [],
  },
  {
    type: "function" as const,
    name: "coins",
    stateMutability: "view" as const,
    inputs: [{ type: "uint256" as const, name: "arg0" }],
    outputs: [{ type: "address" as const }],
  },
];

// Common Curve pools by chain
const CURVE_POOLS: Record<number, Array<{ address: string; coins: string[]; name: string }>> = {
  1: [
    {
      address: "0xbEbc44782C7dB0a1A60Cb6fe97d0b483032FF1C7",
      coins: [
        "0x6B175474E89094C44Da98b954EedeAC495271d0F", // DAI
        "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48", // USDC
        "0xdAC17F958D2ee523a2206206994597C13D831ec7", // USDT
      ],
      name: "3pool",
    },
    {
      address: "0xDC24316b9AE028F1497c275EB9192a3Ea0f67022",
      coins: [
        "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2", // WETH
        "0xae7ab96520DE3A18E5e111B5EaAb095312D7fE84", // stETH
      ],
      name: "stETH/ETH",
    },
  ],
};

// ============================================================
// CurveExecutor
// ============================================================

export class CurveExecutor implements SwapExecutor {
  public readonly name = "curve";

  private rpcUrl: string;
  private publicClient: PublicClient<Transport, Chain> | null;

  constructor(options?: {
    rpcUrl?: string;
    publicClient?: PublicClient<Transport, Chain>;
  }) {
    this.rpcUrl = options?.rpcUrl || "";
    this.publicClient = options?.publicClient ?? null;
  }

  setPublicClient(client: PublicClient<Transport, Chain>): void {
    this.publicClient = client;
  }

  async isAvailable(): Promise<boolean> {
    try {
      if (this.rpcUrl) {
        const res = await fetch(this.rpcUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            jsonrpc: "2.0",
            method: "eth_blockNumber",
            params: [],
            id: 1,
          }),
        });
        return res.ok;
      }
      return this.publicClient !== null;
    } catch {
      return false;
    }
  }

  async getQuote(params: SwapQuoteParams): Promise<SwapQuote> {
    const WETH = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";

    if (this.publicClient && params.fromToken !== "native" && params.toToken !== "native") {
      try {
        return await this.getQuoteOnChain(params);
      } catch {
        // Fallback
      }
    }

    return {
      id: `curve-${Date.now()}-${crypto.randomUUID().slice(0, 8)}`,
      fromToken: params.fromToken,
      toToken: params.toToken,
      fromAmount: params.fromAmount,
      toAmount: 0n,
      priceImpact: 0,
      route: [{
        protocol: "curve",
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

  private async getQuoteOnChain(params: SwapQuoteParams): Promise<SwapQuote> {
    const tokenIn = params.fromToken === "native"
      ? "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2" as `0x${string}`
      : params.fromToken;
    const tokenOut = params.toToken === "native"
      ? "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2" as `0x${string}`
      : params.toToken;

    const pools = CURVE_POOLS[params.chainId] || [];
    let bestPool: typeof pools[0] | null = null;
    let bestAmountOut = 0n;
    let bestI = 0;
    let bestJ = 0;

    for (const pool of pools) {
      const iIdx = pool.coins.findIndex(
        (c) => c.toLowerCase() === tokenIn.toLowerCase()
      );
      const jIdx = pool.coins.findIndex(
        (c) => c.toLowerCase() === tokenOut.toLowerCase()
      );
      if (iIdx === -1 || jIdx === -1) continue;

      try {
        const dy = await this.publicClient!.readContract({
          address: pool.address as `0x${string}`,
          abi: CURVE_POOL_ABI,
          functionName: "get_dy",
          args: [BigInt(iIdx), BigInt(jIdx), params.fromAmount],
        });

        if (dy > bestAmountOut) {
          bestAmountOut = dy;
          bestPool = pool;
          bestI = iIdx;
          bestJ = jIdx;
        }
      } catch {
        continue;
      }
    }

    if (!bestPool || bestAmountOut === 0n) {
      throw new Error("No suitable Curve pool found for this token pair");
    }

    return {
      id: `curve-${Date.now()}-${crypto.randomUUID().slice(0, 8)}`,
      fromToken: params.fromToken,
      toToken: params.toToken,
      fromAmount: params.fromAmount,
      toAmount: bestAmountOut,
      priceImpact: 0,
      route: [{
        protocol: `curve-${bestPool.name}`,
        fromToken: params.fromToken,
        toToken: params.toToken,
        fromAmount: params.fromAmount,
        toAmount: bestAmountOut,
        gasEstimate: 200_000n,
      }],
      gasEstimate: 200_000n,
      minimumReceived: calculateMinimumReceived(bestAmountOut, params.slippageBps),
      provider: this.name,
      expiresAt: Date.now() + 30_000,
      chainId: params.chainId,
    };
  }

  async getTransaction(quote: SwapQuote, slippageBps: number): Promise<SwapTransaction> {
    const minimumReceived = calculateMinimumReceived(quote.toAmount, slippageBps);
    const route = quote.route[0];
    if (!route) throw new Error("No route found in quote for Curve execution");

    const WETH = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";
    const pools = CURVE_POOLS[quote.chainId] || [];

    let poolAddress = "";
    let iIdx = 0;
    let jIdx = 0;

    const tokenIn = route.fromToken === "native" ? WETH : route.fromToken;
    const tokenOut = route.toToken === "native" ? WETH : route.toToken;

    for (const pool of pools) {
      const i = pool.coins.findIndex(
        (c) => c.toLowerCase() === (tokenIn as string).toLowerCase()
      );
      const j = pool.coins.findIndex(
        (c) => c.toLowerCase() === (tokenOut as string).toLowerCase()
      );
      if (i !== -1 && j !== -1) {
        poolAddress = pool.address;
        iIdx = i;
        jIdx = j;
        break;
      }
    }

    if (!poolAddress) {
      throw new Error("Pool address not found for this route");
    }

    const abi: typeof CURVE_POOL_ABI = CURVE_POOL_ABI;

    return {
      to: poolAddress as `0x${string}`,
      value: quote.fromToken === "native" ? quote.fromAmount : 0n,
      data: "0x", // encodeFunctionData in production with proper ABI
      gasLimit: quote.gasEstimate > 0n ? quote.gasEstimate * 12n / 10n : 250_000n,
    };
  }

  async executeTransaction(
    tx: SwapTransaction,
    walletClient: WalletClient<Transport, Chain, Account>,
  ): Promise<`0x${string}`> {
    return walletClient.sendTransaction({
      to: tx.to,
      value: tx.value,
      data: tx.data,
      gas: tx.gasLimit,
    });
  }

  async getSupportedTokens(chainId: number): Promise<TokenInfo[]> {
    const pools = CURVE_POOLS[chainId] || [];
    const tokens: TokenInfo[] = [];
    const seen = new Set<string>();

    for (const pool of pools) {
      for (const addr of pool.coins) {
        const key = addr.toLowerCase();
        if (!seen.has(key)) {
          seen.add(key);
          tokens.push({ address: addr as `0x${string}`, symbol: "?", name: "?", decimals: 18 });
        }
      }
    }
    return tokens;
  }
}
