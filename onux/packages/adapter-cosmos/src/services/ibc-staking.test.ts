/**
 * Unit tests for adapter-cosmos — IBC, staking, and tx history services.
 */

import { describe, it, expect } from 'vitest';
import {
  buildIbcTransferMsg,
  buildIbcTransferTx,
  parseIbcDenom,
  buildDelegateMsg,
  buildUndelegateMsg,
  buildRedelegateMsg,
  buildWithdrawRewardMsg,
  buildSetWithdrawAddressMsg,
  buildStakingTx,
  buildTxHistoryUrl,
  buildDelegationsUrl,
  buildUnbondingDelegationsUrl,
  buildRewardsUrl,
  buildValidatorsUrl,
  parseTxResponse,
} from './ibc-staking.js';

describe('buildIbcTransferMsg', () => {
  it('should build a valid IBC transfer message', () => {
    const msg = buildIbcTransferMsg('cosmos1sender', {
      sourceChannel: 'channel-0',
      token: { denom: 'uatom', amount: '1000000' },
      receiver: 'osmo1receiver',
    });

    expect(msg.typeUrl).toBe('/ibc.applications.transfer.v1.MsgTransfer');
    expect(msg.value.sourceChannel).toBe('channel-0');
    expect(msg.value.sender).toBe('cosmos1sender');
    expect(msg.value.receiver).toBe('osmo1receiver');
    expect(msg.value.token).toEqual({ denom: 'uatom', amount: '1000000' });
  });

  it('should use custom timeout', () => {
    const msg = buildIbcTransferMsg('cosmos1sender', {
      sourceChannel: 'channel-1',
      token: { denom: 'uosmo', amount: '500' },
      receiver: 'cosmos1receiver',
      timeoutTimestamp: '9999999999999',
      memo: 'test',
    });

    expect(msg.value.timeoutTimestamp).toBe('9999999999999');
    expect(msg.value.memo).toBe('test');
  });
});

describe('buildIbcTransferTx', () => {
  it('should build a transaction wrapping the IBC transfer', () => {
    const tx = buildIbcTransferTx('cosmos1sender', {
      sourceChannel: 'channel-0',
      token: { denom: 'uatom', amount: '1000000' },
      receiver: 'osmo1receiver',
    }, { gas: '800000', amount: [{ denom: 'uatom', amount: '1000' }] });

    expect(tx.messages).toHaveLength(1);
    expect(tx.fee!.gas).toBe('800000');
    expect(tx.fee!.amount[0].denom).toBe('uatom');
  });

  it('should use default fee when not provided', () => {
    const tx = buildIbcTransferTx('cosmos1sender', {
      sourceChannel: 'channel-0',
      token: { denom: 'uatom', amount: '1000000' },
      receiver: 'osmo1receiver',
    });

    expect(tx.fee!.gas).toBe('500000');
    expect(tx.fee!.amount).toEqual([]);
  });
});

describe('parseIbcDenom', () => {
  it('should parse native denom', () => {
    const result = parseIbcDenom('uatom');
    expect(result.type).toBe('native');
    expect(result.baseDenom).toBe('uatom');
  });

  it('should parse IBC hash denom', () => {
    const result = parseIbcDenom('ibc/27394FB092D2ECCD56123C74F36E4C1F926001CEADA9CA97EA622B25F41E5EB2');
    expect(result.type).toBe('ibc');
    expect(result.ibcHash).toBe('27394FB092D2ECCD56123C74F36E4C1F926001CEADA9CA97EA622B25F41E5EB2');
  });

  it('should parse trace denom', () => {
    const result = parseIbcDenom('transfer/channel-0/uatom');
    expect(result.type).toBe('trace');
    expect(result.baseDenom).toBe('uatom');
    expect(result.path).toContain('channel-0');
  });
});

describe('buildDelegateMsg', () => {
  it('should build a delegation message', () => {
    const msg = buildDelegateMsg('cosmos1delegator', {
      validatorAddress: 'cosmosvaloper1validator',
      amount: { denom: 'uatom', amount: '1000000' },
    });

    expect(msg.typeUrl).toBe('/cosmos.staking.v1beta1.MsgDelegate');
    expect(msg.value.delegatorAddress).toBe('cosmos1delegator');
    expect(msg.value.validatorAddress).toBe('cosmosvaloper1validator');
  });
});

describe('buildUndelegateMsg', () => {
  it('should build an undelegation message', () => {
    const msg = buildUndelegateMsg('cosmos1delegator', {
      validatorAddress: 'cosmosvaloper1validator',
      amount: { denom: 'uatom', amount: '500000' },
    });

    expect(msg.typeUrl).toBe('/cosmos.staking.v1beta1.MsgUndelegate');
  });
});

