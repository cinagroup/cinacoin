/**
 * XRPL advanced operations — Transaction building, Trust Lines, DEX operations, signing, submit.
 *
 * Provides production-ready XRP Ledger operations:
 * - Payment transactions
 * - Trust Line management (TrustSet)
 * - DEX operations (OfferCreate, OfferCancel)
 * - NFT operations (NFTokenMint, NFTokenBurn, NFTokenCreateOffer)
 * - Account settings (AccountSet)
 * - Transaction signing and submission
 * - Balance and ledger queries
 */

/* ─────────────────────────────────────────────────────────────── */
/*  XRPL Address Helpers                                              */
/* ─────────────────────────────────────────────────────────────── */

/**
 * Classic XRPL address (r...).
 */
export type XrplClassicAddress = string;

/**
 * X-Address format (X...).
 */
export type XrplXAddress = string;

/**
 * Validate a classic XRPL address.
 */
export function isValidClassicAddress(address: string): boolean {
  return /^r[1-9A-HJ-NP-Za-km-z]{25,34}$/.test(address);
}

/**
 * Validate an X-Address.
 */
export function isValidXAddress(address: string): boolean {
  return /^X[1-9A-HJ-NP-Za-km-z]{47}$/.test(address);
}

/**
 * Validate any XRPL address format.
 */
export function isValidAnyAddress(address: string): boolean {
  return isValidClassicAddress(address) || isValidXAddress(address);
}

/* ─────────────────────────────────────────────────────────────── */
/*  Transaction Building                                              */
/* ─────────────────────────────────────────────────────────────── */

/** XRPL transaction type. */
export type XrplTransactionType =
  | 'Payment'
  | 'TrustSet'
  | 'OfferCreate'
  | 'OfferCancel'
  | 'AccountSet'
  | 'SetRegularKey'
  | 'SignerListSet'
  | 'NFTokenMint'
  | 'NFTokenBurn'
  | 'NFTokenCreateOffer'
  | 'NFTokenCancelOffer'
  | 'NFTokenAcceptOffer';

/** Base XRPL transaction. */
export interface XrplTransaction {
  /** Transaction type. */
  TransactionType: XrplTransactionType;
  /** Sender address. */
  Account: XrplClassicAddress;
  /** Fee in drops. */
  Fee: string;
  /** Sequence number. */
  Sequence: number;
  /** LastLedgerSequence (to prevent stranded transactions). */
  LastLedgerSequence?: number;
  /** Memos. */
  Memos?: Array<{
    Memo: {
      MemoType?: string;
      MemoData?: string;
      MemoFormat?: string;
    };
  }>;
  /** Flags. */
  Flags?: number;
  /** SigningPubKey. */
  SigningPubKey?: string;
  /** TxnSignature. */
  TxnSignature?: string;
}

/**
 * Build a Payment transaction.
 */
export function buildPaymentTx(params: {
  /** Sender address. */
  account: XrplClassicAddress;
  /** Destination address. */
  destination: XrplClassicAddress;
  /** Amount in drops. */
  amount: string;
  /** Destination tag (optional). */
  destinationTag?: number;
  /** Fee in drops. */
  fee: string;
  /** Sequence number. */
  sequence: number;
  /** Last ledger sequence. */
  lastLedgerSequence: number;
  /** Memo (optional). */
  memo?: string;
}): XrplTransaction {
  const tx: XrplTransaction = {
    TransactionType: 'Payment',
    Account: params.account,
    Destination: params.destination,
    Amount: params.amount,
    Fee: params.fee,
    Sequence: params.sequence,
    LastLedgerSequence: params.lastLedgerSequence,
  };

  if (params.destinationTag !== undefined) {
    tx.DestinationTag = params.destinationTag;
  }

  if (params.memo) {
    tx.Memos = [{
      Memo: {
        MemoData: Buffer.from(params.memo, 'utf-8').toString('hex').toUpperCase(),
      },
    }];
  }

  return tx;
}

/**
 * Build an issued currency payment (not XRP).
 */
