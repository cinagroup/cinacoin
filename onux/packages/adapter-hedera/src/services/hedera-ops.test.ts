/**
 * Unit tests for adapter-hedera — Hedera operations service.
 */

import { describe, it, expect } from 'vitest';
import {
  parseHederaId,
  isValidHederaId,
  buildHbarTransferTx,
  buildHtsTransferTx,
  buildTokenAssociateTx,
  buildTokenDissociateTx,
  buildTokenMintTx,
  buildTokenBurnTx,
  buildContractCallTx,
  tinybarToHbar,
  hbarToTinybar,
  buildBalanceUrl,
  buildTransactionHistoryUrl,
} from './hedera-ops.js';

describe('parseHederaId', () => {
  it('should parse a valid Hedera ID', () => {
    const result = parseHederaId('0.0.12345');
    expect(result).toEqual({ shard: '0', realm: '0', num: '12345' });
  });

  it('should throw on invalid format', () => {
    expect(() => parseHederaId('invalid')).toThrow('Invalid Hedera ID format');
    expect(() => parseHederaId('0.0')).toThrow('Invalid Hedera ID format');
  });
});

describe('isValidHederaId', () => {
  it('should validate correct IDs', () => {
    expect(isValidHederaId('0.0.12345')).toBe(true);
    expect(isValidHederaId('1.2.3')).toBe(true);
  });

  it('should reject invalid IDs', () => {
    expect(isValidHederaId('abc')).toBe(false);
    expect(isValidHederaId('0.0')).toBe(false);
    expect(isValidHederaId('')).toBe(false);
  });
});

describe('buildHbarTransferTx', () => {
  it('should build an HBAR transfer with negative sender amount', () => {
    const tx = buildHbarTransferTx({
      from: '0.0.12345',
      to: '0.0.67890',
      amount: '100000000',
    });

    expect(tx.transactionType).toBe('CryptoTransfer');
    expect(tx.transfers).toHaveLength(2);
    expect(tx.transfers[0].amount).toBe('-100000000');
    expect(tx.transfers[1].amount).toBe('100000000');
  });
});

describe('buildHtsTransferTx', () => {
  it('should build an HTS token transfer', () => {
    const tx = buildHtsTransferTx({
      from: '0.0.12345',
      tokenTransfers: [
        { tokenId: '0.0.100000', from: '0.0.12345', to: '0.0.67890', amount: '500' },
      ],
    });

    expect(tx.transactionType).toBe('CryptoTransfer');
    expect(tx.tokenTransfers).toHaveLength(1);
    expect(tx.tokenTransfers[0].tokenId).toBe('0.0.100000');
    expect(tx.tokenTransfers[0].transfers).toHaveLength(2);
  });

  it('should handle multiple tokens', () => {
    const tx = buildHtsTransferTx({
      from: '0.0.12345',
      tokenTransfers: [
        { tokenId: '0.0.100000', from: '0.0.12345', to: '0.0.67890', amount: '500' },
        { tokenId: '0.0.200000', from: '0.0.12345', to: '0.0.67890', amount: '1000' },
      ],
    });

    expect(tx.tokenTransfers).toHaveLength(2);
  });
});

describe('buildTokenAssociateTx', () => {
  it('should build a token associate transaction', () => {
    const tx = buildTokenAssociateTx('0.0.12345', ['0.0.100000', '0.0.200000']);
    expect(tx.transactionType).toBe('TokenAssociate');
    expect(tx.tokenIds).toHaveLength(2);
  });
});

describe('buildTokenMintTx', () => {
  it('should build a token mint transaction', () => {
    const tx = buildTokenMintTx({
      tokenId: '0.0.100000',
      amount: '1000000',
    });

    expect(tx.transactionType).toBe('TokenMint');
    expect(tx.amount).toBe('1000000');
  });
});

describe('buildTokenBurnTx', () => {
  it('should build a token burn transaction', () => {
    const tx = buildTokenBurnTx('0.0.100000', '500');
    expect(tx.transactionType).toBe('TokenBurn');
    expect(tx.amount).toBe('500');
  });
});

describe('buildContractCallTx', () => {
  it('should build a contract call transaction', () => {
    const tx = buildContractCallTx({
      contractId: '0.0.789012',
      function: 'transfer',
      functionParameters: '0xa9059cbb',
      gas: 100000,
      amount: '0',
    });

    expect(tx.transactionType).toBe('ContractCall');
    expect(tx.contractId).toBe('0.0.789012');
    expect(tx.gas).toBe(100000);
  });
});

describe('tinybarToHbar / hbarToTinybar', () => {
  it('should convert tinybar to HBAR', () => {
    expect(tinybarToHbar('100000000')).toBe('1');
    expect(tinybarToHbar('123456789')).toBe('1.23456789');
    expect(tinybarToHbar('1')).toBe('0.00000001');
  });

  it('should convert HBAR to tinybar', () => {
    expect(hbarToTinybar('1')).toBe('100000000');
    expect(hbarToTinybar('0.5')).toBe('50000000');
    expect(hbarToTinybar('1.23456789')).toBe('123456789');
  });

  it('should round-trip correctly', () => {
    expect(tinybarToHbar(hbarToTinybar('12.34567890'))).toBe('12.3456789');
  });
});

describe('URL builders', () => {
  const BASE = 'https://testnet.mirrornode.hedera.com';

  it('buildBalanceUrl should include account ID', () => {
    expect(buildBalanceUrl(BASE, '0.0.12345')).toContain('0.0.12345');
  });

  it('buildTransactionHistoryUrl should include limit', () => {
    const url = buildTransactionHistoryUrl(BASE, '0.0.12345', 20);
    expect(url).toContain('limit=20');
    expect(url).toContain('order=desc');
  });
});
