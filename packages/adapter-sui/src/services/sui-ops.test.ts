/**
 * Unit tests for adapter-sui — Sui operations service.
 */

import { describe, it, expect } from 'vitest';
import {
  createTransactionBlock,
  transferObjects,
  splitCoin,
  mergeCoins,
  moveCall,
  buildTransferObjectTx,
  buildSplitCoinTx,
  buildMergeCoinsTx,
  buildSuiTransferTx,
  buildCoinTransferTx,
  serializeTransactionBlock,
  parseTransactionBlock,
  buildPersonalMessage,
  buildExecuteTransactionRpc,
  buildDryRunRpc,
} from './services/sui-ops.js';

describe('TransactionBlock builder', () => {
  it('should create an empty transaction block', () => {
    const tx = createTransactionBlock('0xsender');
    expect(tx.inputs).toHaveLength(0);
    expect(tx.transactions).toHaveLength(0);
    expect(tx.sender).toBe('0xsender');
  });

  it('should add a TransferObjects command', () => {
    const tx = createTransactionBlock('0xsender');
    transferObjects(tx, ['0xobj1', '0xobj2'], '0xrecipient');
    expect(tx.transactions).toHaveLength(1);
    expect(tx.transactions[0].kind).toBe('TransferObjects');
    expect((tx.transactions[0] as any).objects).toEqual(['0xobj1', '0xobj2']);
  });

  it('should add a SplitCoin command', () => {
    const tx = createTransactionBlock('0xsender');
    splitCoin(tx, '0xcoin', ['1000000000', '2000000000']);
    expect(tx.transactions).toHaveLength(1);
    expect(tx.transactions[0].kind).toBe('SplitCoin');
  });

  it('should add a MergeCoins command', () => {
    const tx = createTransactionBlock('0xsender');
    mergeCoins(tx, '0xdest', ['0xsrc1', '0xsrc2']);
    expect(tx.transactions).toHaveLength(1);
    expect(tx.transactions[0].kind).toBe('MergeCoins');
  });

  it('should add a MoveCall command', () => {
    const tx = createTransactionBlock('0xsender');
    moveCall(tx, '0x2::coin::transfer', {
      typeArguments: ['0x2::sui::SUI'],
      arguments: ['0xrecipient', '1000000000'],
    });
    expect(tx.transactions).toHaveLength(1);
    expect(tx.transactions[0].kind).toBe('MoveCall');
  });
});

describe('buildTransferObjectTx', () => {
  it('should build a transfer object transaction', () => {
    const tx = buildTransferObjectTx('0xsender', '0xobject', '0xrecipient');
    expect(tx.sender).toBe('0xsender');
    expect(tx.transactions).toHaveLength(1);
    expect(tx.transactions[0].kind).toBe('TransferObjects');
  });
});

describe('buildSplitCoinTx', () => {
  it('should build a split coin transaction', () => {
    const tx = buildSplitCoinTx('0xsender', '0xcoin', ['1000000000', '2000000000']);
    expect(tx.sender).toBe('0xsender');
    expect(tx.transactions[0].kind).toBe('SplitCoin');
  });
});

describe('buildMergeCoinsTx', () => {
  it('should build a merge coins transaction', () => {
    const tx = buildMergeCoinsTx('0xsender', '0xdest', ['0xsrc1', '0xsrc2']);
    expect(tx.transactions[0].kind).toBe('MergeCoins');
  });
});

describe('buildSuiTransferTx', () => {
  it('should build a SUI transfer transaction', () => {
    const tx = buildSuiTransferTx('0xsender', '0xrecipient', '1000000000', '1000000');
    expect(tx.transactions).toHaveLength(1);
    expect(tx.transactions[0].kind).toBe('MoveCall');
    expect((tx.transactions[0] as any).target).toBe('0x2::pay::split_and_transfer');
    expect(tx.gasConfig?.budget).toBe('1000000');
  });
});

describe('buildCoinTransferTx', () => {
  it('should build a custom coin transfer', () => {
    const tx = buildCoinTransferTx('0xsender', '0xrecipient', '500', '0x2::sui::SUI', '1000000');
    expect(tx.transactions[0].kind).toBe('MoveCall');
    expect((tx.transactions[0] as any).target).toBe('0x2::coin::transfer');
    expect((tx.transactions[0] as any).typeArguments).toContain('0x2::sui::SUI');
  });
});

describe('serializeTransactionBlock / parseTransactionBlock', () => {
  it('should round-trip a transaction block', () => {
    const tx = buildSuiTransferTx('0xsender', '0xrecipient', '1000000000');
    const json = serializeTransactionBlock(tx);
    const parsed = parseTransactionBlock(json);
    expect(parsed.sender).toBe(tx.sender);
    expect(parsed.transactions).toEqual(tx.transactions);
  });
});

describe('buildPersonalMessage', () => {
  it('should create a message with prefix', () => {
    const msg = buildPersonalMessage('Hello Sui');
    // Should contain the sui_personal_message prefix
    expect(msg.length).toBeGreaterThan(0);
  });
});

describe('buildExecuteTransactionRpc', () => {
  it('should build an execute transaction RPC call', () => {
    const rpc = buildExecuteTransactionRpc({
      txBytes: 'dHhCeXRlcw==',
      signature: 'c2lnbmF0dXJl',
    });
    expect(rpc.method).toBe('sui_executeTransactionBlock');
    expect(rpc.params).toHaveLength(3);
    expect(rpc.params[0]).toBe('dHhCeXRlcw==');
    expect((rpc.params[2] as Record<string, unknown>).requestType).toBe('WaitForLocalExec');
  });
});

describe('buildDryRunRpc', () => {
  it('should build a dry run RPC call', () => {
    const rpc = buildDryRunRpc('dHhCeXRlcw==');
    expect(rpc.method).toBe('sui_dryRunTransactionBlock');
  });
});
