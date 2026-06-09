/**
 * NEAR advanced operations — transaction building, function calls, account management, balance.
 *
 * Provides production-ready NEAR Protocol operations:
 * - Transaction building with actions
 * - Function call construction
 * - Account creation and management
 * - Balance queries (native + FT/NFT)
 * - Access key management
 * - NEAR token transfers
 * - FT/NFT standard calls
 */

/* ─────────────────────────────────────────────────────────────── */
/*  NEAR Constants                                                  */
/* ─────────────────────────────────────────────────────────────── */

/** NEAR has 24 decimal places (yoctoNEAR = 10^-24 NEAR). */
export const NEAR_DECIMALS = 24;

/** Default gas for function calls (30 Tgas = 30 * 10^12). */
export const DEFAULT_NEAR_GAS = '30000000000000';

/** Default deposit (0 yoctoNEAR). */
export const DEFAULT_NEAR_DEPOSIT = '0';

/** Minimum NEAR balance for account creation (0.1 NEAR in yoctoNEAR). */
export const MIN_ACCOUNT_BALANCE = '100000000000000000000000';

/** Full access key allowance (0 = unlimited gas). */
export const FULL_ACCESS_KEY_ALLOWANCE = '0';

/* ─────────────────────────────────────────────────────────────── */
/*  Transaction Building                                             */
/* ─────────────────────────────────────────────────────────────── */

/** NEAR action types. */
export type NearActionKind =
  | 'CreateAccount'
  | 'DeployContract'
  | 'FunctionCall'
  | 'Transfer'
  | 'Stake'
  | 'AddKey'
  | 'DeleteKey'
  | 'DeleteAccount';

/** NEAR action. */
export interface NearAction {
  kind: NearActionKind;
  [key: string]: unknown;
}

/** Transfer action. */
export interface NearTransferAction extends NearAction {
  kind: 'Transfer';
  /** Amount in yoctoNEAR. */
  deposit: string;
}

/** Function call action. */
export interface NearFunctionCallAction extends NearAction {
  kind: 'FunctionCall';
  /** Contract to call. */
  contractId: string;
  /** Method name. */
  methodName: string;
  /** Arguments as JSON string. */
  args: string;
  /** Gas limit. */
  gas: string;
  /** Deposit in yoctoNEAR. */
  deposit: string;
}

/** Create account action. */
export interface NearCreateAccountAction extends NearAction {
  kind: 'CreateAccount';
}

/** Deploy contract action. */
export interface NearDeployContractAction extends NearAction {
  kind: 'DeployContract';
  /** WASM code as base64. */
  code: string;
}

/** Add key action. */
export interface NearAddKeyAction extends NearAction {
  kind: 'AddKey';
  /** Public key. */
  publicKey: string;
  /** Access key. */
  accessKey: {
    nonce: number;
    permission:
      | 'FullAccess'
      | { FunctionCall: { allowance: string; receiverId: string; methodNames: string[] } };
  };
}

/** Delete key action. */
export interface NearDeleteKeyAction extends NearAction {
  kind: 'DeleteKey';
  /** Public key to delete. */
  publicKey: string;
}

/** Stake action. */
export interface NearStakeAction extends NearAction {
  kind: 'Stake';
  /** Stake amount in yoctoNEAR. */
  stake: string;
  /** Validator public key. */
  publicKey: string;
}

/** Delete account action. */
export interface NearDeleteAccountAction extends NearAction {
  kind: 'DeleteAccount';
  /** Beneficiary account ID. */
  beneficiaryId: string;
}

/** Complete NEAR transaction. */
export interface NearTransaction {
  /** Signer account ID. */
  signerId: string;
  /** Receiver account ID (first action's target). */
  receiverId: string;
  /** Public key for signing. */
  publicKey: string;
  /** Actions to execute. */
  actions: NearAction[];
  /** Block hash to reference. */
  blockHash?: string;
  /** Nonce for the transaction. */
  nonce?: number;
}

/**
 * Create an empty NEAR transaction template.
 */
export function createTransaction(
  signerId: string,
  receiverId: string,
  publicKey: string,
): NearTransaction {
  return {
    signerId,
    receiverId,
    publicKey,
    actions: [],
  };
}

/**
 * Build a NEAR transfer transaction.
 */
