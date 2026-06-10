/**
 * Core SDK - Error Handling Tests
 *
 * Tests for error scenarios, recovery, and error types
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Connector } from '../src/connector.js';
import type { ConnectParams, ConnectionResult, TransactionRequest } from '../src/types.js';

// Custom error types
class CinacoinError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'CinacoinError';
  }
}

class ConnectionError extends CinacoinError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 'CONNECTION_ERROR', details);
    this.name = 'ConnectionError';
  }
}

class TransactionError extends CinacoinError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 'TRANSACTION_ERROR', details);
    this.name = 'TransactionError';
  }
}

class ChainError extends CinacoinError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 'CHAIN_ERROR', details);
    this.name = 'ChainError';
  }
}

class SignatureError extends CinacoinError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 'SIGNATURE_ERROR', details);
    this.name = 'SignatureError';
  }
}

class TimeoutError extends CinacoinError {
  constructor(operation: string, timeoutMs: number) {
    super(`${operation} timed out after ${timeoutMs}ms`, 'TIMEOUT_ERROR', { operation, timeoutMs });
    this.name = 'TimeoutError';
  }
}

class RateLimitError extends CinacoinError {
  constructor(retryAfterMs: number) {
    super(`Rate limited. Retry after ${retryAfterMs}ms`, 'RATE_LIMIT_ERROR', { retryAfterMs });
    this.name = 'RateLimitError';
  }
}

class ErrorTestConnector extends Connector {
  readonly id = 'error-test';
  readonly name = 'Error Test';
  readonly icon = 'data:image/svg+xml;base64,test';
  readonly installed = true;
  readonly type = 'injected';
  
  private _connected = false;
  private _accounts: string[] = [];
  private _chainId = 1;
  private _failMode: string | null = null;
  private _requestCount = 0;

  async connect(params?: ConnectParams): Promise<ConnectionResult> {
    this._requestCount++;
    
    if (this._failMode === 'connect') {
      throw new ConnectionError('Connection rejected by user');
    }
    
    if (this._failMode === 'timeout') {
      throw new TimeoutError('connect', 30000);
    }
    
    if (this._connected) {
      throw new ConnectionError('Already connected');
    }
    
    this._connected = true;
    this._accounts = ['0x742d35Cc6634C0532925a3b844Bc9e7595f0fEb'];
    this._chainId = params?.chains?.[0] ?? 1;
    
    return {
      sessionId: 'error-session',
      accounts: this._accounts,
      chainId: this._chainId,
      connectorId: this.id,
    };
  }

  async disconnect(): Promise<void> {
    if (this._failMode === 'disconnect') {
      throw new ConnectionError('Disconnect failed');
    }
    
    this._connected = false;
    this._accounts = [];
  }

  async getAccounts(): Promise<string[]> {
    if (this._failMode === 'accounts') {
      throw new ConnectionError('Failed to fetch accounts');
    }
    return this._connected ? this._accounts : [];
  }

  async getChainId(): Promise<number> {
    return this._chainId;
  }

  async switchChain(chainId: number): Promise<void> {
    if (!this._connected) {
      throw new ChainError('Not connected');
    }
    
    if (this._failMode === 'switchChain') {
      throw new ChainError('Chain switch rejected', { chainId });
    }
    
    if (chainId === 999999) {
      throw new ChainError('Unrecognized chain ID', { chainId });
    }
    
    this._chainId = chainId;
    this.emit('chainChanged', chainId);
  }

  async signMessage(message: string): Promise<string> {
    if (!this._connected) {
      throw new SignatureError('Not connected');
    }
    
    if (this._failMode === 'sign') {
      throw new SignatureError('User rejected signature');
    }
    
    if (message.length > 10000) {
      throw new SignatureError('Message too long', { length: message.length });
    }
    
    return `sig:${message}`;
  }

  async signTransaction(tx: TransactionRequest): Promise<string> {
    if (!this._connected) {
      throw new TransactionError('Not connected');
    }
    
    if (this._failMode === 'transaction') {
      throw new TransactionError('User rejected transaction');
    }
    
    if (!tx.to) {
      throw new TransactionError('Missing recipient address');
    }
    
    if (tx.value && BigInt(tx.value) < 0n) {
      throw new TransactionError('Invalid value', { value: tx.value });
    }
    
    return '0xsignedtx';
  }

  // Test helpers
  setFailMode(mode: string | null): void {
    this._failMode = mode;
  }

  getRequestCount(): number {
    return this._requestCount;
  }

  resetRequestCount(): void {
    this._requestCount = 0;
  }
}

describe('Error Handling', () => {
  let connector: ErrorTestConnector;

  beforeEach(() => {
    connector = new ErrorTestConnector();
    connector.setFailMode(null);
    connector.resetRequestCount();
  });

  describe('Connection Errors', () => {
    it('should throw ConnectionError on rejected connection', async () => {
      connector.setFailMode('connect');
      
      try {
        await connector.connect();
        expect.fail('Should have thrown');
      } catch (err) {
        expect(err).toBeInstanceOf(ConnectionError);
        expect((err as ConnectionError).code).toBe('CONNECTION_ERROR');
        expect((err as ConnectionError).message).toContain('rejected');
      }
    });

    it('should throw TimeoutError on connection timeout', async () => {
      connector.setFailMode('timeout');
      
      try {
        await connector.connect();
        expect.fail('Should have thrown');
      } catch (err) {
        expect(err).toBeInstanceOf(TimeoutError);
        expect((err as TimeoutError).code).toBe('TIMEOUT_ERROR');
        expect((err as TimeoutError).details?.operation).toBe('connect');
      }
    });

    it('should throw on double connection', async () => {
      await connector.connect();
      
      try {
        await connector.connect();
        expect.fail('Should have thrown');
      } catch (err) {
        expect(err).toBeInstanceOf(ConnectionError);
        expect((err as ConnectionError).message).toContain('Already connected');
      }
    });

    it('should throw on disconnect failure', async () => {
      await connector.connect();
      connector.setFailMode('disconnect');
      
      await expect(connector.disconnect()).rejects.toThrow(ConnectionError);
    });
  });

  describe('Transaction Errors', () => {
    beforeEach(async () => {
      await connector.connect();
    });

    it('should throw TransactionError on rejected transaction', async () => {
      connector.setFailMode('transaction');
      
      try {
        await connector.signTransaction({
          from: '0x742d35Cc6634C0532925a3b844Bc9e7595f0fEb',
          to: '0x1234567890123456789012345678901234567890',
          value: '1000000000000000000',
        });
        expect.fail('Should have thrown');
      } catch (err) {
        expect(err).toBeInstanceOf(TransactionError);
        expect((err as TransactionError).code).toBe('TRANSACTION_ERROR');
      }
    });

    it('should throw on missing recipient', async () => {
      try {
        await connector.signTransaction({
          from: '0x742d35Cc6634C0532925a3b844Bc9e7595f0fEb',
          to: '',
          value: '1000000000000000000',
        });
        expect.fail('Should have thrown');
      } catch (err) {
        expect(err).toBeInstanceOf(TransactionError);
        expect((err as TransactionError).message).toContain('recipient');
      }
    });

    it('should throw when signing tx while disconnected', async () => {
      await connector.disconnect();
      
      await expect(
        connector.signTransaction({
          from: '0x742d35Cc6634C0532925a3b844Bc9e7595f0fEb',
          to: '0x1234567890123456789012345678901234567890',
          value: '1000000000000000000',
        })
      ).rejects.toThrow(TransactionError);
    });
  });

  describe('Signature Errors', () => {
    beforeEach(async () => {
      await connector.connect();
    });

    it('should throw SignatureError on rejected signature', async () => {
      connector.setFailMode('sign');
      
      try {
        await connector.signMessage('test');
        expect.fail('Should have thrown');
      } catch (err) {
        expect(err).toBeInstanceOf(SignatureError);
        expect((err as SignatureError).code).toBe('SIGNATURE_ERROR');
      }
    });

    it('should throw on message too long', async () => {
      const longMessage = 'x'.repeat(20000);
      
      try {
        await connector.signMessage(longMessage);
        expect.fail('Should have thrown');
      } catch (err) {
        expect(err).toBeInstanceOf(SignatureError);
        expect((err as SignatureError).details?.length).toBe(20000);
      }
    });
  });

  describe('Chain Errors', () => {
    beforeEach(async () => {
      await connector.connect();
    });

    it('should throw ChainError on unsupported chain', async () => {
      try {
        await connector.switchChain(999999);
        expect.fail('Should have thrown');
      } catch (err) {
        expect(err).toBeInstanceOf(ChainError);
        expect((err as ChainError).details?.chainId).toBe(999999);
      }
    });

    it('should throw ChainError on rejected switch', async () => {
      connector.setFailMode('switchChain');
      
      await expect(connector.switchChain(137)).rejects.toThrow(ChainError);
    });

    it('should throw when switching while disconnected', async () => {
      await connector.disconnect();
      await expect(connector.switchChain(137)).rejects.toThrow(ChainError);
    });
  });

  describe('Rate Limiting', () => {
    it('should create RateLimitError with retry info', () => {
      const err = new RateLimitError(5000);
      expect(err.code).toBe('RATE_LIMIT_ERROR');
      expect(err.details?.retryAfterMs).toBe(5000);
    });
  });

  describe('Error Recovery', () => {
    it('should recover after clearing fail mode', async () => {
      connector.setFailMode('connect');
      await expect(connector.connect()).rejects.toThrow();
      
      connector.setFailMode(null);
      const result = await connector.connect();
      expect(result.sessionId).toBeDefined();
    });

    it('should allow reconnection after failed disconnect', async () => {
      await connector.connect();
      
      connector.setFailMode('disconnect');
      await expect(connector.disconnect()).rejects.toThrow();
      
      // Force reset
      connector.setFailMode(null);
      await connector.disconnect();
      
      const result = await connector.connect();
      expect(result.sessionId).toBeDefined();
    });

    it('should maintain state after failed operation', async () => {
      await connector.connect();
      
      connector.setFailMode('sign');
      await expect(connector.signMessage('test')).rejects.toThrow();
      
      // Should still be connected
      const accounts = await connector.getAccounts();
      expect(accounts).toHaveLength(1);
    });
  });

  describe('Error Serialization', () => {
    it('should serialize CinacoinError to JSON', () => {
      const err = new CinacoinError('test error', 'TEST_CODE', { key: 'value' });
      const json = JSON.stringify({
        name: err.name,
        message: err.message,
        code: err.code,
        details: err.details,
      });
      
      const parsed = JSON.parse(json);
      expect(parsed.code).toBe('TEST_CODE');
      expect(parsed.details.key).toBe('value');
    });
  });
});