describe('buildRedelegateMsg', () => {
  it('should build a redelegation message', () => {
    const msg = buildRedelegateMsg('cosmos1delegator', {
      validatorSrcAddress: 'cosmosvaloper1src',
      validatorDstAddress: 'cosmosvaloper1dst',
      amount: { denom: 'uatom', amount: '100000' },
    });

    expect(msg.typeUrl).toBe('/cosmos.staking.v1beta1.MsgBeginRedelegate');
  });
});

describe('buildWithdrawRewardMsg', () => {
  it('should build a withdraw rewards message', () => {
    const msg = buildWithdrawRewardMsg('cosmos1delegator', {
      validatorAddress: 'cosmosvaloper1validator',
    });

    expect(msg.typeUrl).toBe('/cosmos.distribution.v1beta1.MsgWithdrawDelegatorReward');
  });
});

describe('buildSetWithdrawAddressMsg', () => {
  it('should build a set withdraw address message', () => {
    const msg = buildSetWithdrawAddressMsg('cosmos1delegator', 'cosmos1newaddress');
    expect(msg.typeUrl).toBe('/cosmos.distribution.v1beta1.MsgSetWithdrawAddress');
  });
});

describe('buildStakingTx', () => {
  it('should build a staking transaction with default fee', () => {
    const tx = buildStakingTx('cosmos1sender', []);
    expect(tx.fee!.gas).toBe('300000');
    expect(tx.memo).toBe('');
  });

  it('should accept custom fee and memo', () => {
    const tx = buildStakingTx('cosmos1sender', [], { gas: '500000', amount: [] }, 'staking');
    expect(tx.fee!.gas).toBe('500000');
    expect(tx.memo).toBe('staking');
  });
});

describe('buildTxHistoryUrl', () => {
  it('should include pagination params', () => {
    const url = buildTxHistoryUrl('https://rest.cosmos.network', {
      address: 'cosmos1test',
      page: 2,
      limit: 20,
    });

    expect(url).toContain('pagination.limit=20');
    expect(url).toContain('pagination.offset=40');
    expect(url).toContain('message.sender');
  });

  it('should use default pagination', () => {
    const url = buildTxHistoryUrl('https://rest.cosmos.network', {
      address: 'cosmos1test',
    });

    expect(url).toContain('pagination.limit=50');
    expect(url).toContain('pagination.offset=0');
    expect(url).toContain('order_by=desc');
  });

  it('should accept custom order', () => {
    const url = buildTxHistoryUrl('https://rest.cosmos.network', {
      address: 'cosmos1test',
      orderBy: 'asc',
    });

    expect(url).toContain('order_by=asc');
  });
});

describe('URL builders', () => {
  const REST = 'https://rest.cosmos.network';
  const ADDR = 'cosmos1test';

  it('buildDelegationsUrl should include address', () => {
    expect(buildDelegationsUrl(REST, ADDR)).toContain(ADDR);
  });

  it('buildUnbondingDelegationsUrl should include address', () => {
    expect(buildUnbondingDelegationsUrl(REST, ADDR)).toContain(ADDR);
  });

  it('buildRewardsUrl should handle optional validator', () => {
    const url1 = buildRewardsUrl(REST, ADDR);
    expect(url1).not.toContain('/rewards/');

    const url2 = buildRewardsUrl(REST, ADDR, 'cosmosvaloper1validator');
    expect(url2).toContain('/rewards/cosmosvaloper1validator');
  });

  it('buildValidatorsUrl should include limit', () => {
    expect(buildValidatorsUrl(REST, 50)).toContain('pagination.limit=50');
  });
});

describe('parseTxResponse', () => {
  it('should parse a successful transaction', () => {
    const data = {
      tx_response: {
        txhash: 'ABC123',
        height: '12345',
        code: 0,
        gas_used: '150000',
        gas_wanted: '200000',
        raw_log: '[]',
        timestamp: '2024-01-01T00:00:00Z',
        tx: {
          body: {
            messages: [{ '@type': '/cosmos.bank.v1beta1.MsgSend', value: {} }],
          },
          auth_info: {
            fee: {
              amount: [{ denom: 'uatom', amount: '500' }],
              gas_limit: '200000',
            },
          },
        },
      },
    };

    const result = parseTxResponse(data);
    expect(result).not.toBeNull();
    expect(result!.txhash).toBe('ABC123');
    expect(result!.code).toBe(0);
    expect(result!.messages).toHaveLength(1);
    expect(result!.fee.amount[0].denom).toBe('uatom');
    expect(result!.timestamp).toBe('2024-01-01T00:00:00Z');
  });

  it('should return null for invalid data', () => {
    expect(parseTxResponse({})).toBeNull();
    expect(parseTxResponse({ foo: 'bar' })).toBeNull();
  });
});
