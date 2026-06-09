import { describe, it, expect } from 'vitest';
import { createPublicClient, http, webSocket } from 'viem';
import { sepolia } from 'viem/chains';

// ── Config ──────────────────────────────────────────────────────────────────

const SEPOLIA_RPC = process.env.SEPOLIA_RPC_URL || 'https://ethereum-sepolia-rpc.publicnode.com';
const SEPOLIA_FALLBACK = process.env.SEPOLIA_RPC_FALLBACK || 'https://sepolia.drpc.org';
const TIMEOUT_MS = Number(process.env.RPC_TIMEOUT_MS) || 5000;

function makeClient(url: string, timeoutMs = TIMEOUT_MS) {
  return createPublicClient({
    chain: { ...sepolia, rpcUrls: { default: { http: [url] } } },
    transport: http(url, { timeout: timeoutMs }),
  });
}

// ── Tests ───────────────────────────────────────────────────────────────────

describe('On-Chain Connectivity (Sepolia)', () => {
  it('eth_chainId returns 11155111', async () => {
    const client = makeClient(SEPOLIA_RPC);
    const start = Date.now();
    const chainId = await client.getChainId();
    const elapsed = Date.now() - start;

    expect(chainId).toBe(11155111);
    expect(elapsed).toBeLessThan(3000);
  });

  it('eth_blockNumber returns a positive block number', async () => {
    const client = makeClient(SEPOLIA_RPC);
    const blockNumber = await client.getBlockNumber();

    expect(blockNumber).toBeGreaterThan(0n);
  });

  it('eth_blockNumber increases over time', async () => {
    const client = makeClient(SEPOLIA_RPC);
    const b1 = await client.getBlockNumber();
    await new Promise((r) => setTimeout(r, 3000));
    const b2 = await client.getBlockNumber();

    expect(b2).toBeGreaterThanOrEqual(b1);
  });

  it('eth_getBalance returns a valid balance for zero address', async () => {
    const client = makeClient(SEPOLIA_RPC);
    const balance = await client.getBalance({
      address: '0x0000000000000000000000000000000000000000',
    });

    expect(typeof balance).toBe('bigint');
    expect(balance >= 0n).toBe(true);
  });

  it('eth_getBalance works for a random address', async () => {
    const client = makeClient(SEPOLIA_RPC);
    const balance = await client.getBalance({
      address: '0x1234567890abcdef1234567890abcdef12345678',
    });

    expect(typeof balance).toBe('bigint');
  });

  it('response time is under 3 seconds', async () => {
    const client = makeClient(SEPOLIA_RPC);
    const start = Date.now();
    await client.getBlockNumber();
    const elapsed = Date.now() - start;

    expect(elapsed).toBeLessThan(3000);
  });

  it('can fetch the latest block', async () => {
    const client = makeClient(SEPOLIA_RPC);
    const block = await client.getBlock();

    expect(block).toBeDefined();
    expect(block.number).toBeGreaterThan(0n);
    expect(block.hash).toBeDefined();
    expect(block.hash!.length).toBe(66); // 0x + 64 hex chars
  });

  it('can fetch gas price', async () => {
    const client = makeClient(SEPOLIA_RPC);
    const gasPrice = await client.getGasPrice();

    expect(gasPrice).toBeGreaterThan(0n);
  });

  describe('Failover', () => {
    it('falls back to secondary RPC when primary is unreachable', async () => {
      // Use an invalid URL to force failure on primary
      const badClient = createPublicClient({
        chain: sepolia,
        transport: http('http://127.0.0.1:1', { timeout: 1000 }),
      });

      // Primary should fail; we catch and then use fallback
      await expect(badClient.getBlockNumber()).rejects.toThrow();

      // Fallback should work
      const fallbackClient = makeClient(SEPOLIA_FALLBACK);
      const blockNumber = await fallbackClient.getBlockNumber();
      expect(blockNumber).toBeGreaterThan(0n);
    });
  });

  describe('Timeout handling', () => {
    it('respects a very short timeout', async () => {
      const shortClient = makeClient(SEPOLIA_RPC, 1);

      await expect(shortClient.getBlockNumber()).rejects.toThrow();
    });

    it('succeeds with generous timeout', async () => {
      const generousClient = makeClient(SEPOLIA_RPC, 30000);
      const blockNumber = await generousClient.getBlockNumber();

      expect(blockNumber).toBeGreaterThan(0n);
    });
  });

  describe('Multiple sequential requests', () => {
    it('handles 5 sequential RPC calls', async () => {
      const client = makeClient(SEPOLIA_RPC);
      const results: bigint[] = [];

      for (let i = 0; i < 5; i++) {
        const bn = await client.getBlockNumber();
        results.push(bn);
      }

      expect(results.length).toBe(5);
      // Each subsequent call should be >= the previous (blocks only go forward)
      for (let i = 1; i < results.length; i++) {
        expect(results[i]).toBeGreaterThanOrEqual(results[i - 1]);
      }
    });
  });
});
