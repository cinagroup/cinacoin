/**
 * Tests for SwapQuoter — quote aggregation, best price selection.
 * Uses mock executors to avoid real HTTP calls.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SwapQuoter } from '../src/quoter.js';
// Mock executor factory
function createMockExecutor(name, toAmount, priceImpact = 0.5, gasEstimate = 150000n) {
    return {
        name,
        isAvailable: async () => true,
        getQuote: async (params) => ({
            id: `quote-${name}-${Date.now()}`,
            fromToken: params.fromToken,
            toToken: params.toToken,
            fromAmount: params.fromAmount,
            toAmount,
            priceImpact,
            route: [
                {
                    protocol: name,
                    fromToken: params.fromToken,
                    toToken: params.toToken,
                    fromAmount: params.fromAmount,
                    toAmount,
                    gasEstimate,
                },
            ],
            gasEstimate,
            minimumReceived: 0n,
            provider: name,
            expiresAt: Date.now() + 60000,
        }),
        getTransaction: async (quote, slippageBps) => ({
            to: quote.toToken,
            value: 0n,
            data: '0xmock',
            gasLimit: quote.gasEstimate,
        }),
        getSupportedTokens: async (chainId) => [],
    };
}
// Failing executor
function createFailingExecutor(name, error) {
    return {
        name,
        isAvailable: async () => false,
        getQuote: async (_params) => {
            throw new Error(error);
        },
        getTransaction: async () => ({
            to: '0x',
            value: 0n,
            data: '0x',
            gasLimit: 0n,
        }),
        getSupportedTokens: async () => [],
    };
}
describe('SwapQuoter', () => {
    let quoter;
    let executors;
    beforeEach(() => {
        executors = [
            createMockExecutor('uniswap', 1000000n, 0.5),
            createMockExecutor('oneinch', 1020000n, 0.3, 140000n),
            createMockExecutor('zerox', 980000n, 0.8, 160000n),
        ];
        quoter = new SwapQuoter(executors);
    });
    it('should return best quote by highest output amount', async () => {
        const params = {
            fromToken: '0xUSDC',
            toToken: '0xWETH',
            fromAmount: 1000n * 1000000n,
            chainId: 1,
            slippageBps: 50,
        };
        const best = await quoter.getBestQuote(params);
        expect(best.quote.provider).toBe('oneinch');
        expect(best.quote.toAmount).toBe(1020000n);
    });
    it('should return all valid quotes for comparison', async () => {
        const params = {
            fromToken: '0xUSDC',
            toToken: '0xWETH',
            fromAmount: 1000n * 1000000n,
            chainId: 1,
            slippageBps: 50,
        };
        const best = await quoter.getBestQuote(params);
        expect(best.allQuotes).toHaveLength(3);
        // Sorted by output descending
        expect(best.allQuotes[0].toAmount).toBe(1020000n);
        expect(best.allQuotes[1].toAmount).toBe(1000000n);
        expect(best.allQuotes[2].toAmount).toBe(980000n);
    });
    it('should calculate savings vs second best', async () => {
        const params = {
            fromToken: '0xUSDC',
            toToken: '0xWETH',
            fromAmount: 1000n * 1000000n,
            chainId: 1,
            slippageBps: 50,
        };
        const best = await quoter.getBestQuote(params);
        expect(best.savingsVsSecond).toBe(1020000n - 1000000n);
        expect(best.savingsVsSecond).toBe(20000n);
    });
    it('should have zero savings when only one quote', async () => {
        const singleExecutor = [createMockExecutor('uniswap', 1000000n)];
        quoter = new SwapQuoter(singleExecutor);
        const params = {
            fromToken: '0xUSDC',
            toToken: '0xWETH',
            fromAmount: 1000n * 1000000n,
            chainId: 1,
            slippageBps: 50,
        };
        const best = await quoter.getBestQuote(params);
        expect(best.savingsVsSecond).toBe(0n);
    });
    it('should filter out quotes with zero output', async () => {
        const executorsWithZero = [
            createMockExecutor('uniswap', 0n),
            createMockExecutor('oneinch', 1000000n),
        ];
        quoter = new SwapQuoter(executorsWithZero);
        const params = {
            fromToken: '0xUSDC',
            toToken: '0xWETH',
            fromAmount: 1000n * 1000000n,
            chainId: 1,
            slippageBps: 50,
        };
        const best = await quoter.getBestQuote(params);
        expect(best.allQuotes).toHaveLength(1);
        expect(best.quote.provider).toBe('oneinch');
    });
    it('should throw when no valid quotes available', async () => {
        const failingExecutors = [
            createFailingExecutor('broken1', 'Network error'),
            createFailingExecutor('broken2', 'API down'),
        ];
        quoter = new SwapQuoter(failingExecutors);
        // Suppress console.warn in test
        const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => { });
        const params = {
            fromToken: '0xUSDC',
            toToken: '0xWETH',
            fromAmount: 1000n * 1000000n,
            chainId: 1,
            slippageBps: 50,
        };
        await expect(quoter.getBestQuote(params)).rejects.toThrow('No valid swap quotes available');
        warnSpy.mockRestore();
    });
    it('should skip failing executors and return remaining quotes', async () => {
        const mixedExecutors = [
            createMockExecutor('uniswap', 1000000n),
            createFailingExecutor('broken', 'API error'),
            createMockExecutor('oneinch', 1050000n),
        ];
        quoter = new SwapQuoter(mixedExecutors);
        const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => { });
        const params = {
            fromToken: '0xUSDC',
            toToken: '0xWETH',
            fromAmount: 1000n * 1000000n,
            chainId: 1,
            slippageBps: 50,
        };
        const best = await quoter.getBestQuote(params);
        expect(best.allQuotes).toHaveLength(2);
        expect(best.quote.provider).toBe('oneinch');
        warnSpy.mockRestore();
    });
    it('should get quote from a specific provider', async () => {
        const params = {
            fromToken: '0xUSDC',
            toToken: '0xWETH',
            fromAmount: 1000n * 1000000n,
            chainId: 1,
            slippageBps: 50,
        };
        const quote = await quoter.getQuoteFrom('uniswap', params);
        expect(quote.provider).toBe('uniswap');
        expect(quote.toAmount).toBe(1000000n);
    });
    it('should throw when requesting quote from unknown provider', async () => {
        const params = {
            fromToken: '0xUSDC',
            toToken: '0xWETH',
            fromAmount: 1000n * 1000000n,
            chainId: 1,
            slippageBps: 50,
        };
        await expect(quoter.getQuoteFrom('unknown', params)).rejects.toThrow('Unknown provider');
    });
    it('should return available provider names', () => {
        const providers = quoter.getAvailableProviders();
        expect(providers).toEqual(['uniswap', 'oneinch', 'zerox']);
    });
    it('should add executor at runtime', () => {
        expect(quoter.getAvailableProviders()).toHaveLength(3);
        quoter.addExecutor(createMockExecutor('sushiswap', 990000n));
        expect(quoter.getAvailableProviders()).toHaveLength(4);
        expect(quoter.getAvailableProviders()).toContain('sushiswap');
    });
    it('should remove executor by name', () => {
        quoter.removeExecutor('zerox');
        expect(quoter.getAvailableProviders()).toHaveLength(2);
        expect(quoter.getAvailableProviders()).not.toContain('zerox');
    });
    it('should apply custom config', () => {
        const customQuoter = new SwapQuoter(executors, {
            quoteTimeoutMs: 2000,
            defaultSlippageBps: 100,
            enablePriceImpactCheck: false,
            minOutputThreshold: 500000n,
        });
        const config = customQuoter.config;
        expect(config.quoteTimeoutMs).toBe(2000);
        expect(config.defaultSlippageBps).toBe(100);
        expect(config.enablePriceImpactCheck).toBe(false);
        expect(config.minOutputThreshold).toBe(500000n);
    });
    it('should use default config when not provided', () => {
        const config = quoter.config;
        expect(config.quoteTimeoutMs).toBe(5000);
        expect(config.defaultSlippageBps).toBe(50);
        expect(config.enablePriceImpactCheck).toBe(true);
        expect(config.minOutputThreshold).toBe(0n);
    });
    it('should enrich quotes with minimumReceived', async () => {
        const params = {
            fromToken: '0xUSDC',
            toToken: '0xWETH',
            fromAmount: 1000n * 1000000n,
            chainId: 1,
            slippageBps: 50,
        };
        const best = await quoter.getBestQuote(params);
        // minimumReceived should be toAmount * (10000 - 50) / 10000 = toAmount * 0.995
        const expectedMin = (best.quote.toAmount * (10000n - 50n)) / 10000n;
        expect(best.quote.minimumReceived).toBe(expectedMin);
    });
    it('should tie-break by lower gas when output amounts are equal', async () => {
        const tieExecutors = [
            createMockExecutor('uniswap', 1000000n, 0.5, 200000n),
            createMockExecutor('oneinch', 1000000n, 0.5, 150000n),
        ];
        quoter = new SwapQuoter(tieExecutors);
        const params = {
            fromToken: '0xUSDC',
            toToken: '0xWETH',
            fromAmount: 1000n * 1000000n,
            chainId: 1,
            slippageBps: 50,
        };
        const best = await quoter.getBestQuote(params);
        // oneinch should win due to lower gas
        expect(best.quote.provider).toBe('oneinch');
        expect(best.quote.gasEstimate).toBe(150000n);
    });
});
//# sourceMappingURL=quoter.test.js.map