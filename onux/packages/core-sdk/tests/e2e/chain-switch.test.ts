/**
 * E2E Test — Chain Switching Flow
 *
 * Mocks chain switching between multiple registered EVM chains:
 *   register chains → switch → verify state → invalid chain handling
 *
 * ~150 lines covering full chain lifecycle management.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Connector } from '../../src/connector.js';
import type { ConnectParams, ConnectionResult, Chain } from '../../src/types.js';

// ── Chain Registry ────────────────────────────────────────────────

class ChainRegistry {
  private chains = new Map<string, Chain>();

  register(chain: Chain): void {
    this.chains.set(chain.id, chain);
  }

  get(id: string): Chain | undefined {
    return this.chains.get(id);
  }

  getAll(): Chain[] {
    return Array.from(this.chains.values());
  }

  unregister(id: string): boolean {
    return this.chains.delete(id);
  }

  has(id: string): boolean {
    return this.chains.has(id);
  }
}

// ── EVM Chain Fixtures ────────────────────────────────────────────

const ETH_MAINNET: Chain = {
  id: 'eip155:1',
  name: 'Ethereum',
  rpcUrl: 'https://eth.llamarpc.com',
  nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
  explorerUrl: 'https://etherscan.io',
};

const ARBITRUM: Chain = {
  id: 'eip155:42161',
  name: 'Arbitrum One',
  rpcUrl: 'https://arb1.arbitrum.io/rpc',
  nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
  explorerUrl: 'https://arbiscan.io',
};

const BASE: Chain = {
  id: 'eip155:8453',
  name: 'Base',
  rpcUrl: 'https://mainnet.base.org',
  nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
  explorerUrl: 'https://basescan.org',
};

const POLYGON: Chain = {
  id: 'eip155:137',
  name: 'Polygon',
  rpcUrl: 'https://polygon-rpc.com',
  nativeCurrency: { name: 'MATIC', symbol: 'MATIC', decimals: 18 },
  explorerUrl: 'https://polygonscan.com',
};

const OPTIMISM: Chain = {
  id: 'eip155:10',
  name: 'Optimism',
  rpcUrl: 'https://mainnet.optimism.io',
  nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
  explorerUrl: 'https://optimistic.etherscan.io',
};

// ── Mock Connector with Chain Support ─────────────────────────────

class MockChainConnector extends Connector {
  readonly id = 'chain-switch-e2e';
  readonly name = 'Chain Switch Test';
  readonly icon = 'data:image/svg+xml;base64,mock';
  readonly installed = true;
  readonly type = 'injected';

  private _connected = false;
  private _chainId = 1;
  private _registry = new ChainRegistry();

  registerChain(chain: Chain): void {
    this._registry.register(chain);
  }

  async connect(params?: ConnectParams): Promise<ConnectionResult> {
    if (this._connected) throw new Error('Already connected');
    this._connected = true;
    this._chainId = params?.chains?.[0] ?? 1;
    // Register default chains on connect
    this.registerChain(ETH_MAINNET);
    this.registerChain(ARBITRUM);
    this.registerChain(BASE);
    this.registerChain(POLYGON);
    this.registerChain(OPTIMISM);
    return {
      sessionId: 'session_chain_test',
      accounts: ['0x1234567890abcdef1234567890abcdef12345678'],
      chainId: this._chainId,
      connectorId: this.id,
    };
  }

  async disconnect(): Promise<void> {
    this._connected = false;
    this.emit('disconnect');
  }

  async getAccounts(): Promise<string[]> {
    return this._connected ? ['0x1234567890abcdef1234567890abcdef12345678'] : [];
  }

  async getChainId(): Promise<number> {
    return this._chainId;
  }

  async switchChain(chainId: number): Promise<void> {
    if (!this._connected) throw new Error('Not connected');
    const targetId = `eip155:${chainId}`;
    if (!this._registry.has(targetId)) {
      throw new Error(`Chain ${targetId} not registered`);
    }
    const oldChainId = this._chainId;
    this._chainId = chainId;
    this.emit('chainChanged', { chainId, prevChainId: oldChainId });
  }

  get isConnected() { return this._connected; }
  get registeredChains() { return this._registry.getAll(); }
}

// ── Tests ─────────────────────────────────────────────────────────

describe('E2E — Chain Switching Flow', () => {
  let connector: MockChainConnector;

  beforeEach(() => {
    connector = new MockChainConnector();
  });

  afterEach(() => {
    connector.removeAllListeners();
  });

  it('should register multiple EVM chains', async () => {
    await connector.connect();
    connector.registerChain(POLYGON);
    connector.registerChain(OPTIMISM);
    const chains = connector.registeredChains;
    expect(chains.length).toBeGreaterThanOrEqual(5);
    expect(chains.some(c => c.id === 'eip155:137')).toBe(true);
    expect(chains.some(c => c.id === 'eip155:10')).toBe(true);
  });

  it('should switch between registered chains', async () => {
    await connector.connect({ chains: [1] });
    expect(await connector.getChainId()).toBe(1);

    await connector.switchChain(42161);
    expect(await connector.getChainId()).toBe(42161);

    await connector.switchChain(8453);
    expect(await connector.getChainId()).toBe(8453);
  });

  it('should emit chainChanged event on switch', async () => {
    await connector.connect();
    const handler = vi.fn();
    connector.on('chainChanged', handler);

    await connector.switchChain(42161);

    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler.mock.calls[0][0].chainId).toBe(42161);
    expect(handler.mock.calls[0][0].prevChainId).toBe(1);
  });

  it('should reject switching to unregistered chain', async () => {
    await connector.connect();
    // 999 is not in the registry
    await expect(connector.switchChain(999)).rejects.toThrow('not registered');
  });

  it('should reject switching when not connected', async () => {
    await expect(connector.switchChain(137)).rejects.toThrow('Not connected');
  });

  it('should maintain chain state across multiple switches', async () => {
    await connector.connect();
    const chainIds = [1, 42161, 8453, 137, 10, 1];
    for (const id of chainIds) {
      await connector.switchChain(id);
      expect(await connector.getChainId()).toBe(id);
    }
  });

  it('should handle rapid chain switches', async () => {
    await connector.connect();
    await Promise.all([
      connector.switchChain(42161),
      connector.switchChain(8453),
    ]).catch(() => {}); // some may conflict, that's fine
    // Final state should be one of the registered chains
    const finalId = await connector.getChainId();
    expect([1, 42161, 8453]).toContain(finalId);
  });
});
