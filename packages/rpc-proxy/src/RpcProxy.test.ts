import { describe, it, expect } from 'vitest';
import { RpcProxy } from './RpcProxy';

describe('RpcProxy', () => {
  it('should be constructable with valid config', () => {
    const proxy = new RpcProxy({
      port: 0,
      chains: { ethereum: 'https://eth.example.com' },
    });
    expect(proxy).toBeDefined();
  });

  it('should expose start and stop methods', () => {
    const proxy = new RpcProxy({
      port: 0,
      chains: { ethereum: 'https://eth.example.com' },
    });
    expect(typeof proxy.start).toBe('function');
    expect(typeof proxy.stop).toBe('function');
  });

  it('should expose getStats method', () => {
    const proxy = new RpcProxy({
      port: 0,
      chains: { ethereum: 'https://eth.example.com' },
    });
    expect(typeof proxy.getStats).toBe('function');
  });

  it('should support multiple chain configuration', () => {
    const proxy = new RpcProxy({
      port: 0,
      chains: {
        ethereum: 'https://eth.example.com',
        polygon: 'https://polygon.example.com',
        arbitrum: 'https://arb.example.com',
      },
    });
    expect(proxy).toBeDefined();
  });

  it('should accept optional configuration', () => {
    const proxy = new RpcProxy({
      port: 0,
      host: '127.0.0.1',
      chains: { ethereum: 'https://eth.example.com' },
      defaultChain: 'ethereum',
      cacheTtlMs: 5000,
      rateLimitPerMinute: 100,
      maxBodySize: 1024 * 1024,
      enableBatching: true,
      maxBatchSize: 10,
    });
    expect(proxy).toBeDefined();
  });
});
