/**
 * Core SDK - Transaction Tests
 *
 * Tests for transaction signing, estimation, and cancellation
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Connector } from '../src/connector.js';
import type { ConnectParams, ConnectionResult, TransactionRequest } from '../src/types.js';

class TransactionTestConnector extends Connector {
  readonly id = 'tx-test';
  readonly name = 'TX Test';
  readonly icon = 'data:image/svg+xml;base64,test';
  readonly installed = true;
  readonly type = 'injected';
  
  private _connected = false;
  private _accounts: string[] = [];
  private _chainId = 1;
  private _pendingTxs: Map<string, TransactionRequest> = new Map();

  async connect(params?: ConnectParams): Promise<ConnectionResult> {
    this._connected = true;
    this._accounts = ['0x742d35Cc6634C0532925a3b844Bc9e7595f0fEb'];
    this._chainId = params?.chains?.[0] ?? 1;
    
    return {
      sessionId: 'tx-session',
      accounts: this._accounts,
      chainId: this._chainId,
      connectorId: this.id,
    };
  }

  async disconnect(): Promise<void> {
    this._connected = false;
    this._accounts = [];
    this._pendingTxs.clear();
  }

  async getAccounts(): Promise<string[]> {
    return this._connected ? this._accounts : [];
  }

  async getChainId(): Promise<number> {
    return this._chainId;
  }

  async switchChain(chainId: number): Promise<void> {
    this._chainId = chainId;
  }

  async signMessage(message: string): Promise<string> {
    return `sig:${message}`;
  }

  async signTransaction(tx: TransactionRequest): Promise<string> {
    if (!this._connected) {
      throw new Error('Not connected');
    }

    const txHash = `0x${Math.random().toString(16).slice(2)}`;
    this._pendingTxs.set(txHash, tx);
    
    this.emit('transactionSigned', { hash: txHash, tx });
    
    return txHash;
  }

  async estimateGas(tx: TransactionRequest): Promise<bigint> {
    if (!this._connected) {
      throw new Error('Not connected');
    }

    // Mock gas estimation
    const baseGas = 21000n;
    const dataGas = tx.data ? BigInt(tx.data.length) * 16n : 0n;
    
    return baseGas + dataGas;
  }

  async cancelTransaction(txHash: string): Promise<boolean> {
    if (!this._connected) {
      throw new Error('Not connected');
    }

    if (this._pendingTxs.has(txHash)) {
      this._pendingTxs.delete(txHash);
      this.emit('transactionCancelled', { hash: txHash });
      return true;
    }
    
    return false;
  }

  getPendingTransactions(): TransactionRequest[] {
    return Array.from(this._pendingTxs.values());
  }
}

describe('Transaction Operations', () => {
  let connector: TransactionTestConnector;

  beforeEach(async () => {
    connector = new TransactionTestConnector();
    await connector.connect();
  });

  describe('signTransaction', () => {
    it('should sign a transaction', async () => {
      const tx: TransactionRequest = {
        from: '0x742d35Cc6634C0532925a3b844Bc9e7595f0fEb',
        to: '0x1234567890123456789012345678901234567890',
        value: '1000000000000000000', // 1 ETH
      };

      const hash = await connector.signTransaction(tx);
      
      expect(hash).toBeDefined();
      expect(hash.startsWith('0x')).toBe(true);
    });

    it('should emit transactionSigned event', async () => {
      const handler = vi.fn();
      connector.on('transactionSigned', handler);

      const tx: TransactionRequest = {
        from: '0x742d35Cc6634C0532925a3b844Bc9e7595f0fEb',
        to: '0x1234567890123456789012345678901234567890',
        value: '1000000000000000000',
      };

      await connector.signTransaction(tx);
      
      expect(handler).toHaveBeenCalledWith({
        hash: expect.any(String),
        tx,
      });
    });

    it('should reject when not connected', async () => {
      await connector.disconnect();

      const tx: TransactionRequest = {
        from: '0x742d35Cc6634C0532925a3b844Bc9e7595f0fEb',
        to: '0x1234567890123456789012345678901234567890',
        value: '1000000000000000000',
      };

      await expect(connector.signTransaction(tx)).rejects.toThrow('Not connected');
    });

    it('should handle transaction with data', async () => {
      const tx: TransactionRequest = {
        from: '0x742d35Cc6634C0532925a3b844Bc9e7595f0fEb',
        to: '0x1234567890123456789012345678901234567890',
        value: '0',
        data: '0xa9059cbb000000000000000000000000',
      };

      const hash = await connector.signTransaction(tx);
      expect(hash).toBeDefined();
    });
  });

  describe('estimateGas', () => {
    it('should estimate gas for simple transfer', async () => {
      const tx: TransactionRequest = {
        from: '0x742d35Cc6634C0532925a3b844Bc9e7595f0fEb',
        to: '0x1234567890123456789012345678901234567890',
        value: '1000000000000000000',
      };

      const gas = await connector.estimateGas(tx);
      
      expect(gas).toBe(21000n);
    });

    it('should estimate gas with data', async () => {
      const tx: TransactionRequest = {
        from: '0x742d35Cc6634C0532925a3b844Bc9e7595f0fEb',
        to: '0x1234567890123456789012345678901234567890',
        value: '0',
        data: '0xa9059cbb',
      };

      const gas = await connector.estimateGas(tx);
      
      expect(gas).toBeGreaterThan(21000n);
    });

    it('should reject when not connected', async () => {
      await connector.disconnect();

      const tx: TransactionRequest = {
        from: '0x742d35Cc6634C0532925a3b844Bc9e7595f0fEb',
        to: '0x1234567890123456789012345678901234567890',
        value: '1000000000000000000',
      };

      await expect(connector.estimateGas(tx)).rejects.toThrow('Not connected');
    });
  });

  describe('cancelTransaction', () => {
    it('should cancel pending transaction', async () => {
      const tx: TransactionRequest = {
        from: '0x742d35Cc6634C0532925a3b844Bc9e7595f0fEb',
        to: '0x1234567890123456789012345678901234567890',
        value: '1000000000000000000',
      };

      const hash = await connector.signTransaction(tx);
      const cancelled = await connector.cancelTransaction(hash);
      
      expect(cancelled).toBe(true);
      expect(connector.getPendingTransactions()).toHaveLength(0);
    });

    it('should return false for non-existent transaction', async () => {
      const cancelled = await connector.cancelTransaction('0xnonexistent');
      expect(cancelled).toBe(false);
    });

    it('should emit transactionCancelled event', async () => {
      const handler = vi.fn();
      connector.on('transactionCancelled', handler);

      const tx: TransactionRequest = {
        from: '0x742d35Cc6634C0532925a3b844Bc9e7595f0fEb',
        to: '0x1234567890123456789012345678901234567890',
        value: '1000000000000000000',
      };

      const hash = await connector.signTransaction(tx);
      await connector.cancelTransaction(hash);
      
      expect(handler).toHaveBeenCalledWith({ hash });
    });

    it('should reject when not connected', async () => {
      await connector.disconnect();
      await expect(connector.cancelTransaction('0xhash')).rejects.toThrow('Not connected');
    });
  });

  describe('pending transactions', () => {
    it('should track pending transactions', async () => {
      const tx1: TransactionRequest = {
        from: '0x742d35Cc6634C0532925a3b844Bc9e7595f0fEb',
        to: '0x1234567890123456789012345678901234567890',
        value: '1000000000000000000',
      };

      const tx2: TransactionRequest = {
        from: '0x742d35Cc6634C0532925a3b844Bc9e7595f0fEb',
        to: '0x0987654321098765432109876543210987654321',
        value: '2000000000000000000',
      };

      await connector.signTransaction(tx1);
      await connector.signTransaction(tx2);
      
      expect(connector.getPendingTransactions()).toHaveLength(2);
    });

    it('should clear pending transactions on disconnect', async () => {
      const tx: TransactionRequest = {
        from: '0x742d35Cc6634C0532925a3b844Bc9e7595f0fEb',
        to: '0x1234567890123456789012345678901234567890',
        value: '1000000000000000000',
      };

      await connector.signTransaction(tx);
      await connector.disconnect();
      
      expect(connector.getPendingTransactions()).toHaveLength(0);
    });
  });
});
