/**
 * Core SDK - Chain Switching Tests
 *
 * Tests for chain switching, validation, and event handling
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Connector } from '../src/connector.js';
import type { ConnectParams, ConnectionResult, TransactionRequest } from '../src/types.js';

// Supported chains
const SUPPORTED_CHAINS = [
  { id: 1, name: 'Ethereum', namespace: 'eip155' },
  { id: 137, name: 'Polygon', namespace: 'eip155' },
  { id: 42161, name: 'Arbitrum', namespace: 'eip155' },
  { id: 10, name: 'Optimism', namespace: 'eip155' },
  { id: 8453, name: 'Base', namespace: 'eip155' },
  { id: 56, name: 'BSC', namespace: 'eip155' },
  { id: 43114, name: 'Avalanche', namespace: 'eip155' },
  { id: 11155111, name: 'Sepolia', namespace: 'eip155' },
];

class ChainSwitchConnector extends Connector {
  readonly id = 'chain-switch-test';
  readonly name = 'Chain Switch Test';
  readonly icon = 'data:image/svg+xml;base64,test';
  readonly installed = true;
  readonly type = 'injected';
  
  private _connected = false;
  private _accounts = ['0x742d35Cc6634C0532925a3b844Bc9e7595f0fEb'];
  private _chainId = 1;
  private _supportedChains: number[];

  constructor(supportedChains?: number[]) {
    super();
    this._supportedChains = supportedChains ?? SUPPORTED_CHAINS.map(c => c.id);
  }

  async connect(params?: ConnectParams): Promise<ConnectionResult> {
    this._connected = true;
    this._chainId = params?.chains?.[0] ?? 1;
    return {
      sessionId: 'chain-session',
      accounts: this._accounts,
      chainId: this._chainId,
      connectorId: this.id,
    };
  }

  async disconnect(): Promise<void> {
    this._connected = false;
  }

  async getAccounts(): Promise<string[]> {
    return this._connected ? this._accounts : [];
  }

  async getChainId(): Promise<number> {
    return this._chainId;
  }

  async switchChain(chainId: number): Promise<void> {
    if (!this._connected) {
      throw new Error('Not connected');
    }

    if (!this._supportedChains.includes(chainId)) {
      throw new Error(`Chain ${chainId} not supported`);
    }

    const oldChainId = this._chainId;
    this._chainId = chainId;
    
    this.emit('chainChanged', {
      from: oldChainId,
      to: chainId,
      chainName: SUPPORTED_CHAINS.find(c => c.id === chainId)?.name ?? `Chain ${chainId}`,
    });
  }

  async signMessage(message: string): Promise<string> {
    return `sig:${message}`;
  }

  async signTransaction(_tx: TransactionRequest): Promise<string> {
    return '0xsignedtx';
  }

  getSupportedChains(): number[] {
    return [...this._supportedChains];
  }
}

describe('Chain Switching', () => {
  let connector: ChainSwitchConnector;

  beforeEach(async () => {
    connector = new ChainSwitchConnector();
    await connector.connect();
  });

  describe('switchChain', () => {
    it('should switch to Polygon', async () => {
      await connector.switchChain(137);
      expect(await connector.getChainId()).toBe(137);
    });

    it('should switch to Arbitrum', async () => {
      await connector.switchChain(42161);
      expect(await connector.getChainId()).toBe(42161);
    });

    it('should switch to Optimism', async () => {
      await connector.switchChain(10);
      expect(await connector.getChainId()).toBe(10);
    });

    it('should switch to Base', async () => {
      await connector.switchChain(8453);
      expect(await connector.getChainId()).toBe(8453);
    });

    it('should switch to BSC', async () => {
      await connector.switchChain(56);
      expect(await connector.getChainId()).toBe(56);
    });

    it('should switch to Avalanche', async () => {
      await connector.switchChain(43114);
      expect(await connector.getChainId()).toBe(43114);
    });

    it('should switch multiple times', async () => {
      await connector.switchChain(137);
      expect(await connector.getChainId()).toBe(137);
      
      await connector.switchChain(42161);
      expect(await connector.getChainId()).toBe(42161);
      
      await connector.switchChain(1);
      expect(await connector.getChainId()).toBe(1);
    });

    it('should emit chainChanged event', async () => {
      const handler = vi.fn();
      connector.on('chainChanged', handler);
      
      await connector.switchChain(137);
      
      expect(handler).toHaveBeenCalledWith({
        from: 1,
        to: 137,
        chainName: 'Polygon',
      });
    });

    it('should include correct from/to in event', async () => {
      await connector.switchChain(137);
      
      const handler = vi.fn();
      connector.on('chainChanged', handler);
      
      await connector.switchChain(42161);
      
      expect(handler).toHaveBeenCalledWith({
        from: 137,
        to: 42161,
        chainName: 'Arbitrum',
      });
    });

    it('should reject unsupported chain', async () => {
      await expect(connector.switchChain(999999)).rejects.toThrow('Chain 999999 not supported');
    });

    it('should reject when not connected', async () => {
      await connector.disconnect();
      await expect(connector.switchChain(137)).rejects.toThrow('Not connected');
    });

    it('should handle switching to same chain', async () => {
      const handler = vi.fn();
      connector.on('chainChanged', handler);
      
      await connector.switchChain(1); // Already on chain 1
      
      expect(handler).toHaveBeenCalled();
      expect(await connector.getChainId()).toBe(1);
    });
  });

  describe('supported chains', () => {
    it('should return supported chain list', () => {
      const chains = connector.getSupportedChains();
      expect(chains).toContain(1);
      expect(chains).toContain(137);
      expect(chains).toContain(42161);
    });

    it('should respect custom supported chains', async () => {
      const limited = new ChainSwitchConnector([1, 137]);
      await limited.connect();
      
      await limited.switchChain(137);
      expect(await limited.getChainId()).toBe(137);
      
      await expect(limited.switchChain(42161)).rejects.toThrow();
    });
  });

  describe('connect with chain', () => {
    it('should connect to specified chain', async () => {
      const fresh = new ChainSwitchConnector();
      const result = await fresh.connect({ chains: [137] });
      
      expect(result.chainId).toBe(137);
      expect(await fresh.getChainId()).toBe(137);
    });

    it('should default to chain 1', async () => {
      const fresh = new ChainSwitchConnector();
      const result = await fresh.connect();
      
      expect(result.chainId).toBe(1);
    });
  });
});
