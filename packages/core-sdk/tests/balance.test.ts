/**
 * Core SDK - Balance Query Tests
 *
 * Tests for native, ERC-20, and SPL token balance queries
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock balance provider
class BalanceProvider {
  private _connected = false;
  private _chainId = 1;
  private _account = '0x742d35Cc6634C0532925a3b844Bc9e7595f0fEb';
  
  // Mock balances
  private _nativeBalances: Record<number, bigint> = {
    1: 1000000000000000000n,      // 1 ETH
    137: 5000000000000000000n,    // 5 MATIC
    42161: 500000000000000000n,   // 0.5 ETH
    56: 2000000000000000000n,     // 2 BNB
  };

  private _erc20Balances: Record<string, Record<string, bigint>> = {
    '1': {
      '0xdAC17F958D2ee523a2206206994597C13D831ec7': 1000000000n,   // 1000 USDT
      '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48': 500000000n,    // 500 USDC
      '0x6B175474E89094C44Da98b954EedeAC495271d0F': 2000000000000000000000n, // 2000 DAI
    },
    '137': {
      '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174': 250000000n,    // 250 USDC
    },
  };

  private _splBalances: Record<string, Record<string, number>> = {
    'solana-mainnet': {
      'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v': 1000000000,  // 1000 USDC (6 decimals)
      'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB': 500000000,   // 500 USDT
    },
  };

  connect(): void {
    this._connected = true;
  }

  disconnect(): void {
    this._connected = false;
  }

  async getNativeBalance(address: string, chainId?: number): Promise<bigint> {
    if (!this._connected) throw new Error('Not connected');
    if (address !== this._account) throw new Error('Address mismatch');
    
    const chain = chainId ?? this._chainId;
    return this._nativeBalances[chain] ?? 0n;
  }

  async getERC20Balance(
    address: string,
    tokenAddress: string,
    chainId?: number
  ): Promise<bigint> {
    if (!this._connected) throw new Error('Not connected');
    
    const chain = String(chainId ?? this._chainId);
    const chainBalances = this._erc20Balances[chain];
    if (!chainBalances) return 0n;
    
    return chainBalances[tokenAddress] ?? 0n;
  }

  async getERC20Balances(
    address: string,
    tokenAddresses: string[],
    chainId?: number
  ): Promise<Map<string, bigint>> {
    if (!this._connected) throw new Error('Not connected');
    
    const results = new Map<string, bigint>();
    for (const token of tokenAddresses) {
      const balance = await this.getERC20Balance(address, token, chainId);
      results.set(token, balance);
    }
    return results;
  }

  async getSPLBalance(
    address: string,
    mintAddress: string,
    _cluster?: string
  ): Promise<number> {
    if (!this._connected) throw new Error('Not connected');
    
    const solanaBalances = this._splBalances['solana-mainnet'];
    if (!solanaBalances) return 0;
    
    return solanaBalances[mintAddress] ?? 0;
  }

  formatBalance(balance: bigint, decimals: number): string {
    const divisor = 10n ** BigInt(decimals);
    const whole = balance / divisor;
    const fraction = balance % divisor;
    const fractionStr = fraction.toString().padStart(decimals, '0').slice(0, 4);
    return `${whole}.${fractionStr}`;
  }
}

describe('Balance Queries', () => {
  let provider: BalanceProvider;

  beforeEach(() => {
    provider = new BalanceProvider();
    provider.connect();
  });

  describe('Native Balance', () => {
    it('should get ETH balance on mainnet', async () => {
      const balance = await provider.getNativeBalance(
        '0x742d35Cc6634C0532925a3b844Bc9e7595f0fEb',
        1
      );
      expect(balance).toBe(1000000000000000000n);
    });

    it('should get MATIC balance on Polygon', async () => {
      const balance = await provider.getNativeBalance(
        '0x742d35Cc6634C0532925a3b844Bc9e7595f0fEb',
        137
      );
      expect(balance).toBe(5000000000000000000n);
    });

    it('should return 0 for unknown chain', async () => {
      const balance = await provider.getNativeBalance(
        '0x742d35Cc6634C0532925a3b844Bc9e7595f0fEb',
        999999
      );
      expect(balance).toBe(0n);
    });

    it('should throw when not connected', async () => {
      provider.disconnect();
      await expect(
        provider.getNativeBalance('0x742d35Cc6634C0532925a3b844Bc9e7595f0fEb')
      ).rejects.toThrow('Not connected');
    });

    it('should throw for wrong address', async () => {
      await expect(
        provider.getNativeBalance('0xwrongaddress')
      ).rejects.toThrow('Address mismatch');
    });
  });

  describe('ERC-20 Balance', () => {
    const USDT = '0xdAC17F958D2ee523a2206206994597C13D831ec7';
    const USDC = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48';
    const DAI = '0x6B175474E89094C44Da98b954EedeAC495271d0F';

    it('should get USDT balance', async () => {
      const balance = await provider.getERC20Balance(
        '0x742d35Cc6634C0532925a3b844Bc9e7595f0fEb',
        USDT,
        1
      );
      expect(balance).toBe(1000000000n); // 1000 USDT (6 decimals)
    });

    it('should get USDC balance', async () => {
      const balance = await provider.getERC20Balance(
        '0x742d35Cc6634C0532925a3b844Bc9e7595f0fEb',
        USDC,
        1
      );
      expect(balance).toBe(500000000n);
    });

    it('should get DAI balance', async () => {
      const balance = await provider.getERC20Balance(
        '0x742d35Cc6634C0532925a3b844Bc9e7595f0fEb',
        DAI,
        1
      );
      expect(balance).toBe(2000000000000000000000n);
    });

    it('should return 0 for unknown token', async () => {
      const balance = await provider.getERC20Balance(
        '0x742d35Cc6634C0532925a3b844Bc9e7595f0fEb',
        '0x0000000000000000000000000000000000000000',
        1
      );
      expect(balance).toBe(0n);
    });

    it('should batch query ERC-20 balances', async () => {
      const balances = await provider.getERC20Balances(
        '0x742d35Cc6634C0532925a3b844Bc9e7595f0fEb',
        [USDT, USDC, DAI],
        1
      );
      
      expect(balances.size).toBe(3);
      expect(balances.get(USDT)).toBe(1000000000n);
      expect(balances.get(USDC)).toBe(500000000n);
      expect(balances.get(DAI)).toBe(2000000000000000000000n);
    });

    it('should get Polygon USDC balance', async () => {
      const balance = await provider.getERC20Balance(
        '0x742d35Cc6634C0532925a3b844Bc9e7595f0fEb',
        '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174',
        137
      );
      expect(balance).toBe(250000000n);
    });
  });

  describe('SPL Balance (Solana)', () => {
    it('should get SPL USDC balance', async () => {
      const balance = await provider.getSPLBalance(
        'SolanaAddress',
        'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'
      );
      expect(balance).toBe(1000000000);
    });

    it('should get SPL USDT balance', async () => {
      const balance = await provider.getSPLBalance(
        'SolanaAddress',
        'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB'
      );
      expect(balance).toBe(500000000);
    });

    it('should return 0 for unknown SPL token', async () => {
      const balance = await provider.getSPLBalance(
        'SolanaAddress',
        'UnknownMintAddress'
      );
      expect(balance).toBe(0);
    });
  });

  describe('Balance Formatting', () => {
    it('should format ETH balance (18 decimals)', () => {
      const formatted = provider.formatBalance(1000000000000000000n, 18);
      expect(formatted).toBe('1.0000');
    });

    it('should format USDC balance (6 decimals)', () => {
      const formatted = provider.formatBalance(1000000000n, 6);
      expect(formatted).toBe('1000.0000');
    });

    it('should format fractional balance', () => {
      const formatted = provider.formatBalance(1500000000000000000n, 18);
      expect(formatted).toBe('1.5000');
    });

    it('should format zero balance', () => {
      const formatted = provider.formatBalance(0n, 18);
      expect(formatted).toBe('0.0000');
    });
  });
});