export function buildTransferTx(
  signerId: string,
  receiverId: string,
  publicKey: string,
  amount: string,
): NearTransaction {
  return {
    signerId,
    receiverId,
    publicKey,
    actions: [{ kind: 'Transfer', deposit: amount }],
  };
}

/**
 * Build a NEAR function call transaction.
 */
export function buildFunctionCallTx(
  signerId: string,
  receiverId: string,
  publicKey: string,
  methodName: string,
  args: Record<string, unknown> = {},
  options?: {
    gas?: string;
    deposit?: string;
  },
): NearTransaction {
  return {
    signerId,
    receiverId,
    publicKey,
    actions: [{
      kind: 'FunctionCall',
      contractId: receiverId,
      methodName,
      args: JSON.stringify(args),
      gas: options?.gas ?? DEFAULT_NEAR_GAS,
      deposit: options?.deposit ?? DEFAULT_NEAR_DEPOSIT,
    }],
  };
}

/**
 * Build a multi-action NEAR transaction.
 */
export function buildMultiActionTx(
  signerId: string,
  receiverId: string,
  publicKey: string,
  actions: NearAction[],
): NearTransaction {
  return {
    signerId,
    receiverId,
    publicKey,
    actions,
  };
}

/* ─────────────────────────────────────────────────────────────── */
/*  Account Management                                               */
/* ─────────────────────────────────────────────────────────────── */

/** Account creation parameters. */
export interface NearCreateAccountParams {
  /** New account ID. */
  newAccountId: string;
  /** Initial balance in yoctoNEAR. */
  initialBalance: string;
  /** Public key for the new account. */
  publicKey: string;
}

/**
 * Build a create account + transfer transaction.
 *
 * Creates a new NEAR account by:
 * 1. Creating the account (CreateAccount action)
 * 2. Transferring initial balance (Transfer action)
 * 3. Adding a full access key (AddKey action)
 */
export function buildCreateAccountTx(
  signerId: string,
  params: NearCreateAccountParams,
): NearTransaction {
  return {
    signerId,
    receiverId: params.newAccountId,
    publicKey: params.publicKey,
    actions: [
      { kind: 'CreateAccount' },
      { kind: 'Transfer', deposit: params.initialBalance },
      {
        kind: 'AddKey',
        publicKey: params.publicKey,
        accessKey: {
          nonce: 0,
          permission: 'FullAccess',
        },
      },
    ],
  };
}

/**
 * Build an add access key transaction.
 */
export function buildAddKeyTx(
  signerId: string,
  publicKey: string,
  permission: 'FullAccess' | {
    receiverId: string;
    methodNames: string[];
    allowance?: string;
  } = 'FullAccess',
): NearTransaction {
  const accessKeyPermission = typeof permission === 'string'
    ? 'FullAccess'
    : {
        FunctionCall: {
          allowance: permission.allowance ?? FULL_ACCESS_KEY_ALLOWANCE,
          receiverId: permission.receiverId,
          methodNames: permission.methodNames,
        },
      };

  return {
    signerId,
    receiverId: signerId,
    publicKey,
    actions: [{
      kind: 'AddKey',
      publicKey,
      accessKey: { nonce: 0, permission: accessKeyPermission },
    }],
  };
}

/**
 * Build a delete key transaction.
 */
export function buildDeleteKeyTx(
  signerId: string,
  publicKey: string,
): NearTransaction {
  return {
    signerId,
    receiverId: signerId,
    publicKey,
    actions: [{ kind: 'DeleteKey', publicKey }],
  };
}

/**
 * Build a stake transaction.
 */
export function buildStakeTx(
  signerId: string,
  publicKey: string,
  stakeAmount: string,
): NearTransaction {
  return {
    signerId,
    receiverId: signerId,
    publicKey,
    actions: [{ kind: 'Stake', stake: stakeAmount, publicKey }],
  };
}

/**
 * Build a delete account transaction.
 */
export function buildDeleteAccountTx(
  signerId: string,
  publicKey: string,
  beneficiaryId: string,
): NearTransaction {
  return {
    signerId,
    receiverId: signerId,
    publicKey,
    actions: [{ kind: 'DeleteAccount', beneficiaryId }],
  };
}

/* ─────────────────────────────────────────────────────────────── */
/*  Balance Queries                                                  */
/* ─────────────────────────────────────────────────────────────── */

