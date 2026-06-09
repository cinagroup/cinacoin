/**
 * JSON-RPC method handling tests for WalletConnect v2.
 *
 * Tests the methods module:
 * - WC_METHODS / WC_EVENTS constants
 * - SOLANA_METHODS / SOLANA_EVENTS constants
 * - getDefaultRequiredNamespaces
 * - buildSendTransaction
 * - buildPersonalSign
 * - buildSignTypedDataV4
 * - buildEthSign
 * - buildSignTransaction
 * - buildSwitchChain
 * - buildAddChain
 * - buildWatchAsset
 * - buildScanQRCode
 * - buildSolanaSignMessage / buildSolanaSignTransaction
 * - isEvmMethod / isSolanaMethod / isWcInternalMethod
 * - getMethodDescription
 * - METHOD_REGISTRY
 */

import { describe, it, expect } from 'vitest';
import {
  WC_METHODS,
  WC_EVENTS,
  SOLANA_METHODS,
  SOLANA_EVENTS,
  getDefaultRequiredNamespaces,
  buildSendTransaction,
  buildPersonalSign,
  buildSignTypedDataV4,
  buildEthSign,
  buildSignTransaction,
  buildSwitchChain,
  buildAddChain,
  buildWatchAsset,
  buildScanQRCode,
  buildSolanaSignMessage,
  buildSolanaSignTransaction,
  isEvmMethod,
  isSolanaMethod,
  isWcInternalMethod,
  getMethodDescription,
  METHOD_REGISTRY,
} from '../src/methods.js';

// ============================================================
// Constants
// ============================================================

describe('WC_METHODS', () => {
  it('contains standard EVM methods', () => {
    expect(WC_METHODS).toContain('eth_sendTransaction');
    expect(WC_METHODS).toContain('personal_sign');
    expect(WC_METHODS).toContain('eth_signTypedData_v4');
    expect(WC_METHODS).toContain('eth_accounts');
    expect(WC_METHODS).toContain('eth_chainId');
  });

  it('contains wallet management methods', () => {
    expect(WC_METHODS).toContain('wallet_switchEthereumChain');
    expect(WC_METHODS).toContain('wallet_addEthereumChain');
    expect(WC_METHODS).toContain('wallet_getPermissions');
    expect(WC_METHODS).toContain('wallet_requestPermissions');
    expect(WC_METHODS).toContain('wallet_watchAsset');
  });

  it('contains gas and query methods', () => {
    expect(WC_METHODS).toContain('eth_estimateGas');
    expect(WC_METHODS).toContain('eth_gasPrice');
    expect(WC_METHODS).toContain('eth_blockNumber');
    expect(WC_METHODS).toContain('eth_getBalance');
    expect(WC_METHODS).toContain('eth_getLogs');
  });

  it('has consistent length', () => {
    expect(WC_METHODS.length).toBeGreaterThan(15);
  });
});

describe('WC_EVENTS', () => {
  it('contains standard EVM events', () => {
    expect(WC_EVENTS).toContain('chainChanged');
    expect(WC_EVENTS).toContain('accountsChanged');
    expect(WC_EVENTS).toContain('disconnect');
    expect(WC_EVENTS).toContain('connect');
  });
});

describe('SOLANA_METHODS', () => {
  it('contains Solana-specific methods', () => {
    expect(SOLANA_METHODS).toContain('solana_signTransaction');
    expect(SOLANA_METHODS).toContain('solana_signMessage');
    expect(SOLANA_METHODS).toContain('solana_signAndSendTransaction');
    expect(SOLANA_METHODS).toContain('solana_signAllTransactions');
  });
});

describe('SOLANA_EVENTS', () => {
  it('contains Solana events', () => {
    expect(SOLANA_EVENTS).toContain('accountChanged');
    expect(SOLANA_EVENTS).toContain('connect');
    expect(SOLANA_EVENTS).toContain('disconnect');
  });
});

// ============================================================
// getDefaultRequiredNamespaces
// ============================================================

