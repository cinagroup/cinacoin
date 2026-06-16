/**
 * Price oracle implementations for real-time asset USD valuation.
 */

import { logger } from '@cinacoin/logger';
import type { AssetSymbol, PriceOracle } from './types.js';

// ---------------------------------------------------------------------------
// Chainlink Price Oracle
// ---------------------------------------------------------------------------

/**
 * Chainlink price oracle adapter.
 * Reads from Chainlink price feeds on-chain or via API.
 */
export class ChainlinkPriceOracle implements PriceOracle {
  private readonly rpcUrl: string;
  private readonly feedAddresses: Record<string, string>;
  private readonly cache = new Map<string, { price: number; timestamp: number }>();
  private readonly cacheTtlMs: number;

  constructor(options?: {
    rpcUrl?: string;
    feedAddresses?: Record<string, string>;
    cacheTtlMs?: number;
  }) {
    this.rpcUrl = options?.rpcUrl ?? '';
    this.feedAddresses = options?.feedAddresses ?? {
      // Default Chainlink feed addresses on Ethereum mainnet
      'ETH': '0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419',
      'BTC': '0xF4030086522a5bEEa4988F8cA5B36dbC97BeE88c',
      'USDT': '0x3E7d1eAB13ad0104d2750B8863b489D65364e32D',
      'USDC': '0x8fFfFfd4AfB6115b954Bd326cbe7B4BA576818f6',
      'SOL': '0x4ffC43369e76E2A94527457D322b82737b0b1c12',
      'BNB': '0x14e613AC84a31f709eadbdF89C6CC390255A920f',
    };
    this.cacheTtlMs = options?.cacheTtlMs ?? 60_000; // 1 minute cache
  }

  async getPriceUsd(asset: AssetSymbol): Promise<number> {
    // Check cache first
    const cached = this.cache.get(asset);
    if (cached && Date.now() - cached.timestamp < this.cacheTtlMs) {
      return cached.price;
    }

    const feedAddress = this.feedAddresses[asset];
    if (!feedAddress) {
      // Stablecoins pegged to USD
      if (['USDT', 'USDC', 'DAI', 'BUSD'].includes(asset)) {
        this.cache.set(asset, { price: 1.0, timestamp: Date.now() });
        return 1.0;
      }
      throw new Error(`No Chainlink feed configured for asset: ${asset}`);
    }

    try {
      // Call latestRoundData() on Chainlink price feed
      const data = await this.rpcCall(feedAddress, '0xfeaf968c'); // latestRoundData()
      // Parse the answer (int256 at offset 2, 8 decimals for most feeds)
      const answer = BigInt('0x' + data.slice(2 + 64 * 2, 2 + 64 * 3));
      const price = Number(answer) / 1e8; // 8 decimal places

      this.cache.set(asset, { price, timestamp: Date.now() });
      return price;
    } catch (error) {
      logger.error(`Failed to fetch Chainlink price for ${asset}:`, error);
      // Fallback to cached value if available
      if (cached) return cached.price;
      throw error;
    }
  }

  getSourceName(): string {
    return 'chainlink';
  }

  private async rpcCall(to: string, data: string): Promise<string> {
    const response = await fetch(this.rpcUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'eth_call',
        params: [{ to, data }, 'latest'],
      }),
    });
    const json = await response.json() as { result?: string; error?: { message: string } };
    if (json.error) throw new Error(json.error.message);
    return json.result ?? '0x';
  }
}

// ---------------------------------------------------------------------------
// Pyth Price Oracle
// ---------------------------------------------------------------------------

/**
 * Pyth Network price oracle adapter.
 * Uses Pyth's REST API for off-chain price feeds.
 */
export class PythPriceOracle implements PriceOracle {
  private readonly apiEndpoint: string;
  private readonly feedIds: Record<string, string>;
  private readonly cache = new Map<string, { price: number; timestamp: number }>();
  private readonly cacheTtlMs: number;

  constructor(options?: {
    apiEndpoint?: string;
    feedIds?: Record<string, string>;
    cacheTtlMs?: number;
  }) {
    this.apiEndpoint = options?.apiEndpoint ?? 'https://hermes.pyth.network/v2/updates/price/latest';
    this.feedIds = options?.feedIds ?? {
      // Default Pyth feed IDs
      'ETH': '0xff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace',
      'BTC': '0xe62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43',
      'SOL': '0xef0d8b6fda2ceba41da15d4095d1da392a0d2f8ed0c6c7bc0f4cfac8c280b56d',
    };
    this.cacheTtlMs = options?.cacheTtlMs ?? 30_000; // 30 second cache
  }

  async getPriceUsd(asset: AssetSymbol): Promise<number> {
    const cached = this.cache.get(asset);
    if (cached && Date.now() - cached.timestamp < this.cacheTtlMs) {
      return cached.price;
    }

    const feedId = this.feedIds[asset];
    if (!feedId) {
      if (['USDT', 'USDC', 'DAI', 'BUSD'].includes(asset)) {
        this.cache.set(asset, { price: 1.0, timestamp: Date.now() });
        return 1.0;
      }
      throw new Error(`No Pyth feed configured for asset: ${asset}`);
    }

    try {
      const response = await fetch(`${this.apiEndpoint}?ids[]=${feedId}`);
      const data = await response.json() as {
        parsed?: Array<{
          price: { price: string; expo: number };
        }>;
      };

      if (!data.parsed?.[0]) throw new Error('Invalid Pyth response');

      const { price: priceStr, expo } = data.parsed[0].price;
      const price = Number(priceStr) * Math.pow(10, expo);

      this.cache.set(asset, { price, timestamp: Date.now() });
      return price;
    } catch (error) {
      logger.error(`Failed to fetch Pyth price for ${asset}:`, error);
      if (cached) return cached.price;
      throw error;
    }
  }

  getSourceName(): string {
    return 'pyth';
  }
}

// ---------------------------------------------------------------------------
// Fallback Price Oracle
// ---------------------------------------------------------------------------

/**
 * Fallback price oracle that uses static prices when no oracle is available.
 * Logs a warning that production should use a real oracle.
 */
export class FallbackPriceOracle implements PriceOracle {
  private readonly staticPrices: Record<string, number>;

  constructor() {
    this.staticPrices = {
      'ETH': 2000,
      'BTC': 40000,
      'SOL': 100,
      'BNB': 300,
      'XRP': 0.5,
      'USDT': 1,
      'USDC': 1,
      'DAI': 1,
      'BUSD': 1,
    };
  }

  async getPriceUsd(asset: AssetSymbol): Promise<number> {
    logger.warn(
      `Using fallback static price for ${asset}. ` +
      'CMP-02: Configure ChainlinkPriceOracle or PythPriceOracle for production.'
    );
    return this.staticPrices[asset] ?? 0;
  }

  getSourceName(): string {
    return 'fallback-static';
  }
}
