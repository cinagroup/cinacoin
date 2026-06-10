/**
 * Core SDK - Wallet Connection Tests
 *
 * Tests for wallet connection, disconnection, reconnection flows
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Connector } from '../src/connector.js';
import type { ConnectParams, ConnectionResult, TransactionRequest } from '../src/types.js';

class MockWalletConnector extends Connector {
  readonly id = 'mock-wallet';
  readonly name = 'Mock Wallet';
  readonly icon = 'data:image/svg+xml;base64,mock';
  readonly installed = true;
  readonly type = 'injected';
  
  private _connected = false;
  private _accounts: string[] = [];
  private _chainId = 1;
  private _reconnectAttempts = 0;

  async connect(params?: ConnectParams): Promise<ConnectionResult> {
    if (this._connected) {
      throw new Error('Wallet already connected');
    }
    
    this._connected = true;
    this._accounts = ['0x742d35Cc6634C0532925a3b844Bc9e7595f0fEb'];
    this._chainId = params?.chains?.[0] ?? 1;
    
    this.emit('connect', { 
      accounts: this._accounts, 
      chainId: this._chainId 
    });
    
    return {
      sessionId: `session-${Date.now()}`,
      accounts: this._accounts,
      chainId: this._chainId,
      connectorId: this.id,
    };
  }

  async disconnect(): Promise<void> {
    if (!this._connected) {
      throw new Error('Wallet not connected');
    }
    
    this._connected = false;
    this._accounts = [];
    this.emit('disconnect');
  }

  async reconnect(): Promise<ConnectionResult | null> {
    this._reconnectAttempts++;
    
    if (this._reconnectAttempts > 3) {
      throw new Error('Max reconnection attempts exceeded');
    }
    
    if (!this._connected) {
      return this.connect();
    }
    
    return {
      sessionId: `session-${Date.now()}`,
      accounts: this._accounts,
      chainId: this._chainId,
      connectorId: this.id,
    };
  }

  async getAccounts(): Promise<string[]> {
    return this._connected ? [...this._accounts] : [];
  }

  async getChainId(): Promise<number> {
    return this._chainId;
  }

  async switchChain(chainId: number): Promise<void> {
    if (!this._connected) {
      throw new Error('Must be connected to switch chain');
    }
    
    const oldChainId = this._chainId;
    this._chainId = chainId;
    this.emit('chainChanged', { from: oldChainId, to: chainId });
  }

  async signMessage(message: string): Promise<string> {
    if (!this._connected) {
      throw new Error('Must be connected to sign');
    }
    return `0xmocksig_${message}`;
  }

  async signTransaction(tx: TransactionRequest): Promise<string> {
    if (!this._connected) {
      throw new Error('Must be connected to sign');
    }
    return '0xmocksignedtx';
  }

  get isConnected(): boolean {
    return this._connected;
  }

  resetReconnectAttempts(): void {
    this._reconnectAttempts = 0;
  }
}

describe('Wallet Connection', () => {
  let wallet: MockWalletConnector;

  beforeEach(() => {
    wallet = new MockWalletConnector();
    wallet.resetReconnectAttempts();
  });

  describe('connect', () => {
    it('should connect successfully', async () => {
      const result = await wallet.connect();
      
      expect(result.sessionId).toBeDefined();
      expect(result.accounts).toHaveLength(1);
      expect(result.chainId).toBe(1);
      expect(result.connectorId).toBe('mock-wallet');
      expect(wallet.isConnected).toBe(true);
    });

    it('should connect with custom chain', async () => {
      const result = await wallet.connect({ chains: [137] });
      expect(result.chainId).toBe(137);
    });

    it('should prevent double connection', async () => {
      await wallet.connect();
      await expect(wallet.connect()).rejects.toThrow('Wallet already connected');
    });

    it('should emit connect event', async () => {
      const handler = vi.fn();
      wallet.on('connect', handler);
      
      await wallet.connect();
      
      expect(handler).toHaveBeenCalledWith({
        accounts: ['0x742d35Cc6634C0532925a3b844Bc9e7595f0fEb'],
        chainId: 1,
      });
    });
  });

  describe('disconnect', () => {
    it('should disconnect successfully', async () => {
      await wallet.connect();
      await wallet.disconnect();
      
      expect(wallet.isConnected).toBe(false);
      expect(await wallet.getAccounts()).toHaveLength(0);
    });

    it('should prevent disconnect when not connected', async () => {
      await expect(wallet.disconnect()).rejects.toThrow('Wallet not connected');
    });

    it('should emit disconnect event', async () => {
      const handler = vi.fn();
      wallet.on('disconnect', handler);
      
      await wallet.connect();
      await wallet.disconnect();
      
      expect(handler).toHaveBeenCalled();
    });
  });

  describe('reconnect', () => {
    it('should reconnect when disconnected', async () => {
      await wallet.connect();
      await wallet.disconnect();
      
      const result = await wallet.reconnect();
      
      expect(result).toBeDefined();
      expect(result?.accounts).toHaveLength(1);
      expect(wallet.isConnected).toBe(true);
    });

    it('should return current session when already connected', async () => {
      await wallet.connect();
      
      const result = await wallet.reconnect();
      
      expect(result).toBeDefined();
      expect(result?.accounts).toHaveLength(1);
    });

    it('should fail after max reconnection attempts', async () => {
      wallet.resetReconnectAttempts();
      
      // Simulate 3 failed attempts
      for (let i = 0; i < 3; i++) {
        try {
          await wallet.reconnect();
        } catch (e) {
          // Expected
        }
      }
      
      await expect(wallet.reconnect()).rejects.toThrow('Max reconnection attempts exceeded');
    });
  });

  describe('state queries', () => {
    it('should return accounts when connected', async () => {
      await wallet.connect();
      const accounts = await wallet.getAccounts();
      
      expect(accounts).toEqual(['0x742d35Cc6634C0532925a3b844Bc9e7595f0fEb']);
    });

    it('should return empty accounts when disconnected', async () => {
      const accounts = await wallet.getAccounts();
      expect(accounts).toHaveLength(0);
    });

    it('should return current chain ID', async () => {
      await wallet.connect({ chains: [42161] });
      const chainId = await wallet.getChainId();
      
      expect(chainId).toBe(42161);
    });
  });
});
