/**
 * Starknet-specific types for the @cinacoin/adapter-starknet package.
 */

import type { Chain } from '@cinacoin/core-sdk';

/* ------------------------------------------------------------------ */
/*  Starknet chain presets                                             */
/* ------------------------------------------------------------------ */

/** Well-known Starknet chain presets. */
export const STARKNET_CHAINS: Chain[] = [
  {
    id: 'starknet:mainnet',
    name: 'Starknet Mainnet',
    rpcUrl: 'https://starknet-mainnet.public.blastapi.io',
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    explorerUrl: 'https://starkscan.co',
    iconUrl: 'https://starknet.io/favicon.ico',
  },
  {
    id: 'starknet:sepolia',
    name: 'Starknet Sepolia',
    rpcUrl: 'https://starknet-sepolia.public.blastapi.io',
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    explorerUrl: 'https://sepolia.starkscan.co',
    iconUrl: 'https://starknet.io/favicon.ico',
  },
];

/* ------------------------------------------------------------------ */
/*  Wallet info                                                        */
/* ------------------------------------------------------------------ */

/** Metadata for a supported Starknet wallet. */
export interface StarknetWalletInfo {
  /** Internal wallet id. */
  id: string;
  /** Human-readable name. */
  name: string;
  /** EIP-6963 RDNS identifier. */
  rdns: string;
  /** Wallet icon URL. */
  icon: string;
  /** URL to install the wallet. */
  downloadUrl: string;
}

/** Supported Starknet wallets. */
export const STARKNET_WALLETS: StarknetWalletInfo[] = [
  {
    id: 'argent-x',
    name: 'Argent X',
    rdns: 'im.argent.contract',
    icon: 'https://www.argent.xyz/favicon.ico',
    downloadUrl: 'https://www.argent.xyz/argent-x/',
  },
  {
    id: 'braavos',
    name: 'Braavos',
    rdns: 'app.braavos.wallet',
    icon: 'https://braavos.app/favicon.ico',
    downloadUrl: 'https://braavos.app/',
  },
];

/* ------------------------------------------------------------------ */
/*  Starknet request / call types                                      */
/* ------------------------------------------------------------------ */

/** Raw Starknet invoke/call transaction. */
export interface StarknetCall {
  /** Contract address. */
  contractAddress: string;
  /** Entrypoint method name. */
  entrypoint: string;
  /** Calldata as decimal strings. */
  calldata: string[];
}

/** Transaction to be executed. */
export interface StarknetTransaction {
  /** Single call or array of calls (multicall). */
  calls: StarknetCall | StarknetCall[];
  /** Optional details (maxFee, nonce, version). */
  details?: {
    maxFee?: string;
    nonce?: string;
    version?: string;
  };
}

/** Result of a signed transaction. */
export interface StarknetTransactionResult {
  /** Transaction hash. */
  transactionHash: string;
}

/** Starknet wallet connector interface. */
export interface StarknetWalletConnector {
  /** Unique connector id (matches wallet id). */
  readonly id: string;
  /** Human-readable name. */
  readonly name: string;

  /** Check if the wallet is installed. */
  isInstalled(): boolean;

  /** Connect to the wallet and get the connected account address. */
  connect(): Promise<string>;

  /** Disconnect from the wallet. */
  disconnect(): Promise<void>;

  /** Get the connected account address. */
  getAccount(): string | null;

  /** Sign a Starknet transaction. */
  signTransaction(calls: StarknetCall[]): Promise<unknown>;

  /** Execute a Starknet transaction. */
  executeTransaction(calls: StarknetCall[], details?: Record<string, unknown>): Promise<StarknetTransactionResult>;

  /** Sign a message. */
  signMessage(message: string | unknown): Promise<string>;
}

/** Starknet-specific connect parameters. */
export interface StarknetConnectParams {
  /** Wallet id to connect to ('argent-x' | 'braavos'). */
  walletId?: string;
  /** Preferred RPC URL. */
  rpcUrl?: string;
}

/* ------------------------------------------------------------------ */
/*  Starknet invoke transaction / raw types                             */
/* ------------------------------------------------------------------ */

/** Block reference for RPC calls. */
export type BlockReference = 'latest' | 'pending' | { block_number: number } | { block_hash: string };

/** Raw Starknet invoke transaction (for RPC). */
export interface StarknetInvokeTransaction {
  type: 'INVOKE';
  sender_address: string;
  calldata: string[];
  nonce?: string;
  max_fee?: string;
  version: string;
}

/* ------------------------------------------------------------------ */
/*  Starknet helper utilities                                           */
/* ------------------------------------------------------------------ */

/** Maximum felt252 value (2^252 - 1). */
export const Felt252_MAX = (1n << 252n) - 1n;

/**
 * Normalize a Starknet address (pad to 66 chars with 0x prefix).
 */
export function normalizeStarknetAddress(address: string): string {
  if (!address.startsWith('0x')) address = '0x' + address;
  return '0x' + address.slice(2).padStart(64, '0');
}

/**
 * Validate a Starknet address format.
 */
export function isValidStarknetAddress(address: string): boolean {
  if (!address.startsWith('0x')) return false;
  const hex = address.slice(2);
  if (hex.length === 0 || hex.length > 66) return false;
  return /^[0-9a-fA-F]+$/.test(hex);
}

/**
 * Encode a felt252 value as hex.
 */
export function encodeFelt252(value: string | number | bigint): string {
  const num = typeof value === 'string' ? BigInt(value) : BigInt(value);
  return '0x' + num.toString(16);
}

/**
 * Pad a hex string to 32 bytes.
 */
export function padHex(value: string): string {
  const hex = value.startsWith('0x') ? value.slice(2) : value;
  return '0x' + hex.padStart(64, '0');
}

/**
 * Encode a single Starknet call to calldata format.
 * Returns [contractAddress, entrypoint, dataLen, ...calldata].
 */
export function encodeCall(call: StarknetCall): string[] {
  return [
    normalizeStarknetAddress(call.contractAddress),
    encodeFelt252(call.entrypoint),
    call.calldata.length.toString(),
    ...call.calldata,
  ];
}

/**
 * Encode multiple calls into flat calldata.
 * Format: [callCount, [contract, selector, dataOffset, dataLen]*, [calldata...]].
 */
export function encodeMultiCall(calls: StarknetCall[]): string[] {
  const encoded = calls.map(encodeCall);
  const dataLen = encoded.reduce((sum, e) => sum + e.length - 3, 0);
  const header = [calls.length.toString()];
  const callHeaders: string[] = [];
  const allCalldata: string[] = [];
  let offset = 0;

  for (const enc of encoded) {
    const contractAddr = enc[0];
    const selector = enc[1];
    const callDataLen = enc[2];
    const callData = enc.slice(3);

    callHeaders.push(contractAddr, selector, offset.toString(), callDataLen);
    allCalldata.push(...callData);
    offset += callData.length;
  }

  return [...header, ...callHeaders, ...allCalldata];
}
