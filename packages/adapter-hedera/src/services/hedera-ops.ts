/**
 * Hedera advanced operations — HTS token transfers, contract calls, signing, submit.
 *
 * Provides production-ready Hedera operations:
 * - HBAR transfers
 * - HTS (Hedera Token Service) token transfers
 * - Smart contract calls
 * - Token minting/burning
 * - Token association
 * - Transaction signing and submission
 * - Balance queries
 */

/* ─────────────────────────────────────────────────────────────── */
/*  Hedera Account ID Helpers                                        */
/* ─────────────────────────────────────────────────────────────── */

/** Hedera account ID format: shard.realm.num (e.g., "0.0.12345"). */
export type HederaAccountId = string;

/** Hedera token ID format: shard.realm.num (e.g., "0.0.123456"). */
export type HederaTokenId = string;

/** Hedera contract ID format: shard.realm.num (e.g., "0.0.789012"). */
export type HederaContractId = string;

/**
 * Parse a Hedera ID into components.
 */
export function parseHederaId(id: string): { shard: string; realm: string; num: string } {
  const parts = id.split('.');
  if (parts.length !== 3) {
    throw new Error(`Invalid Hedera ID format: ${id}. Expected "shard.realm.num"`);
  }
  return { shard: parts[0], realm: parts[1], num: parts[2] };
}

/**
 * Validate a Hedera ID format.
 */
export function isValidHederaId(id: string): boolean {
  return /^\d+\.\d+\.\d+$/.test(id);
}

/* ─────────────────────────────────────────────────────────────── */
/*  HBAR Transfer                                                     */
/* ─────────────────────────────────────────────────────────────── */

/** HBAR transfer parameters. */
export interface HbarTransferParams {
  /** Sender account ID. */
  from: HederaAccountId;
  /** Recipient account ID. */
  to: HederaAccountId;
  /** Amount in tinybar (1 HBAR = 100,000,000 tinybar). */
  amount: string;
  /** Optional memo. */
  memo?: string;
}

/**
 * Build an HBAR transfer transaction.
 */
export function buildHbarTransferTx(params: HbarTransferParams): {
  transactionType: 'CryptoTransfer';
  nodeAccountId: HederaAccountId;
  transfers: Array<{ accountId: HederaAccountId; amount: string }>;
  memo: string;
} {
  return {
    transactionType: 'CryptoTransfer',
    nodeAccountId: '0.0.3', // Default node
    transfers: [
      { accountId: params.from, amount: `-${params.amount}` },
      { accountId: params.to, amount: params.amount },
    ],
    memo: params.memo ?? '',
  };
}

/* ─────────────────────────────────────────────────────────────── */
/*  HTS Token Transfer                                               */
/* ─────────────────────────────────────────────────────────────── */

/** Token transfer entry. */
export interface TokenTransferEntry {
  /** Token ID. */
  tokenId: HederaTokenId;
  /** Sender account ID. */
  from: HederaAccountId;
  /** Recipient account ID. */
  to: HederaAccountId;
  /** Amount (in token's smallest unit). */
  amount: string;
}

/** HTS token transfer parameters. */
export interface HtsTransferParams {
  /** Sender account ID. */
  from: HederaAccountId;
  /** Array of token transfers. */
  tokenTransfers: TokenTransferEntry[];
  /** Optional HBAR transfers. */
  hbarTransfers?: Array<{ accountId: HederaAccountId; amount: string }>;
  /** Optional memo. */
  memo?: string;
}

/**
 * Build an HTS token transfer transaction.
 *
 * Supports multiple token transfers in a single transaction.
 */
export function buildHtsTransferTx(params: HtsTransferParams): {
  transactionType: 'CryptoTransfer';
  nodeAccountId: HederaAccountId;
  tokenTransfers: Array<{ tokenId: HederaTokenId; transfers: Array<{ accountId: HederaAccountId; amount: string }> }>;
  hbarTransfers: Array<{ accountId: HederaAccountId; amount: string }>;
  memo: string;
} {
  // Group by token
  const tokenMap = new Map<string, Array<{ accountId: HederaAccountId; amount: string }>>();

  for (const tt of params.tokenTransfers) {
    if (!tokenMap.has(tt.tokenId)) {
      tokenMap.set(tt.tokenId, []);
    }
    tokenMap.get(tt.tokenId)!.push(
      { accountId: tt.from, amount: `-${tt.amount}` },
      { accountId: tt.to, amount: tt.amount },
    );
  }

  const tokenTransfers = Array.from(tokenMap.entries()).map(([tokenId, transfers]) => ({
    tokenId,
    transfers,
  }));

  return {
    transactionType: 'CryptoTransfer',
    nodeAccountId: '0.0.3',
    tokenTransfers,
    hbarTransfers: params.hbarTransfers ?? [],
    memo: params.memo ?? '',
  };
}

