/**
 * Cinacoin (WalletConnect) Adapter Tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CinacoinAdapter } from '../walletconnect/adapter.js';
import type { CinacoinConfig } from '../walletconnect/types.js';

describe('CinacoinAdapter', () => {
  let adapter: CinacoinAdapter;
  let config: CinacoinConfig;

  beforeEach(() => {
    config = {
      projectId: 'test-project-id',
      requiredChains: ['eip155:1', 'eip155:137'],
      metadata: {
        name: 'Test dApp',
        description: 'Test application',
        url: 'https://test.com',
        icons: ['https://test.com/icon.png'],
      },
    };
    adapter = new CinacoinAdapter(config);
  });

  describe('constructor', () => {
    it('should initialize with config', () => {
      expect(adapter.id).toBe('walletconnect');
      expect(adapter.name).toBe('Cinacoin');
      expect(adapter.type).toBe('walletconnect');
    });
  });

  describe('installed', () => {
    it('should always return true', () => {
      expect(adapter.installed).toBe(true);
    });
  });

  describe('connect', () => {
    it('should connect and return session', async () => {
      const result = await adapter.connect();

      expect(result.sessionId).toBeDefined();
      expect(result.accounts).toBeDefined();
      expect(Array.isArray(result.accounts)).toBe(true);
      expect(result.chainId).toBe(1);
      expect(result.connectorId).toBe('walletconnect');
    });

    it('should throw if projectId is missing', async () => {
      const adapterNoProject = new CinacoinAdapter({ projectId: '' });
      await expect(adapterNoProject.connect()).rejects.toThrow('projectId is required');
    });

    it('should emit display_uri event', async () => {
      const emitSpy = vi.fn();
      adapter.on('display_uri', emitSpy);

      await adapter.connect();

      expect(emitSpy).toHaveBeenCalled();
    });
  });

  describe('disconnect', () => {
    it('should disconnect successfully', async () => {
      await adapter.connect();
      await adapter.disconnect();

      expect(adapter.getSession()).toBeNull();
      expect(adapter.getURI()).toBeNull();
    });

    it('should emit disconnect event', async () => {
      const emitSpy = vi.fn();
      adapter.on('disconnect', emitSpy);

      await adapter.connect();
      await adapter.disconnect();

      expect(emitSpy).toHaveBeenCalled();
    });
  });

  describe('getAccounts', () => {
    it('should return empty array when not connected', async () => {
      const accounts = await adapter.getAccounts();
      expect(accounts).toEqual([]);
    });

    it('should return accounts when connected', async () => {
      await adapter.connect();
      const accounts = await adapter.getAccounts();
      expect(accounts.length).toBeGreaterThan(0);
    });
  });

  describe('getChainId', () => {
    it('should throw when not connected', async () => {
      await expect(adapter.getChainId()).rejects.toThrow('Not connected');
    });

    it('should return chain ID when connected', async () => {
      await adapter.connect();
      const chainId = await adapter.getChainId();
      expect(chainId).toBe(1);
    });
  });

  describe('switchChain', () => {
    it('should throw when not connected', async () => {
      await expect(adapter.switchChain(137)).rejects.toThrow('Not connected');
    });

    it('should switch chain when connected', async () => {
      await adapter.connect();
      await adapter.switchChain(137);

      const chainId = await adapter.getChainId();
      expect(chainId).toBe(137);
    });
  });

  describe('signMessage', () => {
    it('should throw when not connected', async () => {
      await expect(adapter.signMessage('test')).rejects.toThrow('Not connected');
    });

    it('should return signature when connected', async () => {
      await adapter.connect();
      const signature = await adapter.signMessage('test message');
      expect(signature).toBeDefined();
      expect(typeof signature).toBe('string');
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

    it('should return signed transaction when connected', async () => {
      await adapter.connect();
      const signedTx = await adapter.signTransaction({
        to: '0x1234567890123456789012345678901234567890',
        value: '0x0',
      });
      expect(signedTx).toBeDefined();
      expect(typeof signedTx).toBe('string');
    });
  });

  describe('getURI', () => {
    it('should return null when not connected', () => {
      expect(adapter.getURI()).toBeNull();
    });

    it('should return URI when connected', async () => {
      await adapter.connect();
      const uri = adapter.getURI();
      expect(uri).toBeDefined();
      expect(uri).toMatch(/^wc:/);
    });
  });

  describe('isSessionValid', () => {
    it('should return false when not connected', () => {
      expect(adapter.isSessionValid()).toBe(false);
    });

    it('should return true when connected', async () => {
      await adapter.connect();
      expect(adapter.isSessionValid()).toBe(true);
    });
  });
});