export function buildIssuedPaymentTx(params: {
  account: XrplClassicAddress;
  destination: XrplClassicAddress;
  /** Amount as an object: { value, currency, issuer }. */
  amount: { value: string; currency: string; issuer: XrplClassicAddress };
  fee: string;
  sequence: number;
  lastLedgerSequence: number;
}): XrplTransaction {
  return {
    TransactionType: 'Payment',
    Account: params.account,
    Destination: params.destination,
    Amount: params.amount,
    Fee: params.fee,
    Sequence: params.sequence,
    LastLedgerSequence: params.lastLedgerSequence,
  };
}

/* ─────────────────────────────────────────────────────────────── */
/*  Trust Line Management                                             */
/* ─────────────────────────────────────────────────────────────── */

/** TrustSet flags. */
export enum TrustSetFlags {
  tfSetfAuth = 0x00010000,
  tfNoRipple = 0x00020000,
  tfClearNoRipple = 0x00040000,
  tfSetFreeze = 0x00100000,
  tfClearFreeze = 0x00200000,
}

/**
 * Build a TrustSet transaction.
 *
 * Creates or modifies a trust line to a specific issuer/currency.
 * Setting LimitAmount to 0 removes the trust line.
 */
export function buildTrustSetTx(params: {
  account: XrplClassicAddress;
  /** Counterparty issuer address. */
  issuer: XrplClassicAddress;
  /** Currency code (3 letters or 40-char hex). */
  currency: string;
  /** Trust limit (0 to remove). */
  limit: string;
  fee: string;
  sequence: number;
  lastLedgerSequence: number;
  flags?: number;
}): XrplTransaction {
  const tx: XrplTransaction = {
    TransactionType: 'TrustSet',
    Account: params.account,
    LimitAmount: {
      currency: params.currency,
      issuer: params.issuer,
      value: params.limit,
    },
    Fee: params.fee,
    Sequence: params.sequence,
    LastLedgerSequence: params.lastLedgerSequence,
  };

  if (params.flags !== undefined) {
    tx.Flags = params.flags;
  }

  return tx;
}

/* ─────────────────────────────────────────────────────────────── */
/*  DEX Operations                                                    */
/* ─────────────────────────────────────────────────────────────── */

/** OfferCreate flags. */
export enum OfferCreateFlags {
  tfPassive = 0x00010000,
  tfImmediateOrCancel = 0x00020000,
  tfFillOrKill = 0x00040000,
  tfSell = 0x00080000,
}

/**
 * Build an OfferCreate transaction.
 *
 * Places an order on the XRPL DEX.
 */
export function buildOfferCreateTx(params: {
  account: XrplClassicAddress;
  /** What the account is willing to pay. */
  takerGets: string | { value: string; currency: string; issuer: XrplClassicAddress };
  /** What the account wants in return. */
  takerPays: string | { value: string; currency: string; issuer: XrplClassicAddress };
  fee: string;
  sequence: number;
  lastLedgerSequence: number;
  /** Expiration ledger index (optional). */
  expiration?: number;
  flags?: number;
}): XrplTransaction {
  const tx: XrplTransaction = {
    TransactionType: 'OfferCreate',
    Account: params.account,
    TakerGets: params.takerGets,
    TakerPays: params.takerPays,
    Fee: params.fee,
    Sequence: params.sequence,
    LastLedgerSequence: params.lastLedgerSequence,
  };

  if (params.expiration !== undefined) {
    tx.Expiration = params.expiration;
  }

  if (params.flags !== undefined) {
    tx.Flags = params.flags;
  }

  return tx;
}

/**
 * Build an OfferCancel transaction.
 */
export function buildOfferCancelTx(params: {
  account: XrplClassicAddress;
  /** Offer sequence to cancel. */
  offerSequence: number;
  fee: string;
  sequence: number;
  lastLedgerSequence: number;
}): XrplTransaction {
  return {
    TransactionType: 'OfferCancel',
    Account: params.account,
    OfferSequence: params.offerSequence,
    Fee: params.fee,
    Sequence: params.sequence,
    LastLedgerSequence: params.lastLedgerSequence,
  };
}

