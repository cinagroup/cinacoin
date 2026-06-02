/**
 * PancakeSwap Executor
 *
 * Provides swap quotes and execution via PancakeSwap V2/V3 pools.
 * Primary DEX on BNB Chain with support for Ethereum, Arbitrum, and more.
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
import { encodeFunctionData, zeroAddress } from "viem";

// ============================================================
// Constants
// ============================================================

const PCS_ROUTERS: Record<string, string> = {
  "56": "0x10ED43C718714eb63d5aA57B78B54704E256024E", // BNB Chain V2
  "1": "0xEfF92A263d31888d860bD50809A8D171709b7b1c",  // Ethereum V2
  "42161": "0x1b81D678ffb9C0263b24A97847620C99d213eB14",   // Arbitrum V2
};

const PCS_ROUTER_V3: Record<string, string> = {
  "56": "0x13f4EA83D0bd40E75C8222255bc855a974568Dd4", // BNB Chain V3
  "1": "0x46eBD11dbb3F0a21a8a25350cb4093851c45E349",  // Ethereum V3
};

const PCS_ROUTER_ABI = [
  {
    type: "function" as const,
    name: "swapExactTokensForTokens",
    stateMutability: "nonpayable" as const,
    inputs: [
      { type: "uint256" as const, name: "amountIn" },
      { type: "uint256" as const, name: "amountOutMin" },
      { type: "address[]" as const, name: "path" },
      { type: "address" as const, name: "to" },
      { type: "uint256" as const, name: "deadline" },
    ],
    outputs: [{ type: "uint256[]" as const }],
  },
  {
    type: "function" as const,
    name: "getAmountsOut",
    stateMutability: "view" as const,
    inputs: [
      { type: "uint256" as const, name: "amountIn" },
      { type: "address[]" as const, name: "path" },
    ],
    outputs: [{ type: "uint256[]" as const }],
  },
];

const PCS_QUOTER_V3_ABI = [
  {
    type: "function" as const,
    name: "quoteExactInputSingle",
    stateMutability: "nonpayable" as const,
    inputs: [
      {
        type: "tuple" as const,
        name: "params",
        components: [
          { type: "address" as const, name: "tokenIn" },
          { type: "address" as const, name: "tokenOut" },
          { type: "uint256" as const, name: "amountIn" },
          { type: "uint24" as const, name: "fee" },
          { type: "uint160" as const, name: "sqrtPriceLimitX96" },
        ],
      },
    ],
    outputs: [
      { type: "uint256" as const, name: "amountOut" },
      { type: "uint160" as const, name: "sqrtPriceX96After" },
      { type: "uint32" as const, name: "initializedTicksCrossed" },
      { type: "uint256" as const, name: "gasEstimate" },
    ],
  },
];

// ============================================================
// PancakeSwapExecutor
// ============================================================

export class PancakeSwapExecutor implements SwapExecutor {
  public readonly name = "pancakeswap";

  private rpcUrl: string;
  private publicClient: PublicClient<Transport, Chain> | null;
  private version: "v2" | "v3";

  constructor(options?: {
    rpcUrl?: string;
    version?: "v2" | "v3";
    publicClient?: PublicClient<Transport, Chain>;
  }) {
    this.rpcUrl = options?.rpcUrl || "";
    this.publicClient = options?.publicClient ?? null;
    this.version = options?.version ?? "v2";
  }

  setPublicClient(client: PublicClient<Transport, Chain>): void {
    this.publicClient = client;
  }

  private getRouterAddress(chainId: number): string | null {
    const routers = this.version === "v3" ? PCS_ROUTER_V3 : PCS_ROUTERS;
    return routers[String(chainId)] ?? null;
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
    const WBNB = params.chainId === 56
      ? "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c"
      : "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";

    if (this.publicClient && params.fromToken !== "native" && params.toToken !== "native") {
      try {
        return await this.getQuoteOnChain(params);
      } catch {
        // Fallback
      }
    }

    return {
      id: `pancakeswap-${Date.now()}-${crypto.randomUUID().slice(0, 8)}`,
      fromToken: params.fromToken,
      toToken: params.toToken,
      fromAmount: params.fromAmount,
      toAmount: 0n,
      priceImpact: 0,
      route: [{
        protocol: `pancakeswap-${this.version}`,
        fromToken: params.fromToken,
        toToken: params.toToken,
        fromAmount: params.fromAmount,
        toAmount: 0n,
        gasEstimate: 160_000n,
      }],
      gasEstimate: 160_000n,
      minimumReceived: calculateMinimumReceived(0n, params.slippageBps),
      provider: this.name,
      expiresAt: Date.now() + 30_000,
      chainId: params.chainId,
    };
  }

  private async getQuoteOnChain(params: SwapQuoteParams): Promise<SwapQuote> {
    const WBNB = params.chainId === 56
      ? "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c" as `0x${string}`
      : "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2" as `0x${string}`;

    const tokenIn = params.fromToken === "native" ? WBNB : params.fromToken;
    const tokenOut = params.toToken === "native" ? WBNB : params.toToken;

    const routerAddr = this.getRouterAddress(params.chainId);
    if (!routerAddr) {
      throw new Error(`PancakeSwap ${this.version} not available on chain ${params.chainId}`);
    }

    if (this.version === "v2") {
      const path = [tokenIn, tokenOut];
      const amounts = await this.publicClient!.readContract({
        address: routerAddr as `0x${string}`,
        abi: PCS_ROUTER_ABI,
        functionName: "getAmountsOut",
        args: [params.fromAmount, path],
      });
      const amountOut = (amounts as unknown as bigint[])[1];
      if (!amountOut || amountOut === 0n) {
        throw new Error("No liquidity found for this token pair on PancakeSwap V2");
      }
      return this.buildQuote(params, amountOut, 160_000n);
    } else {
      // V3: try fee tiers
      const feeTiers = [500, 3000, 10000] as const;
      let bestAmountOut = 0n;
      let bestFee = 3000;
      let bestGas = 180_000n;

      for (const fee of feeTiers) {
        try {
          const quoter = PCS_ROUTER_V3[String(params.chainId)];
          if (!quoter) continue;

          const result = await this.publicClient!.readContract({
            address: quoter as `0x${string}`,
            abi: PCS_QUOTER_V3_ABI,
            functionName: "quoteExactInputSingle",
            args: [{
              tokenIn,
              tokenOut,
              amountIn: params.fromAmount,
              fee,
              sqrtPriceLimitX96: 0n,
            }],
          });
          const amountOut = (result as unknown as bigint[])[0];
          const gasEst = (result as unknown as bigint[])[3];
          if (amountOut > bestAmountOut) {
            bestAmountOut = amountOut;
            bestFee = fee;
            bestGas = gasEst;
          }
        } catch {
          continue;
        }
      }

      if (bestAmountOut === 0n) {
        throw new Error("No liquidity found for this token pair on PancakeSwap V3");
      }

      return this.buildQuote(params, bestAmountOut, bestGas);
    }
  }

  private buildQuote(params: SwapQuoteParams, toAmount: bigint, gasEstimate: bigint): SwapQuote {
    return {
      id: `pancakeswap-${Date.now()}-${crypto.randomUUID().slice(0, 8)}`,
      fromToken: params.fromToken,
      toToken: params.toToken,
      fromAmount: params.fromAmount,
      toAmount,
      priceImpact: 0,
      route: [{
        protocol: `pancakeswap-${this.version}`,
        fromToken: params.fromToken,
        toToken: params.toToken,
        fromAmount: params.fromAmount,
        toAmount,
        gasEstimate,
      }],
      gasEstimate,
      minimumReceived: calculateMinimumReceived(toAmount, params.slippageBps),
      provider: this.name,
      expiresAt: Date.now() + 30_000,
      chainId: params.chainId,
    };
  }

  async getTransaction(quote: SwapQuote, slippageBps: number): Promise<SwapTransaction> {
    const minimumReceived = calculateMinimumReceived(quote.toAmount, slippageBps);
    const deadline = BigInt(Math.floor(Date.now() / 1000) + 1200);

    const routerAddr = this.getRouterAddress(quote.chainId);
    if (!routerAddr) throw new Error("Router not found for this chain");

    const WETH = quote.chainId === 56
      ? "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c"
      : "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";

    const path: `0x${string}`[] = quote.route.map((hop) => {
      const from = hop.fromToken === "native" ? WETH as `0x${string}` : hop.fromToken as `0x${string}`;
      return from;
    });
    const lastToken = quote.route[quote.route.length - 1].toToken;
    path.push(lastToken === "native" ? WETH as `0x${string}` : lastToken as `0x${string}`);

    const data = encodeFunctionData({
      abi: PCS_ROUTER_ABI,
      functionName: "swapExactTokensForTokens",
      args: [quote.fromAmount, minimumReceived, path, zeroAddress, deadline],
    });

    return {
      to: routerAddr as `0x${string}`,
      value: quote.fromToken === "native" ? quote.fromAmount : 0n,
      data,
      gasLimit: quote.gasEstimate > 0n ? quote.gasEstimate * 12n / 10n : 220_000n,
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
    const TOKENS: Record<number, TokenInfo[]> = {
      56: [
        { address: "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c", symbol: "WBNB", name: "Wrapped BNB", decimals: 18 },
        { address: "0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d", symbol: "USDC", name: "USD Coin", decimals: 18 },
        { address: "0x55d398326f99059fF775485246999027B3197955", symbol: "USDT", name: "Tether USD", decimals: 18 },
        { address: "0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56", symbol: "BUSD", name: "BUSD Token", decimals: 18 },
        { address: "0x0E09FaBB73Bd3Ade0a17ECC321fD13a19e81cE82", symbol: "CAKE", name: "PancakeSwap Token", decimals: 18 },
      ],
    };
    return TOKENS[chainId] || [];
  }
}