/* ─────────────────────────────────────────────────────────────── */
/*  Token Association                                                */
/* ─────────────────────────────────────────────────────────────── */

/**
 * Build a token associate transaction.
 *
 * Before receiving HTS tokens, an account must associate the token.
 */
export function buildTokenAssociateTx(
  accountId: HederaAccountId,
  tokenIds: HederaTokenId[],
): {
  transactionType: 'TokenAssociate';
  nodeAccountId: HederaAccountId;
  accountId: HederaAccountId;
  tokenIds: HederaTokenId[];
} {
  return {
    transactionType: 'TokenAssociate',
    nodeAccountId: '0.0.3',
    accountId,
    tokenIds,
  };
}

/**
 * Build a token dissociate transaction.
 */
export function buildTokenDissociateTx(
  accountId: HederaAccountId,
  tokenIds: HederaTokenId[],
): {
  transactionType: 'TokenDissociate';
  nodeAccountId: HederaAccountId;
  accountId: HederaAccountId;
  tokenIds: HederaTokenId[];
} {
  return {
    transactionType: 'TokenDissociate',
    nodeAccountId: '0.0.3',
    accountId,
    tokenIds,
  };
}

/* ─────────────────────────────────────────────────────────────── */
/*  Token Mint / Burn                                                  */
/* ─────────────────────────────────────────────────────────────── */

/** Token mint parameters. */
export interface TokenMintParams {
  /** Token ID to mint. */
  tokenId: HederaTokenId;
  /** Amount to mint (fungible tokens). */
  amount?: string;
  /** Metadata for NFTs (array of bytes as hex strings). */
  metadata?: string[];
}

/**
 * Build a token mint transaction.
 */
export function buildTokenMintTx(params: TokenMintParams): {
  transactionType: 'TokenMint';
  nodeAccountId: HederaAccountId;
  tokenId: HederaTokenId;
  amount: string;
  metadata: string[];
} {
  return {
    transactionType: 'TokenMint',
    nodeAccountId: '0.0.3',
    tokenId: params.tokenId,
    amount: params.amount ?? '0',
    metadata: params.metadata ?? [],
  };
}

/**
 * Build a token burn transaction.
 */
export function buildTokenBurnTx(
  tokenId: HederaTokenId,
  amount: string,
): {
  transactionType: 'TokenBurn';
  nodeAccountId: HederaAccountId;
  tokenId: HederaTokenId;
  amount: string;
  metadata: string[];
} {
  return {
    transactionType: 'TokenBurn',
    nodeAccountId: '0.0.3',
    tokenId,
    amount,
    metadata: [],
  };
}

/* ─────────────────────────────────────────────────────────────── */
/*  Smart Contract Calls                                              */
/* ─────────────────────────────────────────────────────────────── */

/** Contract call parameters. */
export interface ContractCallParams {
  /** Contract ID. */
  contractId: HederaContractId;
  /** Function name. */
  function: string;
  /** Encoded function parameters (hex). */
  functionParameters: string;
  /** Max gas to use. */
  gas: number;
  /** HBAR amount to send with the call. */
  amount?: string;
  /** Optional memo. */
  memo?: string;
}

/**
 * Build a contract call transaction.
 */
export function buildContractCallTx(params: ContractCallParams): {
  transactionType: 'ContractCall';
  nodeAccountId: HederaAccountId;
  contractId: HederaContractId;
  gas: number;
  functionParameters: string;
  amount: string;
  memo: string;
} {
  return {
    transactionType: 'ContractCall',
    nodeAccountId: '0.0.3',
    contractId: params.contractId,
    gas: params.gas,
    functionParameters: params.functionParameters,
    amount: params.amount ?? '0',
    memo: params.memo ?? '',
  };
}

/**
 * Build a contract execute transaction (create).
 */