/**
 * Build an OrderBook request (to query DEX).
 */
export function buildOrderBookRequest(
  gets: { currency: string; issuer?: string },
  pays: { currency: string; issuer?: string },
  limit?: number,
): {
  command: string;
  taker_gets: { currency: string; issuer?: string };
  taker_pays: { currency: string; issuer?: string };
  limit: number;
} {
  return {
    command: 'book_offers',
    taker_gets: {
      currency: gets.currency,
      issuer: gets.issuer || undefined,
    },
    taker_pays: {
      currency: pays.currency,
      issuer: pays.issuer || undefined,
    },
    limit: limit ?? 20,
  };
}

/* ─────────────────────────────────────────────────────────────── */
/*  NFT Operations                                                    */
/* ─────────────────────────────────────────────────────────────── */

/** NFTokenMint flags. */
export enum NFTokenMintFlags {
  tfBurnable = 0x00000001,
  tfOnlyXRP = 0x00000002,
  tfTrustLine = 0x00000004,
  tfTransferable = 0x00000008,
}

/**
 * Build an NFTokenMint transaction.
 */
export function buildNFTMintTx(params: {
  account: XrplClassicAddress;
  /** Taxon ID (arbitrary categorization). */
  nftokenTaxon: number;
  /** URI (hex-encoded). */
  uri?: string;
  flags?: number;
  fee: string;
  sequence: number;
  lastLedgerSequence: number;
  /** Transfer fee (basis points 0-50000). */
  transferFee?: number;
  /** Issuer (if minting on behalf of another). */
  issuer?: XrplClassicAddress;
}): XrplTransaction {
  const tx: XrplTransaction = {
    TransactionType: 'NFTokenMint',
    Account: params.account,
    NFTokenTaxon: params.nftokenTaxon,
    Fee: params.fee,
    Sequence: params.sequence,
    LastLedgerSequence: params.lastLedgerSequence,
  };

  if (params.uri) tx.URI = params.uri;
  if (params.flags !== undefined) tx.Flags = params.flags;
  if (params.transferFee !== undefined) tx.TransferFee = params.transferFee;
  if (params.issuer) tx.Issuer = params.issuer;

  return tx;
}

/**
 * Build an NFTokenBurn transaction.
 */
export function buildNFTBurnTx(params: {
  account: XrplClassicAddress;
  /** NFT ID (hex string, 64 chars). */
  nftokenId: string;
  fee: string;
  sequence: number;
  lastLedgerSequence: number;
  /** Owner (if burning from another account). */
  owner?: XrplClassicAddress;
}): XrplTransaction {
  const tx: XrplTransaction = {
    TransactionType: 'NFTokenBurn',
    Account: params.account,
    NFTokenID: params.nftokenId,
    Fee: params.fee,
    Sequence: params.sequence,
    LastLedgerSequence: params.lastLedgerSequence,
  };

  if (params.owner) tx.Owner = params.owner;

  return tx;
}

/**
 * Build an NFTokenCreateOffer transaction.
 */
export function buildNFTCreateOfferTx(params: {
  account: XrplClassicAddress;
  /** NFT ID. */
  nftokenId: string;
  /** Amount (for sell offer = price, for buy offer = amount willing to pay). */
  amount: string;
  /** true = sell offer, false = buy offer. */
  isSellOffer: boolean;
  fee: string;
  sequence: number;
  lastLedgerSequence: number;
  /** Destination (restrict offer to specific account). */
  destination?: XrplClassicAddress;
  /** Expiration. */
  expiration?: number;
}): XrplTransaction {
  const tx: XrplTransaction = {
    TransactionType: 'NFTokenCreateOffer',
    Account: params.account,
    NFTokenID: params.nftokenId,
    Amount: params.amount,
    Fee: params.fee,
    Sequence: params.sequence,
    LastLedgerSequence: params.lastLedgerSequence,
  };

  if (params.isSellOffer) tx.Flags = 1;
  if (params.destination) tx.Destination = params.destination;
  if (params.expiration !== undefined) tx.Expiration = params.expiration;

  return tx;
}

