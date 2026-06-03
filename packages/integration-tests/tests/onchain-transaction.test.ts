import { describe, it, expect, test } from 'vitest';
import { createWalletClient, createPublicClient, http, parseEther } from 'viem';
import { sepolia } from 'viem/chains';
import { privateKeyToAccount } from 'viem/accounts';

// ── Config ──────────────────────────────────────────────────────────────────

const SEPOLIA_RPC = process.env.SEPOLIA_RPC_URL || 'https://ethereum-sepolia-rpc.publicnode.com';
const TEST_PK = process.env.TEST_PRIVATE_KEY;

const publicClient = createPublicClient({
  chain: sepolia,
  transport: http(SEPOLIA_RPC, { timeout: 10000 }),
});

function getWallet() {
  if (!TEST_PK) return null;
  return privateKeyToAccount(TEST_PK as `0x${string}`);
}

function makeWalletClient(account: ReturnType<typeof privateKeyToAccount>) {
  return createWalletClient({
    account,
    chain: sepolia,
    transport: http(SEPOLIA_RPC, { timeout: 10000 }),
  });
}

// ── Tests ───────────────────────────────────────────────────────────────────

describe('On-Chain Transaction (Sepolia)', () => {
  describe('Gas estimation', () => {
    test.skipIf(!TEST_PK)('estimates gas for a simple ETH transfer', async () => {
      const account = getWallet()!;
      const gas = await publicClient.estimateGas({
        account: account.address,
        to: account.address,
        value: parseEther('0.0001'),
      });

      expect(gas).toBeGreaterThan(0n);
      // ETH transfer typically ~21,000 gas
      expect(gas).toBeLessThan(100_000n);
    });

    test.skipIf(!TEST_PK)('gas estimate is consistent across calls', async () => {
      const account = getWallet()!;
      const g1 = await publicClient.estimateGas({
        account: account.address,
        to: account.address,
        value: parseEther('0.0001'),
      });
      const g2 = await publicClient.estimateGas({
        account: account.address,
        to: account.address,
        value: parseEther('0.0001'),
      });

      // Gas should be identical for same transaction
      expect(g1).toBe(g2);
    });

    test('can estimate gas without a wallet (dry-run)', async () => {
      const gas = await publicClient.estimateGas({
        account: '0x1234567890abcdef1234567890abcdef12345678',
        to: '0x1234567890abcdef1234567890abcdef12345678',
        value: 1n,
      });

      expect(gas).toBeGreaterThan(0n);
    });
  });

  describe('Transaction building', () => {
    test.skipIf(!TEST_PK)('builds a valid transaction request', async () => {
      const account = getWallet()!;
      const nonce = await publicClient.getTransactionCount({
        address: account.address,
      });
      const gasPrice = await publicClient.getGasPrice();
      const gas = await publicClient.estimateGas({
        account: account.address,
        to: account.address,
        value: parseEther('0.0001'),
      });

      expect(nonce).toBeGreaterThanOrEqual(0);
      expect(gasPrice).toBeGreaterThan(0n);
      expect(gas).toBeGreaterThan(0n);
    });
  });

  describe('Transaction submission', () => {
    test.skipIf(!TEST_PK)('submits and confirms a self-transfer transaction', async () => {
      const account = getWallet()!;
      const wallet = makeWalletClient(account);

      // Self-transfer with minimal value
      const hash = await wallet.sendTransaction({
        to: account.address,
        value: parseEther('0.00001'),
      });

      expect(hash).toBeDefined();
      expect(hash).toMatch(/^0x[a-fA-F0-9]{64}$/);

      // Wait for confirmation (up to 60 seconds)
      const receipt = await publicClient.waitForTransactionReceipt({
        hash,
        timeout: 60_000,
      });

      expect(receipt).toBeDefined();
      expect(receipt.status).toBe('success');
      expect(receipt.transactionHash).toBe(hash);
    });

    test.skipIf(!TEST_PK)('tracks transaction status until confirmed', async () => {
      const account = getWallet()!;
      const wallet = makeWalletClient(account);

      const hash = await wallet.sendTransaction({
        to: account.address,
        value: parseEther('0.00001'),
      });

      // Poll for status
      let status: string | undefined;
      for (let i = 0; i < 20; i++) {
        const pending = await publicClient.getTransaction({ hash });
        if (pending && pending.blockNumber) {
          status = 'confirmed';
          break;
        }
        await new Promise((r) => setTimeout(r, 2000));
      }

      expect(status).toBe('confirmed');
    });
  });

  describe('Transaction receipt parsing', () => {
    test.skipIf(!TEST_PK)('receipt contains expected fields', async () => {
      const account = getWallet()!;
      const wallet = makeWalletClient(account);

      const hash = await wallet.sendTransaction({
        to: account.address,
        value: parseEther('0.00001'),
      });

      const receipt = await publicClient.waitForTransactionReceipt({
        hash,
        timeout: 60_000,
      });

      expect(receipt.blockHash).toBeDefined();
      expect(receipt.blockNumber).toBeGreaterThan(0n);
      expect(receipt.gasUsed).toBeGreaterThan(0n);
      expect(receipt.effectiveGasPrice).toBeGreaterThan(0n);
      expect(receipt.transactionHash).toBe(hash);
      expect(receipt.from?.toLowerCase()).toBe(account.address.toLowerCase());
    });
  });

  describe('Transaction timing', () => {
    test.skipIf(!TEST_PK)('transaction submission completes quickly', async () => {
      const account = getWallet()!;
      const wallet = makeWalletClient(account);

      const start = Date.now();
      const hash = await wallet.sendTransaction({
        to: account.address,
        value: parseEther('0.00001'),
      });
      const elapsed = Date.now() - start;

      expect(hash).toBeDefined();
      expect(elapsed).toBeLessThan(5000);
    });
  });
});
