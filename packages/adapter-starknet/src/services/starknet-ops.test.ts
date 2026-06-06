/**
 * Unit tests for adapter-starknet — advanced Starknet operations.
 */

import { describe, it, expect } from 'vitest';
import {
  buildDeployAccountTx,
  computeAccountAddress,
  buildExecuteTx,
  buildMultiExecuteTx,
  buildCallRpc,
  buildEstimateFeeRpc,
  buildGetNonceRpc,
  buildGetClassHashRpc,
  buildGetStorageAtRpc,
  buildErc20TransferOnStarknet,
  buildErc20ApproveOnStarknet,
  verifyStarknetSignature,
  isValidStarknetSignature,
  parseFeeEstimate,
} from './services/starknet-ops.js';

/* ─────────────────────────────────────────────────────────────── */
/*  Signature Verification                                           */
/* ─────────────────────────────────────────────────────────────── */

describe('verifyStarknetSignature', () => {
  it('should validate format for valid signature', () => {
    const valid = verifyStarknetSignature(
      '0x1234',
      {
        r: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
        s: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
      },
      '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
    );
    expect(valid).toBe(true);
  });

  it('should reject invalid message format', () => {
    const valid = verifyStarknetSignature(
      'invalid',
      { r: '0x1234', s: '0x5678' },
      '0x1234',
    );
    expect(valid).toBe(false);
  });
});

describe('isValidStarknetSignature', () => {
  it('should validate array signature', () => {
    expect(
      isValidStarknetSignature([
        '0x1234',
        '0x5678',
      ]),
    ).toBe(true);
  });

  it('should validate object signature', () => {
    expect(
      isValidStarknetSignature({
        r: '0x1234',
        s: '0x5678',
      }),
    ).toBe(true);
  });

  it('should reject too-short array', () => {
    expect(isValidStarknetSignature(['0x1234'])).toBe(false);
  });
});

/* ─────────────────────────────────────────────────────────────── */
/*  Deploy Account                                                   */
/* ─────────────────────────────────────────────────────────────── */

describe('buildDeployAccountTx', () => {
  it('should build a valid deploy account transaction', () => {
    const tx = buildDeployAccountTx({
      classHash: '0x029927c8ec6b500021e5e80c3e402e7e088a76178cb80c49e286b269314c8826',
      addressSalt: '0x1234',
      constructorCalldata: ['0x1234', '0x0'],
      signature: ['0x111', '0x222'],
      maxFee: '0x523932C4B000',
    });

    expect(tx.type).toBe('DEPLOY_ACCOUNT');
    expect(tx.class_hash).toBe('0x029927c8ec6b500021e5e80c3e402e7e088a76178cb80c49e286b269314c8826');
    expect(tx.signature).toHaveLength(2);
    expect(tx.version).toBe('0x1');
    expect(tx.nonce).toBe('0x0');
  });

  it('should use default max fee when not provided', () => {
    const tx = buildDeployAccountTx({
      classHash: '0x1234',
      addressSalt: '0x5678',
      constructorCalldata: [],
      signature: ['0x1', '0x2'],
    });

    expect(tx.max_fee).toBe('0x523932C4B000');
  });
});

describe('getSelectorFromName', () => {
  it('computes the canonical sn_keccak selector for a function name', async () => {
    const { getSelectorFromName } = await import('../types.js');
    // Known Starknet vector: selector('transfer')
    expect(BigInt(getSelectorFromName('transfer'))).toBe(
      BigInt(
        '0x0083afd3f4caedc6eebf44246fe54e38c95e3179a5ec9ea81740eca5b482d12e',
      ),
    );
  });

  it('passes through an already-numeric felt selector', async () => {
    const { getSelectorFromName } = await import('../types.js');
    expect(BigInt(getSelectorFromName('0x123'))).toBe(0x123n);
  });
});

describe('computeAccountAddress', () => {
  it('should return a deterministic 0x-prefixed Pedersen-derived address', async () => {
    const address = await computeAccountAddress(
      '0x1234',
      '0x5678',
      ['0xabc'],
    );
    expect(address.startsWith('0x')).toBe(true);
    // Deterministic: same inputs must yield the same address.
    const again = await computeAccountAddress('0x1234', '0x5678', ['0xabc']);
    expect(again).toBe(address);
  });
});

/* ─────────────────────────────────────────────────────────────── */
/*  Execute / Call                                                   */
/* ─────────────────────────────────────────────────────────────── */