/**
 * Build an NFTokenCancelOffer transaction.
 */
export function buildNFTCancelOfferTx(params: {
  account: XrplClassicAddress;
  /** Offer IDs to cancel. */
  nftokenOffers: string[];
  fee: string;
  sequence: number;
  lastLedgerSequence: number;
}): XrplTransaction {
  return {
    TransactionType: 'NFTokenCancelOffer',
    Account: params.account,
    NFTokenOffers: params.nftokenOffers,
    Fee: params.fee,
    Sequence: params.sequence,
    LastLedgerSequence: params.lastLedgerSequence,
  };
}

/* ─────────────────────────────────────────────────────────────── */
/*  Account Settings                                                  */
/* ─────────────────────────────────────────────────────────────── */

/** AccountSet flags. */
export enum AccountSetFlags {
  tfRequireDestTag = 0x00010000,
  tfOptionalDestTag = 0x00020000,
  tfRequireAuth = 0x00040000,
  tfOptionalAuth = 0x00080000,
  tfDisallowXRP = 0x00100000,
  tfAllowXRP = 0x00200000,
}

/**
 * Build an AccountSet transaction.
 */
export function buildAccountSetTx(params: {
  account: XrplClassicAddress;
  fee: string;
  sequence: number;
  lastLedgerSequence: number;
  /** SetFlag to enable a feature. */
  setFlag?: number;
  /** ClearFlag to disable a feature. */
  clearFlag?: number;
  /** Domain (hex-encoded). */
  domain?: string;
  /** EmailHash (32 hex chars). */
  emailHash?: string;
  /** MessageKey (hex). */
  messageKey?: string;
  /** TransferRate (basis points + 1,000,000,000). */
  transferRate?: number;
  /** TickSize. */
  tickSize?: number;
}): XrplTransaction {
  const tx: XrplTransaction = {
    TransactionType: 'AccountSet',
    Account: params.account,
    Fee: params.fee,
    Sequence: params.sequence,
    LastLedgerSequence: params.lastLedgerSequence,
  };

  if (params.setFlag !== undefined) tx.SetFlag = params.setFlag;
  if (params.clearFlag !== undefined) tx.ClearFlag = params.clearFlag;
  if (params.domain) tx.Domain = params.domain;
  if (params.emailHash) tx.EmailHash = params.emailHash;
  if (params.messageKey) tx.MessageKey = params.messageKey;
  if (params.transferRate !== undefined) tx.TransferRate = params.transferRate;
  if (params.tickSize !== undefined) tx.TickSize = params.tickSize;

  return tx;
}

/* ─────────────────────────────────────────────────────────────── */
/*  Signing & Submission                                              */
/* ─────────────────────────────────────────────────────────────── */

/** Signed transaction result. */
export interface SignedTransaction {
  /** Hex-encoded signed transaction blob. */
  txBlob: string;
  /** Transaction hash. */
  hash: string;
  /** Original transaction JSON. */
  txJson: XrplTransaction;
}

/** Submit response. */
export interface SubmitResult {
  /** Engine result code. */
  engineResult: string;
  /** Human-readable result. */
  engineResultMessage: string;
  /** Transaction hash (if submitted). */
  txJson?: XrplTransaction;
}

/**
 * Build a submit RPC call.
 */
export function buildSubmitRpc(txBlob: string): {
  command: string;
  tx_blob: string;
} {
  return {
    command: 'submit',
    tx_blob: txBlob,
  };
}

/**
 * Build a sign RPC call (for server-side signing).
 */
export function buildSignRpc(
  txJson: XrplTransaction,
  secret: string,
): {
  command: string;
  secret: string;
  tx_json: XrplTransaction;
} {
  return {
    command: 'sign',
    secret,
    tx_json: txJson,
  };
}

/* ─────────────────────────────────────────────────────────────── */
/*  Balance & Ledger Queries                                          */
/* ─────────────────────────────────────────────────────────────── */

