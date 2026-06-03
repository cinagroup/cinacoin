/**
 * Cosmos IBC cross-chain transfers, Staking/Delegation/Unbonding, and Transaction History.
 *
 * Compatible with Cosmos SDK chains: Cosmos Hub, Osmosis, Injective, Celestia, etc.
 * Uses the Keplr/Leap connectors for signing and broadcasting.
 */

import type { Coin, CosmosMsg, CosmosFee, CosmosTransaction } from '../types.js';

/* ─────────────────────────────────────────────────────────────── */
/*  IBC Cross-Chain Transfer                                        */
/* ─────────────────────────────────────────────────────────────── */

/** IBC transfer parameters. */
export interface IbcTransferParams {
  /** Source port (usually "transfer"). */
  sourcePort?: string;
  /** Source channel ID (e.g. "channel-0"). */
  sourceChannel: string;
  /** Token to transfer. */
  token: Coin;
  /** Receiver address on the destination chain. */
  receiver: string;
  /** Timeout block height. */
  timeoutHeight?: { revisionNumber: string; revisionHeight: string };
  /** Timeout timestamp in nanoseconds. */
  timeoutTimestamp?: string;
  /** Optional memo. */
  memo?: string;
}

/**
 * Build an IBC transfer message.
 */
export function buildIbcTransferMsg(sender: string, params: IbcTransferParams): CosmosMsg {
  return {
    typeUrl: '/ibc.applications.transfer.v1.MsgTransfer',
    value: {
      sourcePort: params.sourcePort ?? 'transfer',
      sourceChannel: params.sourceChannel,
      token: params.token,
      sender,
      receiver: params.receiver,
      timeoutHeight: params.timeoutHeight ?? {
        revisionNumber: '0',
        revisionHeight: '0',
      },
      timeoutTimestamp: params.timeoutTimestamp ?? String(
        (Date.now() + 10 * 60 * 1000) * 1_000_000, // 10 min from now in ns
      ),
      memo: params.memo ?? '',
    },
  };
}

/**
 * Build a full IBC transfer transaction.
 */
export function buildIbcTransferTx(
  sender: string,
  params: IbcTransferParams,
  fee?: CosmosFee,
): CosmosTransaction {
  return {
    messages: [buildIbcTransferMsg(sender, params)],
    fee: fee ?? { gas: '500000', amount: [] },
    memo: params.memo ?? '',
  };
}

/**
 * Parse an IBC denom to determine its origin.
 *
 * Returns:
 * - type: 'native' for native chain tokens
 * - type: 'ibc' for tokens received via IBC (hash-based)
 * - type: 'trace' for tokens with a known transfer path
 */
export function parseIbcDenom(denom: string): {
  type: 'native' | 'ibc' | 'trace';
  /** IBC hash (for ibc/xxx tokens). */
  ibcHash?: string;
  /** Transfer path channels. */
  path?: string[];
  /** Base denomination. */
  baseDenom?: string;
} {
  if (denom.startsWith('ibc/')) {
    return { type: 'ibc', ibcHash: denom.slice(4) };
  }

  if (denom.startsWith('transfer/')) {
    const parts = denom.split('/');
    const baseDenom = parts[parts.length - 1];
    const path = parts.slice(1, -1);
    return { type: 'trace', path, baseDenom };
  }

  return { type: 'native', baseDenom: denom };
}

/* ─────────────────────────────────────────────────────────────── */
/*  Staking / Delegation / Unbonding                                */
/* ─────────────────────────────────────────────────────────────── */

/** Delegation parameters. */
export interface DelegateParams {
  /** Validator operator address (e.g. "cosmosvaloper1..."). */
  validatorAddress: string;
  /** Amount to delegate. */
  amount: Coin;
}

/** Undelegation (unbonding) parameters. */
export interface UndelegateParams {
  /** Validator operator address. */
  validatorAddress: string;
  /** Amount to undelegate. */
  amount: Coin;
}

/** Redelegation parameters. */
export interface RedelegateParams {
  /** Source validator address. */
  validatorSrcAddress: string;
  /** Destination validator address. */
  validatorDstAddress: string;
  /** Amount to redelegate. */
  amount: Coin;
}