/** NEAR account balance. */
export interface NearAccountBalance {
  /** Total balance in yoctoNEAR. */
  total: string;
  /** State storage staked in yoctoNEAR. */
  stateStaked: string;
  /** Available (liquid) balance in yoctoNEAR. */
  available: string;
  /** Staked with validators in yoctoNEAR. */
  staked: string;
}

/**
 * Build a view_account RPC call.
 */
export function buildViewAccountRpc(accountId: string): {
  method: string;
  params: Record<string, unknown>;
} {
  return {
    method: 'query',
    params: {
      request_type: 'view_account',
      finality: 'final',
      account_id: accountId,
    },
  };
}

/**
 * Parse account balance from RPC response.
 */
export function parseAccountBalance(data: Record<string, unknown>): NearAccountBalance {
  const result = data.result as Record<string, unknown> | undefined;
  if (!result) {
    return { total: '0', stateStaked: '0', available: '0', staked: '0' };
  }

  const total = (result.amount as string) ?? '0';
  const stateStaked = (result.storage_usage as string) ?? '0';

  return {
    total,
    stateStaked,
    available: total, // simplified — in production, subtract storage + locked
    staked: '0', // requires staking contract query
  };
}

/**
 * Convert yoctoNEAR to NEAR (decimal string).
 */
export function yoctoToNear(yocto: string | number): string {
  const str = String(yocto);
  const padded = str.padStart(NEAR_DECIMALS + 1, '0');
  const integerPart = padded.slice(0, padded.length - NEAR_DECIMALS) || '0';
  const fractionalPart = padded.slice(padded.length - NEAR_DECIMALS);
  const trimmedFraction = fractionalPart.replace(/0+$/, '');

  if (trimmedFraction.length === 0) {
    return integerPart;
  }

  return `${integerPart}.${trimmedFraction}`;
}

/**
 * Convert NEAR to yoctoNEAR.
 */
export function nearToYocto(near: string | number): string {
  const str = String(near);
  const [intPart, fracPart] = str.split('.');

  const intYocto = BigInt(intPart || '0') * 10n ** BigInt(NEAR_DECIMALS);

  let fracYocto = 0n;
  if (fracPart) {
    const padded = fracPart.padEnd(NEAR_DECIMALS, '0').slice(0, NEAR_DECIMALS);
    fracYocto = BigInt(padded);
  }

  return (intYocto + fracYocto).toString();
}

/* ─────────────────────────────────────────────────────────────── */
/*  FT / NFT Standard Calls                                          */
/* ─────────────────────────────────────────────────────────────── */

/**
 * Build an FT transfer function call.
 *
 * @see https://github.com/near/NEPs/blob/master/neps/nep-0141.md
 */
export function buildFtTransferCall(
  contractId: string,
  receiverId: string,
  amount: string,
  memo?: string,
  gas?: string,
): NearFunctionCallAction {
  return {
    kind: 'FunctionCall',
    contractId,
    methodName: 'ft_transfer',
    args: JSON.stringify({
      receiver_id: receiverId,
      amount,
      memo: memo ?? null,
    }),
    gas: gas ?? DEFAULT_NEAR_GAS,
    deposit: '1', // 1 yoctoNEAR (required for FT transfer)
  };
}

/**
 * Build an FT transfer call with callback.
 *
 * @see https://github.com/near/NEPs/blob/master/neps/nep-0141.md
 */
export function buildFtTransferCallWithCallback(
  contractId: string,
  receiverId: string,
  amount: string,
  callbackContractId: string,
  memo?: string,
  gas?: string,
): NearTransaction {
  return {
    signerId: contractId, // will be overridden by caller
    receiverId: contractId,
    publicKey: '', // will be overridden by caller
    actions: [
      {
        kind: 'FunctionCall',
        contractId,
        methodName: 'ft_transfer_call',
        args: JSON.stringify({
          receiver_id: receiverId,
          amount,
          msg: memo ?? '',
          memo: memo ?? null,
        }),
        gas: gas ?? '100000000000000', // 100 Tgas for callback
        deposit: '1',
      },
    ],
  };
}

/**
 * Build an FT balance query function call.
 */
