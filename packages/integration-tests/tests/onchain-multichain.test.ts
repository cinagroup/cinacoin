import { describe, it, expect, test } from 'vitest';
import { createPublicClient, http, defineChain } from 'viem';
import { logger } from '@cinacoin/logger';

// ── Chain Definitions ──────────────────────────────────────────────────────

const SEPOLIA_RPC = process.env.SEPOLIA_RPC_URL || 'https://ethereum-sepolia-rpc.publicnode.com';
const AMOY_RPC = process.env.AMOY_RPC_URL || 'https://rpc-amoy.polygon.technology';

const sepoliaChain = defineChain({
  id: 11155111,
  name: 'Sepolia',
  nativeCurrency: { name: 'Sepolia Ether', symbol: 'ETH', decimals: 18 },
  rpcUrls: { default: { http: [SEPOLIA_RPC] } },
});

const amoyChain = defineChain({
  id: 80002,
  name: 'Polygon Amoy',
  nativeCurrency: { name: 'MATIC', symbol: 'MATIC', decimals: 18 },
  rpcUrls: { default: { http: [AMOY_RPC] } },
});

// ── Clients ─────────────────────────────────────────────────────────────────

const sepoliaClient = createPublicClient({
  chain: sepoliaChain,
  transport: http(SEPOLIA_RPC, { timeout: 10000 }),
});

const amoyClient = createPublicClient({
  chain: amoyChain,
  transport: http(AMOY_RPC, { timeout: 10000 }),
});

// ── Tests ───────────────────────────────────────────────────────────────────

describe('On-Chain Multichain (Sepolia + Amoy)', () => {
  describe('Chain ID verification', () => {
    it('Sepolia returns chain ID 11155111', async () => {
      const start = Date.now();
      const chainId = await sepoliaClient.getChainId();
      const elapsed = Date.now() - start;

      expect(chainId).toBe(11155111);
      expect(elapsed).toBeLessThan(3000);
    });

    it('Amoy returns chain ID 80002', async () => {
      const start = Date.now();
      const chainId = await amoyClient.getChainId();
      const elapsed = Date.now() - start;

      expect(chainId).toBe(80002);
      expect(elapsed).toBeLessThan(3000);
    });

    it('chain IDs are different between networks', async () => {
      const sepoliaId = await sepoliaClient.getChainId();
      const amoyId = await amoyClient.getChainId();

      expect(sepoliaId).not.toBe(amoyId);
    });
  });

  describe('Balance checking on both chains', () => {
    const testAddress = '0x0000000000000000000000000000000000000000';

    it('can check balance on Sepolia', async () => {
      const balance = await sepoliaClient.getBalance({ address: testAddress });

      expect(typeof balance).toBe('bigint');
      expect(balance >= 0n).toBe(true);
    });

    it('can check balance on Amoy', async () => {
      const balance = await amoyClient.getBalance({ address: testAddress });

      expect(typeof balance).toBe('bigint');
      expect(balance >= 0n).toBe(true);
    });

    it('balances are independent across chains', async () => {
      const sepBalance = await sepoliaClient.getBalance({ address: testAddress });
      const amoyBalance = await amoyClient.getBalance({ address: testAddress });

      // Both should be valid bigint values (they represent different assets)
      expect(typeof sepBalance).toBe('bigint');
      expect(typeof amoyBalance).toBe('bigint');
    });
  });

  describe('Block fetching', () => {
    it('can fetch latest block on Sepolia', async () => {
      const block = await sepoliaClient.getBlock();

      expect(block).toBeDefined();
      expect(block.number).toBeGreaterThan(0n);
      expect(block.hash).toBeDefined();
    });

    it('can fetch latest block on Amoy', async () => {
      const block = await amoyClient.getBlock();

      expect(block).toBeDefined();
      expect(block.number).toBeGreaterThan(0n);
      expect(block.hash).toBeDefined();
    });
  });

  describe('Chain switching logic', () => {
    it('can switch between chains and get correct chain IDs', async () => {
      // Query Sepolia
      const sepChainId = await sepoliaClient.getChainId();
      expect(sepChainId).toBe(11155111);

      // Query Amoy
      const amoyChainId = await amoyClient.getChainId();
      expect(amoyChainId).toBe(80002);

      // Query Sepolia again to verify no state pollution
      const sepChainId2 = await sepoliaClient.getChainId();
      expect(sepChainId2).toBe(11155111);
    });

    it('can fetch gas price on both chains', async () => {
      const sepGas = await sepoliaClient.getGasPrice();
      const amoyGas = await amoyClient.getGasPrice();

      expect(sepGas).toBeGreaterThan(0n);
      expect(amoyGas).toBeGreaterThan(0n);
    });
  });

  describe('RPC latency comparison', () => {
    it('measures and reports Sepolia latency', async () => {
      const start = Date.now();
      await sepoliaClient.getBlockNumber();
      const elapsed = Date.now() - start;

      expect(elapsed).toBeLessThan(3000);
      logger.info(`  Sepolia latency: ${elapsed}ms`);
    });

    it('measures and reports Amoy latency', async () => {
      const start = Date.now();
      await amoyClient.getBlockNumber();
      const elapsed = Date.now() - start;

      expect(elapsed).toBeLessThan(3000);
      logger.info(`  Amoy latency: ${elapsed}ms`);
    });

    it('both chains respond within acceptable latency', async () => {
      const [sepStart, amoyStart] = [Date.now(), Date.now()];

      const [sepBlock, amoyBlock] = await Promise.all([
        sepoliaClient.getBlockNumber(),
        amoyClient.getBlockNumber(),
      ]);

      const sepElapsed = Date.now() - sepStart;
      const amoyElapsed = Date.now() - amoyStart;

      expect(sepBlock).toBeGreaterThan(0n);
      expect(amoyBlock).toBeGreaterThan(0n);
      expect(sepElapsed).toBeLessThan(3000);
      expect(amoyElapsed).toBeLessThan(3000);
    });
  });
});