/**
 * Build an account_info RPC call.
 */
export function buildAccountInfoRpc(
  account: string,
  strict: boolean = true,
  ledgerIndex?: string,
): {
  command: string;
  account: string;
  strict: boolean;
  ledger_index?: string;
} {
  return {
    command: 'account_info',
    account,
    strict,
    ...(ledgerIndex ? { ledger_index: ledgerIndex } : {}),
  };
}

/**
 * Build an account_lines RPC call (trust lines).
 */
export function buildAccountLinesRpc(
  account: string,
  peerAccount?: string,
  ledgerIndex?: string,
  limit?: number,
): {
  command: string;
  account: string;
  ledger_index?: string;
  peer?: string;
  limit?: number;
} {
  return {
    command: 'account_lines',
    account,
    ...(ledgerIndex ? { ledger_index: ledgerIndex } : {}),
    ...(peerAccount ? { peer: peerAccount } : {}),
    ...(limit ? { limit } : {}),
  };
}

/**
 * Build an account_offers RPC call.
 */
export function buildAccountOffersRpc(
  account: string,
  ledgerIndex?: string,
  limit?: number,
): {
  command: string;
  account: string;
  ledger_index?: string;
  limit?: number;
} {
  return {
    command: 'account_offers',
    account,
    ...(ledgerIndex ? { ledger_index: ledgerIndex } : {}),
    ...(limit ? { limit } : {}),
  };
}

/**
 * Build a server_info RPC call.
 */
export function buildServerInfoRpc(): {
  command: string;
} {
  return { command: 'server_info' };
}

/**
 * Build a ledger RPC call.
 */
export function buildLedgerRpc(ledgerIndex?: string | number): {
  command: string;
  ledger_index?: string | number;
  transactions: boolean;
  expand: boolean;
} {
  return {
    command: 'ledger',
    ...(ledgerIndex ? { ledger_index: ledgerIndex } : {}),
    transactions: true,
    expand: true,
  };
}

/**
 * Parse account info response.
 */
export function parseAccountInfo(result: Record<string, unknown>): {
  sequence: number;
  xrpBalance: string;
  ownerCount: number;
  reserve: string;
  flags: number;
} {
  const accountData = result.account_data as Record<string, unknown> | undefined;
  if (!accountData) {
    throw new Error('No account data in response');
  }

  const xrpBalance = (accountData.Balance as string) ?? '0';
  const ownerCount = (accountData.OwnerCount as number) ?? 0;
  const reserve = String(20000000 + ownerCount * 5000000); // Base + owner reserve

  return {
    sequence: (accountData.Sequence as number) ?? 0,
    xrpBalance,
    ownerCount,
    reserve,
    flags: (accountData.Flags as number) ?? 0,
  };
}

/* ─────────────────────────────────────────────────────────────── */
/*  XRPL Constants                                                    */
/* ─────────────────────────────────────────────────────────────── */

/** 1 XRP = 1,000,000 drops. */
export const XRP_DROPS = 1_000_000;

/** Base reserve (2 XRP in drops). */
export const BASE_RESERVE = String(2 * XRP_DROPS);

/** Owner reserve (0.2 XRP in drops). */
export const OWNER_RESERVE = String(0.2 * XRP_DROPS);

/** Default fee (12 drops). */
export const DEFAULT_FEE = '12';

/**
 * Convert drops to XRP.
 */
export function dropsToXrp(drops: string | number): string {
  const num = Number(drops);
  return (num / XRP_DROPS).toFixed(6);
}

/**
 * Convert XRP to drops.
 */
export function xrpToDrops(xrp: string | number): string {
  return String(Math.round(Number(xrp) * XRP_DROPS));
}

/**
 * Build an XRPL network URL.
 */
export function buildRpcUrl(network: 'mainnet' | 'testnet' | 'devnet'): string {
  const urls = {
    mainnet: 'wss://xrplcluster.com',
    testnet: 'wss://s.altnet.rippletest.net:51233',
    devnet: 'wss://s.devnet.rippletest.net:51233',
  };
  return urls[network];
}
