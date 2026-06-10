/**
 * Unit tests for adapter-near — NEAR operations service.
 */

import { describe, it, expect } from 'vitest';
import {
  buildTransferTx,
  buildFunctionCallTx,
  buildMultiActionTx,
  buildCreateAccountTx,
  buildAddKeyTx,
  buildDeleteKeyTx,
  buildStakeTx,
  buildDeleteAccountTx,
  yoctoToNear,
  nearToYocto,
  buildFtTransferCall,
  buildFtBalanceOfCall,
  buildNftTransferCall,
  buildNftMintCall,
  buildCallFunctionRpc,
  isValidNearAccountId,
  buildViewAccountRpc,
} from './services/near-ops.js';

describe('buildTransferTx', () => {
  it('should build a valid transfer transaction', () => {
    const tx = buildTransferTx('alice.near', 'bob.near', 'ed25519:abc', '1000000000000000000000000');
    expect(tx.signerId).toBe('alice.near');
    expect(tx.receiverId).toBe('bob.near');
    expect(tx.actions).toHaveLength(1);
    expect(tx.actions[0]).toEqual({ kind: 'Transfer', deposit: '1000000000000000000000000' });
  });
});

describe('buildFunctionCallTx', () => {
  it('should build a function call transaction', () => {
    const tx = buildFunctionCallTx(
      'alice.near',
      'contract.near',
      'ed25519:abc',
      'transfer',
      { receiver_id: 'bob.near', amount: '100' },
    );
    expect(tx.actions).toHaveLength(1);
    expect(tx.actions[0].kind).toBe('FunctionCall');
    const fc = tx.actions[0] as unknown;
    expect(fc.methodName).toBe('transfer');
    expect(JSON.parse(fc.args)).toEqual({ receiver_id: 'bob.near', amount: '100' });
  });

  it('should use default gas and deposit', () => {
    const tx = buildFunctionCallTx('alice.near', 'contract.near', 'ed25519:abc', 'view');
    const fc = tx.actions[0] as unknown;
    expect(fc.gas).toBe('30000000000000');
    expect(fc.deposit).toBe('0');
  });
});

describe('buildCreateAccountTx', () => {
  it('should build a create account transaction', () => {
    const tx = buildCreateAccountTx('alice.near', {
      newAccountId: 'sub.alice.near',
      initialBalance: '1000000000000000000000000',
      publicKey: 'ed25519:xyz',
    });
    expect(tx.receiverId).toBe('sub.alice.near');
    expect(tx.actions).toHaveLength(3);
    expect(tx.actions[0].kind).toBe('CreateAccount');
    expect(tx.actions[1].kind).toBe('Transfer');
    expect(tx.actions[2].kind).toBe('AddKey');
  });
});

describe('buildAddKeyTx', () => {
  it('should build a full access key transaction', () => {
    const tx = buildAddKeyTx('alice.near', 'ed25519:newkey');
    expect(tx.actions).toHaveLength(1);
    expect(tx.actions[0].kind).toBe('AddKey');
  });

  it('should build a function-call permission key', () => {
    const tx = buildAddKeyTx('alice.near', 'ed25519:newkey', {
      receiverId: 'contract.near',
      methodNames: ['view'],
      allowance: '1000000000000000000000000',
    });
    const action = tx.actions[0] as unknown;
    expect(action.accessKey.permission).not.toBe('FullAccess');
  });
});

describe('yoctoToNear / nearToYocto', () => {
  it('should convert yoctoNEAR to NEAR', () => {
    expect(yoctoToNear('1000000000000000000000000')).toBe('1');
    expect(yoctoToNear('1234567890123456789012345')).toBe('1.234567890123456789012345');
    expect(yoctoToNear('1000000000000000000000001')).toBe('1.000000000000000000000001');
  });

  it('should convert NEAR to yoctoNEAR', () => {
    expect(nearToYocto('1')).toBe('1000000000000000000000000');
    expect(nearToYocto('1.5')).toBe('1500000000000000000000000');
    expect(nearToYocto('0.001')).toBe('1000000000000000000000');
  });

  it('should round-trip correctly', () => {
    const near = '12.345678901234567890123456';
    expect(yoctoToNear(nearToYocto(near))).toBe('12.345678901234567890123456');
  });
});

describe('buildFtTransferCall', () => {
  it('should build an FT transfer function call', () => {
    const action = buildFtTransferCall('token.near', 'bob.near', '1000000');
    expect(action.kind).toBe('FunctionCall');
    expect(action.contractId).toBe('token.near');
    expect(action.methodName).toBe('ft_transfer');
    expect(JSON.parse(action.args)).toEqual({
      receiver_id: 'bob.near',
      amount: '1000000',
      memo: null,
    });
    expect(action.deposit).toBe('1');
  });
});

describe('buildFtBalanceOfCall', () => {
  it('should build an FT balance query', () => {
    const call = buildFtBalanceOfCall('token.near', 'alice.near');
    expect(call.methodName).toBe('ft_balance_of');
    expect(JSON.parse(call.args)).toEqual({ account_id: 'alice.near' });
  });
});

describe('buildNftTransferCall', () => {
  it('should build an NFT transfer function call', () => {
    const action = buildNftTransferCall('nft.near', 'bob.near', 'token-1');
    expect(action.methodName).toBe('nft_transfer');
    expect(JSON.parse(action.args)).toEqual({
      receiver_id: 'bob.near',
      token_id: 'token-1',
      approval_id: null,
      memo: null,
    });
  });
});

describe('buildNftMintCall', () => {
  it('should build an NFT mint function call', () => {
    const action = buildNftMintCall('nft.near', 'new-token', 'alice.near');
    expect(action.methodName).toBe('nft_mint');
    expect(JSON.parse(action.args).receiver_id).toBe('alice.near');
    expect(action.deposit).toBe('100000000000000000000000');
  });
});

describe('isValidNearAccountId', () => {
  it('should accept valid account IDs', () => {
    expect(isValidNearAccountId('alice.near')).toBe(true);
    expect(isValidNearAccountId('sub.alice.near')).toBe(true);
    expect(isValidNearAccountId('contract.testnet')).toBe(true);
  });

  it('should reject invalid account IDs', () => {
    expect(isValidNearAccountId('a')).toBe(false); // too short
    expect(isValidNearAccountId('alice')).toBe(true); // implicit accounts are valid
    expect(isValidNearAccountId('Alice.near')).toBe(false); // uppercase
    expect(isValidNearAccountId('alice-.near')).toBe(false); // trailing hyphen
  });
});

describe('buildCallFunctionRpc', () => {
  it('should build a call_function RPC payload', () => {
    const rpc = buildCallFunctionRpc('contract.near', 'getBalance', { account: 'alice.near' });
    expect(rpc.method).toBe('query');
    expect(rpc.params.method_name).toBe('getBalance');
    expect(rpc.params.account_id).toBe('contract.near');
  });
});

describe('buildViewAccountRpc', () => {
  it('should build a view_account RPC payload', () => {
    const rpc = buildViewAccountRpc('alice.near');
    expect(rpc.method).toBe('query');
    expect(rpc.params.request_type).toBe('view_account');
    expect(rpc.params.account_id).toBe('alice.near');
  });
});