export function buildFtBalanceOfCall(
  contractId: string,
  accountId: string,
): { contractId: string; methodName: string; args: string } {
  return {
    contractId,
    methodName: 'ft_balance_of',
    args: JSON.stringify({ account_id: accountId }),
  };
}

/**
 * Build an NFT transfer function call.
 *
 * @see https://github.com/near/NEPs/blob/master/neps/nep-0171.md
 */
export function buildNftTransferCall(
  contractId: string,
  receiverId: string,
  tokenId: string,
  approvalId?: number,
  memo?: string,
  gas?: string,
): NearFunctionCallAction {
  return {
    kind: 'FunctionCall',
    contractId,
    methodName: 'nft_transfer',
    args: JSON.stringify({
      receiver_id: receiverId,
      token_id: tokenId,
      approval_id: approvalId ?? null,
      memo: memo ?? null,
    }),
    gas: gas ?? DEFAULT_NEAR_GAS,
    deposit: '1',
  };
}

/**
 * Build an NFT mint function call.
 */
export function buildNftMintCall(
  contractId: string,
  tokenId: string,
  receiverId: string,
  tokenMetadata?: Record<string, unknown>,
  perpetualRoyalties?: Record<string, number>,
  gas?: string,
): NearFunctionCallAction {
  return {
    kind: 'FunctionCall',
    contractId,
    methodName: 'nft_mint',
    args: JSON.stringify({
      token_id: tokenId,
      receiver_id: receiverId,
      token_metadata: tokenMetadata ?? null,
      perpetual_royalties: perpetualRoyalties ?? null,
    }),
    gas: gas ?? '100000000000000', // 100 Tgas
    deposit: '100000000000000000000000', // 0.1 NEAR deposit
  };
}

/**
 * Build an NFT token query function call.
 */
export function buildNftTokenCall(
  contractId: string,
  tokenId: string,
): { contractId: string; methodName: string; args: string } {
  return {
    contractId,
    methodName: 'nft_token',
    args: JSON.stringify({ token_id: tokenId }),
  };
}

/* ─────────────────────────────────────────────────────────────── */
/*  RPC Call Builders                                                */
/* ─────────────────────────────────────────────────────────────── */

/**
 * Build a call_function RPC call (read-only).
 */
export function buildCallFunctionRpc(
  contractId: string,
  methodName: string,
  args: Record<string, unknown> = {},
): {
  method: string;
  params: Record<string, unknown>;
} {
  return {
    method: 'query',
    params: {
      request_type: 'call_function',
      finality: 'final',
      account_id: contractId,
      method_name: methodName,
      args_base64: Buffer.from(JSON.stringify(args)).toString('base64'),
    },
  };
}

/**
 * Build a send_transaction RPC call.
 */
export function buildSendTransactionRpc(
  signedTxBase64: string,
): {
  method: string;
  params: Record<string, unknown>;
} {
  return {
    method: 'broadcast_tx_commit',
    params: {
      signed_tx_base64: signedTxBase64,
    },
  };
}

/**
 * Build an access_key query RPC call.
 */
export function buildAccessKeyRpc(
  accountId: string,
  publicKey: string,
): {
  method: string;
  params: Record<string, unknown>;
} {
  return {
    method: 'query',
    params: {
      request_type: 'view_access_key',
      finality: 'final',
      account_id: accountId,
      public_key: publicKey,
    },
  };
}

/**
 * Build an access_key_list query RPC call.
 */
export function buildAccessKeyListRpc(
  accountId: string,
): {
  method: string;
  params: Record<string, unknown>;
} {
  return {
    method: 'query',
    params: {
      request_type: 'view_access_key_list',
      finality: 'final',
      account_id: accountId,
    },
  };
}

/* ─────────────────────────────────────────────────────────────── */
/*  Account ID Validation                                            */
/* ─────────────────────────────────────────────────────────────── */

/**
 * Validate a NEAR account ID.
 *
 * Rules:
 * - 2-64 characters
 * - Lowercase alphanumeric and hyphens
 * - Segments separated by dots
 * - Each segment: starts/ends with alphanumeric, can contain hyphens
 */
export function isValidNearAccountId(accountId: string): boolean {
  if (accountId.length < 2 || accountId.length > 64) return false;
  return /^[a-z0-9]([a-z0-9\-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9\-]*[a-z0-9])?)*$/.test(accountId);
}