/** Withdraw rewards parameters. */
export interface WithdrawRewardParams {
  /** Validator address to withdraw from. */
  validatorAddress: string;
}

/**
 * Build a delegation message.
 */
export function buildDelegateMsg(
  delegatorAddress: string,
  params: DelegateParams,
): CosmosMsg {
  return {
    typeUrl: '/cosmos.staking.v1beta1.MsgDelegate',
    value: {
      delegatorAddress,
      validatorAddress: params.validatorAddress,
      amount: params.amount,
    },
  };
}

/**
 * Build an undelegation message (starts the unbonding period).
 */
export function buildUndelegateMsg(
  delegatorAddress: string,
  params: UndelegateParams,
): CosmosMsg {
  return {
    typeUrl: '/cosmos.staking.v1beta1.MsgUndelegate',
    value: {
      delegatorAddress,
      validatorAddress: params.validatorAddress,
      amount: params.amount,
    },
  };
}

/**
 * Build a redelegation message.
 */
export function buildRedelegateMsg(
  delegatorAddress: string,
  params: RedelegateParams,
): CosmosMsg {
  return {
    typeUrl: '/cosmos.staking.v1beta1.MsgBeginRedelegate',
    value: {
      delegatorAddress,
      validatorSrcAddress: params.validatorSrcAddress,
      validatorDstAddress: params.validatorDstAddress,
      amount: params.amount,
    },
  };
}

/**
 * Build a withdraw rewards message.
 */
export function buildWithdrawRewardMsg(
  delegatorAddress: string,
  params: WithdrawRewardParams,
): CosmosMsg {
  return {
    typeUrl: '/cosmos.distribution.v1beta1.MsgWithdrawDelegatorReward',
    value: {
      delegatorAddress,
      validatorAddress: params.validatorAddress,
    },
  };
}

/**
 * Build a set withdraw address message.
 */
export function buildSetWithdrawAddressMsg(
  delegatorAddress: string,
  withdrawAddress: string,
): CosmosMsg {
  return {
    typeUrl: '/cosmos.distribution.v1beta1.MsgSetWithdrawAddress',
    value: {
      delegatorAddress,
      withdrawAddress,
    },
  };
}

/**
 * Build a staking transaction.
 */
export function buildStakingTx(
  sender: string,
  messages: CosmosMsg[],
  fee?: CosmosFee,
  memo?: string,
): CosmosTransaction {
  return {
    messages,
    fee: fee ?? { gas: '300000', amount: [] },
    memo: memo ?? '',
  };
}

/* ─────────────────────────────────────────────────────────────── */
/*  Transaction History                                             */
/* ─────────────────────────────────────────────────────────────── */

/** Transaction record from Cosmos REST API. */
export interface TxRecord {
  /** Transaction hash. */
  txhash: string;
  /** Block height. */
  height: string;
  /** Code (0 = success). */
  code: number;
  /** Raw log. */
  rawLog: string;
  /** Gas used. */
  gasUsed: string;
  /** Gas wanted. */
  gasWanted: string;
  /** Fee paid. */
  fee: { amount: Coin[]; gasLimit: string };
  /** Messages in the transaction. */
  messages: Array<{ typeUrl: string; value: Record<string, unknown> }>;
  /** Timestamp (ISO). */
  timestamp?: string;
}

/** Paginated query result. */
export interface PaginatedResult<T> {
  items: T[];
  nextKey: string | null;
  total: string;
}

/** Query parameters for transaction history. */
export interface TxHistoryParams {
  /** Account address. */
  address: string;
  /** Page number (0-based). */
  page?: number;
  /** Results per page. */
  limit?: number;
  /** Sort order. */
  orderBy?: 'asc' | 'desc';
}

/**
 * Build the REST URL for transaction history queries.
 */
export function buildTxHistoryUrl(
  restUrl: string,
  params: TxHistoryParams,
): string {
  const page = params.page ?? 0;
  const limit = params.limit ?? 50;
  const offset = page * limit;
  const order = params.orderBy ?? 'desc';

  const url = new URL('/cosmos/tx/v1beta1/txs', restUrl);
  url.searchParams.set('events', `message.sender='${params.address}'`);
  url.searchParams.set('pagination.limit', String(limit));
  url.searchParams.set('pagination.offset', String(offset));
  url.searchParams.set('order_by', order);

  return url.toString();
}

