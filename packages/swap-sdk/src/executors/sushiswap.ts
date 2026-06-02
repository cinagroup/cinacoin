/**
 * SushiSwap Executor
 *
 * Provides swap quotes and execution via SushiSwap V2/V3 pools.
 * Uses SushiSwap Router for on-chain price estimation.
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

const SUSHISWAP_ROUTER_V2 = "0xd9e1cE17f2641f24aE83637ab66a2cca9C378B9F";
const SUSHISWAP_ROUTER_V3 = "0x2Ab93065C18E369905183b6e2519c958A6F7c4eb";

const SUSHISWAP_ROUTER_ABI = [
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

// ============================================================
// SushiSwapExecutor
// ============================================================

export class SushiSwapExecutor implements SwapExecutor {
  public readonly name = "sushiswap";

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

  private getRouterAddress(): string {
    return this.version === "v3" ? SUSHISWAP_ROUTER_V3 : SUSHISWAP_ROUTER_V2;
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
        // Fallback to placeholder
      }
    }

    const route: SwapRoute[] = [
      {
        protocol: `sushiswap-${this.version}`,
        fromToken: params.fromToken,
        toToken: params.toToken,
        fromAmount: params.fromAmount,
        toAmount: 0n,
        gasEstimate: 150_000n,
      },
    ];

    return {
      id: `sushiswap-${Date.now()}-${crypto.randomUUID().slice(0, 8)}`,
      fromToken: params.fromToken,
      toToken: params.toToken,
      fromAmount: params.fromAmount,
      toAmount: 0n,
      priceImpact: 0,
      route,
      gasEstimate: 150_000n,
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

    const path = [tokenIn, tokenOut];

    const amounts = await this.publicClient!.readContract({
      address: this.getRouterAddress() as `0x${string}`,
      abi: SUSHISWAP_ROUTER_ABI,
      functionName: "getAmountsOut",
      args: [params.fromAmount, path],
    });

    const amountOut = (amounts as unknown as bigint[])[1];
    if (!amountOut || amountOut === 0n) {
      throw new Error("No liquidity found for this token pair on SushiSwap");
    }

    const route: SwapRoute[] = [
      {
        protocol: `sushiswap-${this.version}`,
        fromToken: params.fromToken,
        toToken: params.toToken,
        fromAmount: params.fromAmount,
        toAmount: amountOut,
        gasEstimate: 150_000n,
      },
    ];

    return {
      id: `sushiswap-${Date.now()}-${crypto.randomUUID().slice(0, 8)}`,
      fromToken: params.fromToken,
      toToken: params.toToken,
      fromAmount: params.fromAmount,
      toAmount: amountOut,
      priceImpact: 0,
      route,
      gasEstimate: 150_000n,
      minimumReceived: calculateMinimumReceived(amountOut, params.slippageBps),
      provider: this.name,
      expiresAt: Date.now() + 30_000,
      chainId: params.chainId,
    };
  }

  async getTransaction(quote: SwapQuote, slippageBps: number): Promise<SwapTransaction> {
    const minimumReceived = calculateMinimumReceived(quote.toAmount, slippageBps);
    const deadline = BigInt(Math.floor(Date.now() / 1000) + 1200); // 20 min

    const WETH = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";
    const path = quote.route.map((hop) => {
      const from = hop.fromToken === "native" ? WETH : (hop.fromToken as `0x${string}`);
      return from;
    });
    const lastToken = quote.route[quote.route.length - 1].toToken;
    const lastAddr = lastToken === "native" ? WETH : (lastToken as `0x${string}`);
    path.push(lastAddr);

    const data = encodeFunctionData({
      abi: SUSHISWAP_ROUTER_ABI,
      functionName: "swapExactTokensForTokens",
      args: [
        quote.fromAmount,
        minimumReceived,
        path,
        zeroAddress,
        deadline,
      ],
    });

    return {
      to: this.getRouterAddress() as `0x${string}`,
      value: quote.fromToken === "native" ? quote.fromAmount : 0n,
      data,
      gasLimit: quote.gasEstimate > 0n ? quote.gasEstimate * 12n / 10n : 200_000n,
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
      1: [
        { address: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2", symbol: "WETH", name: "Wrapped Ether", decimals: 18 },
        { address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48", symbol: "USDC", name: "USD Coin", decimals: 6 },
        { address: "0xdAC17F958D2ee523a2206206994597C13D831ec7", symbol: "USDT", name: "Tether USD", decimals: 6 },
        { address: "0x6B175474E89094C44Da98b954EedeAC495271d0F", symbol: "DAI", name: "Dai Stablecoin", decimals: 18 },
        { address: "0x6B3595068778DD592e39A122f4f5a5cF09C90fE2", symbol: "SUSHI", name: "SushiToken", decimals: 18 },
      ],
      137: [
        { address: "0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619", symbol: "WETH", name: "Wrapped Ether", decimals: 18 },
        { address: "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174", symbol: "USDC", name: "USD Coin", decimals: 6 },
      ],
    };
    return TOKENS[chainId] || [];
  }
}
