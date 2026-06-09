/**
 * Tests for SwapRouter — smart routing algorithm.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { SwapRouter } from '../src/router.js';
import { SwapQuoter } from '../src/quoter.js';
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
describe('SwapRouter', () => {
    let router;
    let quoter;
    const params = {
        fromToken: '0xUSDC',
        toToken: '0xWETH',
        fromAmount: 1000n * 1000000n,
        chainId: 1,
        slippageBps: 50,
    };
    beforeEach(() => {
        const executors = [
            createMockExecutor('uniswap', 1000000n),
            createMockExecutor('oneinch', 1020000n),
        ];
        quoter = new SwapQuoter(executors);
        router = new SwapRouter(quoter);
    });
    it('should get best quote via router', async () => {
        const best = await router.getBestQuote(params);
        expect(best.quote.provider).toBe('oneinch');
    });
    it('should compare all quotes', async () => {
        const quotes = await router.compareQuotes(params);
        expect(quotes).toHaveLength(2);
    });
    it('should be disabled for execution by default', async () => {
        await expect(router.executeSwap(params)).rejects.toThrow('Swap execution is disabled');
    });
    it('should enable execution', () => {
        router.setExecutionEnabled(true);
        // No error thrown
    });
    it('should execute swap when enabled', async () => {
        router.setExecutionEnabled(true);
        const receipt = await router.executeSwap(params);
        expect(receipt.success).toBe(true);
        expect(receipt.fromAmount).toBe(1000n * 1000000n);
        expect(receipt.toAmount).toBe(1020000n);
        expect(receipt.quoteId).toBeDefined();
        expect(receipt.txHash).toMatch(/^0x/);
    });
    it('should reject expired quotes', async () => {
        router.setExecutionEnabled(true);
        // Create a quoter with an executor that returns expired quotes
        const expiredExecutor = {
            name: 'expired',
            isAvailable: async () => true,
            getQuote: async (p) => ({
                id: 'expired-quote',
                fromToken: p.fromToken,
                toToken: p.toToken,
                fromAmount: p.fromAmount,
                toAmount: 1000000n,
                priceImpact: 0.5,
                route: [],
                gasEstimate: 150000n,
                minimumReceived: 0n,
                provider: 'expired',
                expiresAt: Date.now() - 1000, // Expired
                tx: undefined,
            }),
            getTransaction: async () => ({
                to: '0x',
                value: 0n,
                data: '0x',
                gasLimit: 0n,
            }),
            getSupportedTokens: async () => [],
        };
        const expiredQuoter = new SwapQuoter([expiredExecutor]);
        const expiredRouter = new SwapRouter(expiredQuoter);
        expiredRouter.setExecutionEnabled(true);
        await expect(expiredRouter.executeSwap(params)).rejects.toThrow('Quote has expired');
    });
    it('should disable execution after enabling', async () => {
        router.setExecutionEnabled(true);
        router.setExecutionEnabled(false);
        await expect(router.executeSwap(params)).rejects.toThrow('Swap execution is disabled');
    });
    it('should return supported tokens (deduplicated)', async () => {
        // With the mock executors that return empty token lists
        const tokens = await router.getSupportedTokens(1);
        expect(tokens).toEqual([]);
    });
    it('should get price impact from best quote', async () => {
        const impact = await router.getPriceImpact(params);
        expect(typeof impact).toBe('number');
    });
    it('should accept partial execute params', async () => {
        router.setExecutionEnabled(true);
        const receipt = await router.executeSwap(params, {
            slippageBps: 100,
            maxGasPrice: 100000000000n,
        });
        expect(receipt.success).toBe(true);
    });
});
//# sourceMappingURL=router.test.js.map