/**
 * Build the REST URL for delegation queries.
 */
export function buildDelegationsUrl(restUrl: string, delegator: string): string {
  return `${restUrl}/cosmos/staking/v1beta1/delegations/${delegator}`;
}

/**
 * Build the REST URL for unbonding delegations.
 */
export function buildUnbondingDelegationsUrl(restUrl: string, delegator: string): string {
  return `${restUrl}/cosmos/staking/v1beta1/delegators/${delegator}/unbonding_delegations`;
}

/**
 * Build the REST URL for rewards queries.
 */
export function buildRewardsUrl(restUrl: string, delegator: string, validator?: string): string {
  if (validator) {
    return `${restUrl}/cosmos/distribution/v1beta1/delegators/${delegator}/rewards/${validator}`;
  }
  return `${restUrl}/cosmos/distribution/v1beta1/delegators/${delegator}/rewards`;
}

/**
 * Build the REST URL for validators list.
 */
export function buildValidatorsUrl(restUrl: string, limit: number = 100): string {
  return `${restUrl}/cosmos/staking/v1beta1/validators?pagination.limit=${limit}`;
}

/**
 * Parse a Cosmos REST API transaction response.
 */
export function parseTxResponse(data: Record<string, unknown>): TxRecord | null {
  const txResponse = data.tx_response as Record<string, unknown> | undefined;
  if (!txResponse) return null;

  const tx = txResponse.tx as Record<string, unknown> | undefined;
  const body = tx?.body as Record<string, unknown> | undefined;
  const authInfo = tx?.auth_info as Record<string, unknown> | undefined;
  const feeData = authInfo?.fee as Record<string, unknown> | undefined;

  const messages = (body?.messages as unknown[] | undefined ?? [])
    .map((m: Record<string, unknown>) => ({
      typeUrl: (m['@type'] as string) ?? (m.type_url as string) ?? '',
      value: (m.value as Record<string, unknown>) ?? m,
    }));

  return {
    txhash: (txResponse.txhash as string) ?? '',
    height: (txResponse.height as string) ?? '0',
    code: (txResponse.code as number) ?? 1,
    rawLog: (txResponse.raw_log as string) ?? '',
    gasUsed: (txResponse.gas_used as string) ?? '0',
    gasWanted: (txResponse.gas_wanted as string) ?? '0',
    timestamp: txResponse.timestamp as string | undefined,
    fee: {
      amount: (feeData?.amount as Coin[]) ?? [],
      gasLimit: (feeData?.gas_limit as string) ?? '0',
    },
    messages,
  };
}

/* ─────────────────────────────────────────────────────────────── */
/*  Adapter-level types (CosmosTxRecord, CosmosTxHistory, etc.)     */
/* ─────────────────────────────────────────────────────────────── */

/** Normalized transaction record used by CosmosAdapter. */
export interface CosmosTxRecord {
  txhash: string;
  height: string;
  code: number;
  rawLog: string;
  gasUsed: string;
  gasWanted: string;
  fee: { amount: Coin[]; gasLimit: string };
  messages: Array<{ typeUrl: string; value: Record<string, unknown> }>;
  timestamp?: string;
}

/** Pagination info. */
export interface Pagination {
  nextKey: string | null;
  total: string;
}

/** Paginated transaction history result. */
export interface CosmosTxHistory {
  transactions: CosmosTxRecord[];
  pagination: Pagination;
}

/** Query parameters for CosmosAdapter.getTransactionHistory. */
export interface TxHistoryQuery {
  address?: string;
  page?: number;
  limit?: number;
  orderBy?: 'asc' | 'desc';
}

/**
 * Alias: parseTxRecord = parseTxResponse (for backward compatibility).
 */
export function parseTxRecord(data: Record<string, unknown>): CosmosTxRecord | null {
  return parseTxResponse(data) as CosmosTxRecord | null;
}