describe('getDefaultRequiredNamespaces', () => {
  it('returns EIP-155 namespace by default', () => {
    const ns = getDefaultRequiredNamespaces();
    expect(ns.eip155).toBeDefined();
    expect(ns.eip155.chains).toEqual(['eip155:1']);
    expect(ns.eip155.methods).toEqual([...WC_METHODS]);
    expect(ns.eip155.events).toEqual([...WC_EVENTS]);
  });

  it('includes multiple EIP-155 chains', () => {
    const ns = getDefaultRequiredNamespaces({
      chains: ['eip155:1', 'eip155:137', 'eip155:10'],
    });
    expect(ns.eip155.chains).toEqual(['eip155:1', 'eip155:137', 'eip155:10']);
  });

  it('includes Solana namespace when Solana chains are requested', () => {
    const ns = getDefaultRequiredNamespaces({
      chains: ['eip155:1', 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp'],
    });
    expect(ns.eip155).toBeDefined();
    expect(ns.solana).toBeDefined();
    expect(ns.solana.methods).toEqual([...SOLANA_METHODS]);
    expect(ns.solana.events).toEqual([...SOLANA_EVENTS]);
  });

  it('uses custom methods and events', () => {
    const ns = getDefaultRequiredNamespaces({
      methods: ['eth_sendTransaction'],
      events: ['accountsChanged'],
    });
    expect(ns.eip155.methods).toEqual(['eth_sendTransaction']);
    expect(ns.eip155.events).toEqual(['accountsChanged']);
  });

  it('handles empty config', () => {
    const ns = getDefaultRequiredNamespaces({});
    expect(ns.eip155).toBeDefined();
  });

  it('only includes Solana namespace when solana chains present', () => {
    const ns = getDefaultRequiredNamespaces({
      chains: ['eip155:1'],
    });
    expect(ns.solana).toBeUndefined();
  });
});

// ============================================================
// EVM method builders
// ============================================================

describe('buildSendTransaction', () => {
  it('builds a send transaction request', () => {
    const req = buildSendTransaction({
      from: '0x123',
      to: '0x456',
      value: '0x0',
    });
    expect(req.method).toBe('eth_sendTransaction');
    expect(req.params).toEqual([{ from: '0x123', to: '0x456', value: '0x0' }]);
  });
});

describe('buildPersonalSign', () => {
  it('builds personal_sign with text message', () => {
    const req = buildPersonalSign('Hello', '0xabc');
    expect(req.method).toBe('personal_sign');
    expect(req.params[1]).toBe('0xabc');
    expect(req.params[0]).toMatch(/^0x/);
  });

  it('passes hex message through unchanged', () => {
    const req = buildPersonalSign('0xdeadbeef', '0xabc');
    expect(req.params[0]).toBe('0xdeadbeef');
  });
});

describe('buildSignTypedDataV4', () => {
  it('builds EIP-712 request', () => {
    const typedData = {
      domain: { name: 'Test' },
      types: {},
      message: {},
    };
    const req = buildSignTypedDataV4('0xabc', typedData);
    expect(req.method).toBe('eth_signTypedData_v4');
    expect(req.params).toEqual(['0xabc', typedData]);
  });
});

describe('buildEthSign', () => {
  it('builds eth_sign request', () => {
    const req = buildEthSign('0xabc', 'Hello');
    expect(req.method).toBe('eth_sign');
    expect(req.params).toEqual(['0xabc', expect.stringMatching(/^0x/)]);
  });
});

describe('buildSignTransaction', () => {
  it('builds sign transaction request', () => {
    const req = buildSignTransaction({
      from: '0x123',
      to: '0x456',
      value: '0x0',
    });
    expect(req.method).toBe('eth_signTransaction');
    expect(req.params).toEqual([{ from: '0x123', to: '0x456', value: '0x0' }]);
  });
});

describe('buildSwitchChain', () => {
  it('builds switch chain request', () => {
    const req = buildSwitchChain(137);
    expect(req.method).toBe('wallet_switchEthereumChain');
    expect(req.params).toEqual([{ chainId: '0x89' }]);
  });

  it('builds correct hex for chain 1', () => {
    const req = buildSwitchChain(1);
    expect(req.params).toEqual([{ chainId: '0x1' }]);
  });
});

describe('buildAddChain', () => {
  it('builds add chain request', () => {
    const req = buildAddChain(137, 'Polygon', ['https://polygon-rpc.com'], {
      name: 'MATIC',
      symbol: 'MATIC',
      decimals: 18,
    });
    expect(req.method).toBe('wallet_addEthereumChain');
    expect(req.params[0].chainId).toBe('0x89');
    expect(req.params[0].chainName).toBe('Polygon');
    expect(req.params[0].rpcUrls).toEqual(['https://polygon-rpc.com']);
  });

  it('includes optional block explorer URLs', () => {
    const req = buildAddChain(137, 'Polygon', ['https://polygon-rpc.com'], {
      name: 'MATIC',
      symbol: 'MATIC',
      decimals: 18,
    }, ['https://polygonscan.com']);
    expect(req.params[0].blockExplorerUrls).toEqual(['https://polygonscan.com']);
  });
});

describe('buildWatchAsset', () => {
  it('builds watch asset request', () => {
    const req = buildWatchAsset('ERC20', {
      address: '0xabc',
      symbol: 'TEST',
      decimals: 18,
    });
    expect(req.method).toBe('wallet_watchAsset');
    expect(req.params[0].type).toBe('ERC20');
    expect(req.params[0].options.symbol).toBe('TEST');
  });

  it('supports optional image', () => {
    const req = buildWatchAsset('ERC20', {
      address: '0xabc',
      symbol: 'TEST',
      decimals: 18,
      image: 'https://example.com/token.png',
    });
    expect(req.params[0].options.image).toBe('https://example.com/token.png');
  });
});

describe('buildScanQRCode', () => {
  it('builds scan QR code request without regex', () => {
    const req = buildScanQRCode();
    expect(req.method).toBe('wallet_scanQRCode');
    expect(req.params).toEqual([undefined]);
  });

  it('builds scan QR code request with regex', () => {
    const req = buildScanQRCode('^ethereum:');
    expect(req.params).toEqual(['^ethereum:']);
  });
});

// ============================================================
// Solana method builders
// ============================================================

describe('buildSolanaSignMessage', () => {
  it('builds Solana sign message request', () => {
    const req = buildSolanaSignMessage('pubkey123', 'Hello Solana');
    expect(req.method).toBe('solana_signMessage');
    expect(req.params).toEqual({ pubkey: 'pubkey123', message: 'Hello Solana' });
  });
});

describe('buildSolanaSignTransaction', () => {
  it('builds Solana sign transaction request', () => {
    const req = buildSolanaSignTransaction('base58encodedtx');
    expect(req.method).toBe('solana_signTransaction');
    expect(req.params).toEqual({ transaction: 'base58encodedtx' });
  });
});

// ============================================================
// Method classification
// ============================================================

describe('isEvmMethod', () => {
  it('returns true for EVM methods', () => {
    expect(isEvmMethod('eth_sendTransaction')).toBe(true);
    expect(isEvmMethod('personal_sign')).toBe(true);
    expect(isEvmMethod('eth_accounts')).toBe(true);
  });

  it('returns false for non-EVM methods', () => {
    expect(isEvmMethod('solana_signTransaction')).toBe(false);
    expect(isEvmMethod('wc_sessionPropose')).toBe(false);
    expect(isEvmMethod('unknown_method')).toBe(false);
  });
});

describe('isSolanaMethod', () => {
  it('returns true for Solana methods', () => {
    expect(isSolanaMethod('solana_signTransaction')).toBe(true);
    expect(isSolanaMethod('solana_signMessage')).toBe(true);
    expect(isSolanaMethod('solana_signAndSendTransaction')).toBe(true);
  });

  it('returns false for non-Solana methods', () => {
    expect(isSolanaMethod('eth_sendTransaction')).toBe(false);
    expect(isSolanaMethod('wc_sessionPropose')).toBe(false);
  });
});

describe('isWcInternalMethod', () => {
  it('returns true for WC-internal methods', () => {
    expect(isWcInternalMethod('wc_sessionPropose')).toBe(true);
    expect(isWcInternalMethod('wc_sessionDelete')).toBe(true);
    expect(isWcInternalMethod('wc_pairingPing')).toBe(true);
  });

  it('returns false for non-WC methods', () => {
    expect(isWcInternalMethod('eth_sendTransaction')).toBe(false);
    expect(isWcInternalMethod('personal_sign')).toBe(false);
  });
});

// ============================================================
// Method registry
// ============================================================

describe('METHOD_REGISTRY', () => {
  it('contains descriptions for all EVM methods', () => {
    for (const method of WC_METHODS) {
      expect(METHOD_REGISTRY[method]).toBeDefined();
    }
  });

  it('contains descriptions for all WC-internal methods', () => {
    const wcMethods = Object.keys(METHOD_REGISTRY).filter((m) => m.startsWith('wc_'));
    expect(wcMethods.length).toBeGreaterThan(5);
  });

  it('provides description for unknown methods', () => {
    const desc = getMethodDescription('unknown_method_xyz');
    expect(desc).toContain('Unknown method');
  });

  it('returns correct description for known methods', () => {
    expect(getMethodDescription('eth_sendTransaction')).toContain('Send a transaction');
    expect(getMethodDescription('personal_sign')).toContain('Sign an arbitrary message');
  });
});
