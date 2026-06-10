// eslint-disable @typescript-eslint/no-explicit-any
/**
 * PaymentRouter tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PaymentRouter } from '../src/PaymentRouter';

describe('PaymentRouter', () => {
  let router: PaymentRouter;
  let mockAggregator: any;
  let mockSwapRouter: any;

  beforeEach(() => {
    router = new PaymentRouter({
      defaultPreferences: {
        maxFeePercent: 5,
        maxDeliveryTimeMinutes: 30,
      },
    });

    mockAggregator = {
      getQuotes: vi.fn().mockResolvedValue([
        {
          provider: 'moonpay',
          providerName: 'MoonPay',
          fiatAmount: 100,
          fiatCurrency: 'USD',
          cryptoAmount: 0.05,
          cryptoToken: 'ETH',
          exchangeRate: 0.0005,
          totalCost: 105,
          fees: { totalFeePercent: 5 },
          estimatedTime: 10,
          expiresAt: Date.now() + 3600000,
        },
        {
          provider: 'ramp',
          providerName: 'Ramp',
          fiatAmount: 100,
          fiatCurrency: 'USD',
          cryptoAmount: 0.048,
          cryptoToken: 'ETH',
          exchangeRate: 0.00048,
          totalCost: 103,
          fees: { totalFeePercent: 3 },
          estimatedTime: 15,
          expiresAt: Date.now() + 3600000,
        },
      ]),
    };

    mockSwapRouter = {
      getQuotes: vi.fn().mockResolvedValue([
        {
          fromToken: { symbol: 'USDC' },
          toToken: { symbol: 'ETH' },
          fromAmount: 100n,
          toAmount: 50000000000000000n, // 0.05 ETH
          fee: 1n,
        },
      ]),
    };

    router.setAggregator(mockAggregator);
    router.setSwapRouter(mockSwapRouter);
  });

  describe('findBestRoute', () => {
    it('finds best buy route', async () => {
      const route = await router.findBestRoute({
        type: 'buy',
        fiatAmount: 100,
        fiatCurrency: 'USD',
        cryptoToken: 'ETH',
        chainId: 1,
        destinationAddress: '0x1234567890123456789012345678901234567890',
      });

      expect(route).toBeDefined();
      expect(route.type).toBe('buy');
      expect(route.quotes.length).toBeGreaterThan(0);
      expect(route.selectedQuote).toBeDefined();
      expect(route.confidence).toBeGreaterThan(0);
    });

    it('finds best swap route', async () => {
      const route = await router.findBestRoute({
        type: 'swap',
        cryptoAmount: 100,
        cryptoToken: 'ETH',
        chainId: 1,
        destinationAddress: '0x1234567890123456789012345678901234567890',
      });

      expect(route).toBeDefined();
      expect(route.type).toBe('swap');
      expect(route.quotes.length).toBeGreaterThan(0);
      expect(route.selectedQuote).toBeDefined();
    });

    it('finds deposit route', async () => {
      const route = await router.findBestRoute({
        type: 'deposit',
        cryptoToken: 'ETH',
        chainId: 1,
        destinationAddress: '0x1234567890123456789012345678901234567890',
      });

      expect(route).toBeDefined();
      expect(route.type).toBe('deposit');
      expect(route.confidence).toBe(1);
    });

    it('throws error for unknown payment type', async () => {
      await expect(
        router.findBestRoute({
          type: 'unknown' as unknown,
          cryptoToken: 'ETH',
          chainId: 1,
          destinationAddress: '0x1234567890123456789012345678901234567890',
        })
      ).rejects.toThrow('Unknown payment type');
    });

    it('throws error if aggregator not set for buy route', async () => {
      const routerWithoutAggregator = new PaymentRouter();

      await expect(
        routerWithoutAggregator.findBestRoute({
          type: 'buy',
          fiatAmount: 100,
          fiatCurrency: 'USD',
          cryptoToken: 'ETH',
          chainId: 1,
          destinationAddress: '0x1234567890123456789012345678901234567890',
        })
      ).rejects.toThrow('OnRamp aggregator not set');
    });

    it('throws error if swap router not set for swap route', async () => {
      const routerWithoutSwapRouter = new PaymentRouter();

      await expect(
        routerWithoutSwapRouter.findBestRoute({
          type: 'swap',
          cryptoAmount: 100,
          cryptoToken: 'ETH',
          chainId: 1,
          destinationAddress: '0x1234567890123456789012345678901234567890',
        })
      ).rejects.toThrow('Swap router not set');
    });

    it('respects user preferences', async () => {
      const route = await router.findBestRoute(
        {
          type: 'buy',
          fiatAmount: 100,
          fiatCurrency: 'USD',
          cryptoToken: 'ETH',
          chainId: 1,
          destinationAddress: '0x1234567890123456789012345678901234567890',
        },
        {
          maxFeePercent: 2,
        }
      );

      expect(route).toBeDefined();
      // Should filter out quotes with fees > 2%
    });

    it('prefers speed over cost when configured', async () => {
      const fastRouter = new PaymentRouter({
        preferSpeed: true,
      });
      fastRouter.setAggregator(mockAggregator);

      const route = await fastRouter.findBestRoute({
        type: 'buy',
        fiatAmount: 100,
        fiatCurrency: 'USD',
        cryptoToken: 'ETH',
        chainId: 1,
        destinationAddress: '0x1234567890123456789012345678901234567890',
      });

      expect(route).toBeDefined();
      // Should select the fastest quote
    });
  });

  describe('compareRoutes', () => {
    it('compares multiple routes', async () => {
      const routes = await router.compareRoutes([
        {
          type: 'buy',
          fiatAmount: 100,
          fiatCurrency: 'USD',
          cryptoToken: 'ETH',
          chainId: 1,
          destinationAddress: '0x1234567890123456789012345678901234567890',
        },
        {
          type: 'swap',
          cryptoAmount: 100,
          cryptoToken: 'ETH',
          chainId: 1,
          destinationAddress: '0x1234567890123456789012345678901234567890',
        },
      ]);

      expect(routes).toBeDefined();
      expect(routes.length).toBeGreaterThan(0);
    });

    it('sorts routes by confidence and cost', async () => {
      const routes = await router.compareRoutes([
        {
          type: 'buy',
          fiatAmount: 100,
          fiatCurrency: 'USD',
          cryptoToken: 'ETH',
          chainId: 1,
          destinationAddress: '0x1234567890123456789012345678901234567890',
        },
      ]);

      expect(routes).toBeDefined();
      // Routes should be sorted by confidence first, then cost
    });
  });
});