describe('buildExecuteTx', () => {
  it('should build a single-call execute tx', () => {
    const tx = buildExecuteTx('0xsender', {
      contractAddress: '0xcontract',
      entrypoint: 'transfer',
      calldata: ['0x1', '0x2'],
    });

    expect(tx.type).toBe('INVOKE');
    expect(tx.sender_address).toBe('0xsender');
    expect(tx.version).toBe('0x1');
  });

  it('should build a multi-call execute tx', () => {
    const tx = buildExecuteTx('0xsender', [
      { contractAddress: '0xc1', entrypoint: 'fn1', calldata: [] },
      { contractAddress: '0xc2', entrypoint: 'fn2', calldata: ['0x1'] },
    ]);

    expect(tx.type).toBe('INVOKE');
  });

  it('should accept options', () => {
    const tx = buildExecuteTx('0xsender', {
      contractAddress: '0xcontract',
      entrypoint: 'fn',
      calldata: [],
    }, { maxFee: '0x1000', nonce: '0x5' });

    expect(tx.max_fee).toBe('0x1000');
    expect(tx.nonce).toBe('0x5');
  });
});

describe('buildMultiExecuteTx', () => {
  it('should build a multi-call tx', () => {
    const tx = buildMultiExecuteTx('0xsender', [
      { contractAddress: '0xc1', entrypoint: 'fn1', calldata: ['0x1'] },
    ]);

    expect(tx.type).toBe('INVOKE');
  });
});

describe('buildCallRpc', () => {
  it('should build a starknet_call RPC payload', () => {
    const rpc = buildCallRpc({
      contractAddress: '0xcontract',
      entrypoint: 'balance_of',
      calldata: ['0xuser'],
    });

    expect(rpc.method).toBe('starknet_call');
    expect(rpc.params).toHaveLength(2);
  });

  it('should throw on invalid address', () => {
    expect(() =>
      buildCallRpc({
        contractAddress: 'invalid',
        entrypoint: 'fn',
      }),
    ).toThrow('Invalid contract address');
  });
});

/* ─────────────────────────────────────────────────────────────── */
/*  Fee Estimation                                                   */
/* ─────────────────────────────────────────────────────────────── */

describe('buildEstimateFeeRpc', () => {
  it('should build a starknet_estimateFee RPC payload', () => {
    const rpc = buildEstimateFeeRpc('0xsender', {
      contractAddress: '0xcontract',
      entrypoint: 'fn',
      calldata: [],
    }, '0x1');

    expect(rpc.method).toBe('starknet_estimateFee');
    expect(rpc.params).toHaveLength(2);
  });
});

describe('parseFeeEstimate', () => {
  it('should parse fee data', () => {
    const result = parseFeeEstimate({
      gas_consumed: '0x1000',
      gas_price: '0x100',
      overall_fee: '0x100000',
      unit: 'WEI',
    });

    expect(result.gasConsumed).toBe('0x1000');
    expect(result.overallFee).toBe('0x100000');
    expect(result.unit).toBe('WEI');
  });

  it('should handle missing fields', () => {
    const result = parseFeeEstimate({});
    expect(result.gasConsumed).toBe('0x0');
    expect(result.overallFee).toBe('0x0');
    expect(result.unit).toBe('WEI');
  });
});

/* ─────────────────────────────────────────────────────────────── */
/*  Nonce / Class / Storage                                          */
/* ─────────────────────────────────────────────────────────────── */

describe('buildGetNonceRpc', () => {
  it('should build a starknet_getNonce RPC payload', () => {
    const rpc = buildGetNonceRpc('0xaddress');
    expect(rpc.method).toBe('starknet_getNonce');
  });
});

describe('buildGetClassHashRpc', () => {
  it('should build a starknet_getClassHashAt RPC payload', () => {
    const rpc = buildGetClassHashRpc('0xcontract');
    expect(rpc.method).toBe('starknet_getClassHashAt');
  });
});

describe('buildGetStorageAtRpc', () => {
  it('should build a starknet_getStorageAt RPC payload', () => {
    const rpc = buildGetStorageAtRpc('0xcontract', '0xkey');
    expect(rpc.method).toBe('starknet_getStorageAt');
    expect(rpc.params).toHaveLength(3);
  });
});

/* ─────────────────────────────────────────────────────────────── */
/*  ERC-20 on Starknet                                               */
/* ─────────────────────────────────────────────────────────────── */

describe('buildErc20TransferOnStarknet', () => {
  it('should build a Starknet ERC-20 transfer with u256 split', () => {
    const tx = buildErc20TransferOnStarknet(
      '0xsender',
      '0xtoken',
      '0xrecipient',
      '1000000000000000000', // 1e18
    );

    expect(tx.type).toBe('INVOKE');
    // Calldata should have 3 elements: recipient, low, high
    expect(tx.calldata.length).toBeGreaterThanOrEqual(3);
  });
});

describe('buildErc20ApproveOnStarknet', () => {
  it('should build a Starknet ERC-20 approve', () => {
    const tx = buildErc20ApproveOnStarknet(
      '0xsender',
      '0xtoken',
      '0xspender',
      '500',
    );

    expect(tx.type).toBe('INVOKE');
    expect(tx.calldata.length).toBeGreaterThanOrEqual(3);
  });
});