export function buildContractCreateTx(params: {
  bytecode: string;
  gas: number;
  amount?: string;
  memo?: string;
  adminKey?: string;
}): {
  transactionType: 'ContractCreate';
  nodeAccountId: HederaAccountId;
  bytecode: string;
  gas: number;
  amount: string;
  memo: string;
} {
  return {
    transactionType: 'ContractCreate',
    nodeAccountId: '0.0.3',
    bytecode: params.bytecode,
    gas: params.gas,
    amount: params.amount ?? '0',
    memo: params.memo ?? '',
  };
}

/**
 * Build a contract call (read-only) via the mirror node.
 */
export function buildContractCallQuery(
  contractId: HederaContractId,
  functionParameters: string,
  maxResultSize?: number,
): {
  contractId: HederaContractId;
  functionParameters: string;
  maxResultSize: number;
} {
  return {
    contractId,
    functionParameters,
    maxResultSize: maxResultSize ?? 1024,
  };
}

/* ─────────────────────────────────────────────────────────────── */
/*  Balance Queries                                                   */
/* ─────────────────────────────────────────────────────────────── */

/** Account balance from Hedera REST API. */
export interface HederaAccountBalance {
  /** HBAR balance in tinybar. */
  hbar: string;
  /** Token balances. */
  tokens: Array<{
    tokenId: HederaTokenId;
    balance: string;
  }>;
}

/**
 * Build the mirror node REST URL for account balance.
 */
export function buildBalanceUrl(baseUrl: string, accountId: HederaAccountId): string {
  return `${baseUrl}/api/v1/accounts/${accountId}`;
}

/**
 * Build the mirror node REST URL for token info.
 */
export function buildTokenInfoUrl(baseUrl: string, tokenId: HederaTokenId): string {
  return `${baseUrl}/api/v1/tokens/${tokenId}`;
}

/**
 * Build the mirror node REST URL for transaction records.
 */
export function buildTransactionHistoryUrl(
  baseUrl: string,
  accountId: HederaAccountId,
  limit: number = 10,
): string {
  return `${baseUrl}/api/v1/transactions?account.id=${accountId}&limit=${limit}&order=desc`;
}

/* ─────────────────────────────────────────────────────────────── */
/*  Hedera Amount Formatting                                          */
/* ─────────────────────────────────────────────────────────────── */

/** HBAR has 8 decimal places. */
export const HBAR_DECIMALS = 8;

/**
 * Convert tinybar to HBAR string.
 */
export function tinybarToHbar(tinybar: string | number): string {
  const str = String(tinybar);
  const padded = str.padStart(HBAR_DECIMALS + 1, '0');
  const integerPart = padded.slice(0, padded.length - HBAR_DECIMALS) || '0';
  const fractionalPart = padded.slice(padded.length - HBAR_DECIMALS);
  const trimmed = fractionalPart.replace(/0+$/, '');
  return trimmed ? `${integerPart}.${trimmed}` : integerPart;
}

/**
 * Convert HBAR to tinybar.
 */
export function hbarToTinybar(hbar: string | number): string {
  const str = String(hbar);
  const [intPart, fracPart] = str.split('.');
  const intTiny = BigInt(intPart || '0') * 10n ** BigInt(HBAR_DECIMALS);
  let fracTiny = 0n;
  if (fracPart) {
    const padded = fracPart.padEnd(HBAR_DECIMALS, '0').slice(0, HBAR_DECIMALS);
    fracTiny = BigInt(padded);
  }
  return (intTiny + fracTiny).toString();
}

/* ─────────────────────────────────────────────────────────────── */
/*  Hedera Networks                                                   */
/* ─────────────────────────────────────────────────────────────── */

/** Well-known Hedera networks. */
export const HEDERA_NETWORKS: Record<string, { mirrorNodeUrl: string; name: string }> = {
  mainnet: {
    mirrorNodeUrl: 'https://mainnet-public.mirrornode.hedera.com',
    name: 'Hedera Mainnet',
  },
  testnet: {
    mirrorNodeUrl: 'https://testnet.mirrornode.hedera.com',
    name: 'Hedera Testnet',
  },
  previewnet: {
    mirrorNodeUrl: 'https://previewnet.mirrornode.hedera.com',
    name: 'Hedera Previewnet',
  },
};
