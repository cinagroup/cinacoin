/**
 * MetaMask Adapter Tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MetaMaskAdapter } from '../metamask/adapter.js';

describe('MetaMaskAdapter', () => {
  let adapter: MetaMaskAdapter;

  beforeEach(() => {
    adapter = new MetaMaskAdapter({ chains: [1, 137] });
  });

  describe('connect', () => {
    it('should connect and return accounts', async () => {
      // Mock window.ethereum
      const mockProvider = {
        request: vi.fn().mockImplementation(({ method }) => {
          if (method === 'eth_requestAccounts') {
            return Promise.resolve(['0x1234567890123456789012345678901234567890']);
          }
          if (method === 'eth_chainId') {
            return Promise.resolve('0x1');
          }
          return Promise.resolve(null);
        }),
        on: vi.fn(),
        removeListener: vi.fn(),
        isMetaMask: true,
      };

      (globalThis as any).window = { ethereum: mockProvider };

      const result = await adapter.connect();

      expect(result.accounts).toHaveLength(1);
      expect(result.chainId).toBe(1);
      expect(result.connectorId).toBe('metamask');
    });

    it('should throw if MetaMask not installed', async () => {
      (globalThis as any).window = {};

      await expect(adapter.connect()).rejects.toThrow('MetaMask not installed');
    });
  });

  describe('disconnect', () => {
    it('should disconnect successfully', async () => {
      await adapter.disconnect();
      // Should not throw
    });
  });

  describe('getAccounts', () => {
    it('should return empty array when not connected', async () => {
      const accounts = await adapter.getAccounts();
      expect(accounts).toEqual([]);
    });
  });

  describe('getChainId', () => {
    it('should throw when not connected', async () => {
      await expect(adapter.getChainId()).rejects.toThrow('Not connected');
    });
  });

  describe('switchChain', () => {
    it('should throw when not connected', async () => {
      await expect(adapter.switchChain(137)).rejects.toThrow('Not connected');
    });
  });

  describe('signMessage', () => {
    it('should throw when not connected', async () => {
      await expect(adapter.signMessage('test')).rejects.toThrow('Not connected');
    });
  });

  describe('signTransaction', () => {
    it('should throw when not connected', async () => {
      await expect(
        adapter.signTransaction({
          to: '0x1234567890123456789012345678901234567890',
          value: '0x0',
        })
      ).rejects.toThrow('Not connected');
    });
  });
});
