/**
 * Benchmark tests for Connector class.
 *
 * Measures connection, signing, and chain-switching performance
 * using native performance API when available.
 */

import { describe, it, expect } from 'vitest';
import { Connector } from '../src/connector.js';
import type { ConnectParams, ConnectionResult, TransactionRequest } from '../src/types.js';

class BenchConnector extends Connector {
  readonly id = 'bench-connector';
  readonly name = 'Bench Wallet';
  readonly icon = '';
  readonly installed = true;
  readonly type = 'injected';
  private _connected = false;
  private _chainId = 1;

  async connect(_params?: ConnectParams): Promise<ConnectionResult> {
    this._connected = true;
    return { sessionId: 'bench-session', accounts: ['0x' + 'ab'.repeat(20)], chainId: 1, connectorId: this.id };
  }
  async disconnect(): Promise<void> { this._connected = false; }
  async getAccounts(): Promise<string[]> { return this._connected ? ['0x' + 'ab'.repeat(20)] : []; }
  async getChainId(): Promise<number> { return this._chainId; }
  async switchChain(chainId: number): Promise<void> { this._chainId = chainId; }
  async signMessage(_message: string): Promise<string> { return '0x' + 'cd'.repeat(32); }
  async signTransaction(_tx: TransactionRequest): Promise<string> { return '0x' + 'ef'.repeat(32); }
  getProvider(): unknown { return this._connected ? { request: async () => null } : null; }
  get isConnected(): boolean { return this._connected; }
}

/** Measure async operation duration in ms. */
async function measure(fn: () => Promise<void>): Promise<number> {
  const start = performance.now();
  await fn();
  return performance.now() - start;
}

describe('Connector Benchmarks', () => {
  it('should connect within 5ms', async () => {
    const connector = new BenchConnector();
    const duration = await measure(async () => {
      await connector.connect();
    });
    expect(duration).toBeLessThan(5);
  });

  it('should disconnect within 1ms', async () => {
    const connector = new BenchConnector();
    await connector.connect();
    const duration = await measure(async () => {
      await connector.disconnect();
    });
    expect(duration).toBeLessThan(1);
  });

  it('should sign message within 2ms', async () => {
    const connector = new BenchConnector();
    await connector.connect();
    const duration = await measure(async () => {
      await connector.signMessage('benchmark message');
    });
    expect(duration).toBeLessThan(2);
  });

  it('should sign transaction within 2ms', async () => {
    const connector = new BenchConnector();
    await connector.connect();
    const duration = await measure(async () => {
      await connector.signTransaction({ to: '0x' + 'ab'.repeat(20), value: BigInt(1000) } as TransactionRequest);
    });
    expect(duration).toBeLessThan(2);
  });

  it('should switch chain within 1ms', async () => {
    const connector = new BenchConnector();
    await connector.connect();
    const duration = await measure(async () => {
      await connector.switchChain(137);
    });
    expect(duration).toBeLessThan(1);
  });

  it('should handle 1000 connect-disconnect cycles within 500ms', async () => {
    const connector = new BenchConnector();
    const start = performance.now();
    for (let i = 0; i < 1000; i++) {
      await connector.connect();
      await connector.disconnect();
    }
    const duration = performance.now() - start;
    expect(duration).toBeLessThan(500);
  });

  it('should handle 100 rapid sign operations within 100ms', async () => {
    const connector = new BenchConnector();
    await connector.connect();
    const start = performance.now();
    const promises = Array.from({ length: 100 }, () => connector.signMessage('bench'));
    await Promise.all(promises);
    const duration = performance.now() - start;
    expect(duration).toBeLessThan(100);
  });
});
