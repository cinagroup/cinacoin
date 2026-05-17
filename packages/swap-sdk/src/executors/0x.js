/**
 * 0x Protocol Executor
 *
 * Provides swap quotes and execution via the 0x API v2.
 * Documentation: https://0x.org/docs/api
 */
import { calculateMinimumReceived } from "../slippage.js.js";
// ============================================================
// Constants
// ============================================================
const ZEROX_API_BASE = "https://api.0x.org";
const ZEROX_NATIVE = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE";
// ============================================================
// ZeroxExecutor
// ============================================================
export class ZeroxExecutor {
    constructor(apiKey) {
        this.name = "0x";
        this.apiKey = apiKey;
    }
    async isAvailable() {
        try {
            const res = await fetch(`${ZEROX_API_BASE}/swap/v1/quote`, {
                method: "POST",
                headers: {
                    "0x-api-key": this.apiKey,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    sellToken: "USDC",
                    buyToken: "WETH",
                    sellAmount: "1000000",
                }),
            });
            return res.ok || res.status === 400; // 400 is fine (validation error means API is up)
        }
        catch {
            return false;
        }
    }
    async getQuote(params) {
        const url = new URL(`${ZEROX_API_BASE}/swap/v1/quote`);
        url.searchParams.set("chainId", params.chainId.toString());
        url.searchParams.set("sellToken", this.resolveAddress(params.fromToken));
        url.searchParams.set("buyToken", this.resolveAddress(params.toToken));
        url.searchParams.set("sellAmount", params.fromAmount.toString());
        const res = await fetch(url.toString(), {
            headers: { "0x-api-key": this.apiKey },
        });
        if (!res.ok) {
            throw new Error(`0x quote failed: ${res.status} ${res.statusText}`);
        }
        const data = await res.json();
        const toAmount = BigInt(data.buyAmount);
        const route = data.sources.map((source) => ({
            protocol: source.name,
            fromToken: params.fromToken,
            toToken: params.toToken,
            fromAmount: params.fromAmount,
            toAmount,
            gasEstimate: BigInt(data.estimatedGas),
        }));
        if (route.length === 0) {
            route.push({
                protocol: "0x",
                fromToken: params.fromToken,
                toToken: params.toToken,
                fromAmount: params.fromAmount,
                toAmount,
                gasEstimate: BigInt(data.estimatedGas),
            });
        }
        return {
            id: `0x-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            fromToken: params.fromToken,
            toToken: params.toToken,
            fromAmount: params.fromAmount,
            toAmount,
            priceImpact: 0,
            route,
            gasEstimate: BigInt(data.estimatedGas),
            minimumReceived: calculateMinimumReceived(toAmount, params.slippageBps),
            provider: this.name,
            expiresAt: Date.now() + 30000,
        };
    }
    async getTransaction(quote, slippageBps) {
        const url = new URL(`${ZEROX_API_BASE}/swap/v1/quote`);
        url.searchParams.set("chainId", "1");
        url.searchParams.set("sellToken", this.resolveAddress(quote.fromToken));
        url.searchParams.set("buyToken", this.resolveAddress(quote.toToken));
        url.searchParams.set("sellAmount", quote.fromAmount.toString());
        url.searchParams.set("slippagePercentage", (slippageBps / 10000).toString());
        const res = await fetch(url.toString(), {
            headers: { "0x-api-key": this.apiKey },
        });
        if (!res.ok) {
            throw new Error(`0x transaction failed: ${res.status} ${res.statusText}`);
        }
        const data = await res.json();
        return {
            to: data.to,
            value: BigInt(data.value),
            data: data.data,
            gasLimit: BigInt(data.estimatedGas),
        };
    }
    async getSupportedTokens(chainId) {
        // 0x doesn't have a direct tokens endpoint; use metadata from quotes
        // In production, maintain a token list or use a separate service
        return [];
    }
    resolveAddress(token) {
        return token === "native" ? ZEROX_NATIVE : token;
    }
}
//# sourceMappingURL=0x.js.map