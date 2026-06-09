import { describe, it, expect, test } from 'vitest';
import { createWalletClient, createPublicClient, http } from 'viem';
import { sepolia } from 'viem/chains';
import { privateKeyToAccount } from 'viem/accounts';

// ── Config ──────────────────────────────────────────────────────────────────

const SEPOLIA_RPC = process.env.SEPOLIA_RPC_URL || 'https://ethereum-sepolia-rpc.publicnode.com';
const TEST_PK = process.env.TEST_PRIVATE_KEY;
const TEST_ADDR = process.env.TEST_ADDRESS;

const publicClient = createPublicClient({
  chain: sepolia,
  transport: http(SEPOLIA_RPC, { timeout: 10000 }),
});

// ── Helpers ─────────────────────────────────────────────────────────────────

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

describe('On-Chain Signing (Sepolia)', () => {
  describe('Wallet creation', () => {
    test('can create a wallet from private key', () => {
      const account = getWallet();
      if (!account) return;

      expect(account.address).toBeDefined();
      expect(account.address).toMatch(/^0x[a-fA-F0-9]{40}$/);
    });

    test('address matches TEST_ADDRESS when provided', () => {
      const account = getWallet();
      if (!account) return;
      if (!TEST_ADDR) return;

      expect(account.address.toLowerCase()).toBe(TEST_ADDR!.toLowerCase());
    });
  });

  describe('Personal message signing', () => {
    const MESSAGE = 'Hello Cinacoin integration test!';

    test.skipIf(!TEST_PK)('signs a personal message', async () => {
      const account = getWallet()!;
      const wallet = makeWalletClient(account);

      const signature = await wallet.signMessage({ message: MESSAGE });

      expect(signature).toBeDefined();
      expect(signature).toMatch(/^0x[a-fA-F0-9]{130}$/); // 65 bytes + 0x
    });

    test.skipIf(!TEST_PK)('recovered address matches signer', async () => {
      const account = getWallet()!;
      const wallet = makeWalletClient(account);

      const signature = await wallet.signMessage({ message: MESSAGE });
      const recovered = await publicClient.verifyMessage({
        address: account.address,
        message: MESSAGE,
        signature,
      });

      expect(recovered).toBe(true);
    });

    test.skipIf(!TEST_PK)('different message produces different signature', async () => {
      const account = getWallet()!;
      const wallet = makeWalletClient(account);

      const sig1 = await wallet.signMessage({ message: 'Message A' });
      const sig2 = await wallet.signMessage({ message: 'Message B' });

      expect(sig1).not.toBe(sig2);
    });
  });

  describe('EIP-712 Typed Data signing', () => {
    // A simple Permit-like typed data structure
    const domain = {
      name: 'Cinacoin',
      version: '1',
      chainId: 11155111,
      verifyingContract: '0xCcCCccccCCCCcCCCCCCcCcCccCcCCCcCcccccccC' as const,
    };

    const types = {
      Permit: [
        { name: 'owner', type: 'address' },
        { name: 'spender', type: 'address' },
        { name: 'value', type: 'uint256' },
        { name: 'nonce', type: 'uint256' },
        { name: 'deadline', type: 'uint256' },
      ],
    };

    const message = {
      owner: '0x0000000000000000000000000000000000000001' as const,
      spender: '0x0000000000000000000000000000000000000002' as const,
      value: 1000n,
      nonce: 0n,
      deadline: 9999999999n,
    };

    test.skipIf(!TEST_PK)('signs EIP-712 typed data', async () => {
      const account = getWallet()!;
      const wallet = makeWalletClient(account);

      const signature = await wallet.signTypedData({
        domain,
        types,
        primaryType: 'Permit',
        message,
      });

      expect(signature).toBeDefined();
      expect(signature).toMatch(/^0x[a-fA-F0-9]{130}$/);
    });

    test.skipIf(!TEST_PK)('verifies EIP-712 signature', async () => {
      const account = getWallet()!;
      const wallet = makeWalletClient(account);

      const signature = await wallet.signTypedData({
        domain,
        types,
        primaryType: 'Permit',
        message,
      });

      const valid = await publicClient.verifyTypedData({
        domain,
        types,
        primaryType: 'Permit',
        message,
        address: account.address,
        signature,
      });

      expect(valid).toBe(true);
    });

    test.skipIf(!TEST_PK)('tampered message fails verification', async () => {
      const account = getWallet()!;
      const wallet = makeWalletClient(account);

      const signature = await wallet.signTypedData({
        domain,
        types,
        primaryType: 'Permit',
        message,
      });

      // Change the value and verify — should fail
      const tamperedMessage = { ...message, value: 9999n };

      const valid = await publicClient.verifyTypedData({
        domain,
        types,
        primaryType: 'Permit',
        message: tamperedMessage,
        address: account.address,
        signature,
      });

      expect(valid).toBe(false);
    });
  });

  describe('Signing timing', () => {
    test.skipIf(!TEST_PK)('signMessage completes in under 3 seconds', async () => {
      const account = getWallet()!;
      const wallet = makeWalletClient(account);

      const start = Date.now();
      await wallet.signMessage({ message: 'Timing test' });
      const elapsed = Date.now() - start;

      expect(elapsed).toBeLessThan(3000);
    });
  });
});
