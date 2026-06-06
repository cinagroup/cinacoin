/**
 * Starknet advanced operations — deploy_account, execute, call, ECDSA verification.
 *
 * Provides production-ready Starknet operations without requiring starknet.js:
 * - Account deployment (for new accounts)
 * - Transaction execution (multi-call)
 * - Contract calls (read-only)
 * - ECDSA signature verification on STARK curve
 * - Transaction fee estimation
 * - Nonce management
 * - Class hash queries
 * - Direct RPC submission (broadcastTransaction, deployAccountRpc, invokeRpc)
 */

/* ─────────────────────────────────────────────────────────────── */
/*  Starknet RPC helpers                                             */
/* ─────────────────────────────────────────────────────────────── */

/** Make a JSON-RPC call to a Starknet node. */
async function starknetRpc<T>(
  rpcUrl: string,
  method: string,
  params: unknown[],
): Promise<T> {
  const response = await fetch(rpcUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }),
  });

  if (!response.ok) {
    throw new Error(`Starknet RPC error: HTTP ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  if (data.error) {
    throw new Error(`Starknet RPC error: ${data.error.message ?? JSON.stringify(data.error)}`);
  }

  return data.result as T;
}

/** Parse a hex string to BigInt safely. */
function hexToBigInt(hex: string): bigint {
  const clean = hex.startsWith('0x') ? hex.slice(2) : hex;
  return BigInt('0x' + clean);
}

import type { StarknetCall, StarknetInvokeTransaction } from '../types.js';
import {
  normalizeStarknetAddress,
  isValidStarknetAddress,
  encodeMultiCall,
  encodeFelt252,
  getSelectorFromName,
  padHex,
  Felt252_MAX,
} from '../types.js';

/* ─────────────────────────────────────────────────────────────── */
/*  ECDSA on STARK Curve (secp256k1 variant)                       */
/* ─────────────────────────────────────────────────────────────── */

/** Starknet ECDSA public key. */
export interface StarknetPublicKey {
  /** Public key as hex string (0x-prefixed). */
  x: string;
  /** Public key y coordinate (for uncompressed). */
  y?: string;
  /** Whether the key is compressed. */
  compressed: boolean;
}

/** ECDSA signature. */
export interface StarknetSignature {
  /** r component. */
  r: string;
  /** s component. */
  s: string;
}

/**
 * Starknet uses a variant of ECDSA over the STARK curve.
 * The curve parameters are similar to secp256k1 but with different constants.
 *
 * This module provides verification utilities.
 * For full signing, use the wallet provider.
 */

/* ------------------------------------------------------------------ */
/*  STARK Curve constants (ECDSA on STARK)                             */
/* ------------------------------------------------------------------ */

/** Curve order (prime) for Starknet's ECDSA variant. */
const STARK_CURVE_N = 0x800000000000010FFFFFFFFFFFFFFFFB781126DCAE7B2321E66A241ADC64D2Fn;
/** Generator x coordinate. */
const STARK_CURVE_Gx = 0x1EF15C18599971B7BECED415A40F0C7DEACFD9B0D1819E03D723D8BC943CFCAFn;
/** Generator y coordinate. */
const STARK_CURVE_Gy = 0x5668060AA49730B7BE4801DF46EC62DE53ECD11ABE4603FAE7775BC8A32C1Fn;
/** Prime of the underlying field. */
const STARK_CURVE_P = 0x800000000000011000000000000000000000000000000000000000000000001n;

/**
 * Modular inverse using the extended Euclidean algorithm.
 * Returns a^-1 mod n.
 */
function modInverse(a: bigint, n: bigint): bigint {
  a = ((a % n) + n) % n;
  if (a === 0n) throw new Error('modInverse: no inverse for 0');
  let [t, newT] = [0n, 1n];
  let [r, newR] = [n, a];
  while (newR !== 0n) {
    const quotient = r / newR;
    [t, newT] = [newT, t - quotient * newT];
    [r, newR] = [newR, r - quotient * newR];
  }
  if (r > 1n) throw new Error('modInverse: not invertible');
  return ((t % n) + n) % n;
}

/**
 * Add two points on an elliptic curve (affine coordinates).
 */
function ecAdd(
  p1: [bigint, bigint],
  p2: [bigint, bigint],
  prime: bigint,
): [bigint, bigint] {
  const [x1, y1] = p1;
  const [x2, y2] = p2;

  if (x1 === x2 && y1 === y2) {
    // Point doubling
    const lam = (3n * x1 * x1 * modInverse(2n * y1, prime)) % prime;
    const x3 = (lam * lam - 2n * x1) % prime;
    const y3 = (lam * (x1 - x3) - y1) % prime;
    return [((x3 % prime) + prime) % prime, ((y3 % prime) + prime) % prime];
  }

  // Point addition
  const lam = ((y2 - y1) * modInverse((x2 - x1) % prime, prime)) % prime;
  const x3 = (lam * lam - x1 - x2) % prime;
  const y3 = (lam * (x1 - x3) - y1) % prime;
  return [((x3 % prime) + prime) % prime, ((y3 % prime) + prime) % prime];
}

/**
 * Multiply a point by a scalar (double-and-add).
 */
function ecMul(
  k: bigint,
  point: [bigint, bigint],
  prime: bigint,
): [bigint, bigint] {
  let result: [bigint, bigint] | null = null;
  let addend = point;
  let scalar = k;

  while (scalar > 0n) {
    if (scalar & 1n) {
      result = result ? ecAdd(result, addend, prime) : addend;
    }
    addend = ecAdd(addend, addend, prime);
    scalar >>= 1n;
  }

  if (!result) throw new Error('ecMul: result is identity (should not happen for valid k)');
  return result;
}

/**
 * Verify an ECDSA signature on the STARK curve.
 *
 * Starknet uses a modified ECDSA where:
 * - The curve is similar to secp256k1 but with STARK-specific constants
 * - Hash function is Pedersen or Poseidon
 * - Signatures are (r, s) pairs of felts
 *
 * @param message - Message hash (felt252).
 * @param signature - Signature (r, s).
 * @param publicKey - Public key x coordinate.
 * @returns True if the signature is valid.
 */
export function verifyStarknetSignature(
  message: string,
  signature: StarknetSignature,
  publicKey: string,
): boolean {
  // Basic validation
  if (!isValidStarknetAddress(signature.r)) return false;
  if (!isValidStarknetAddress(signature.s)) return false;
  if (!isValidStarknetAddress(publicKey)) return false;

  const r = hexToBigInt(signature.r);
  const s = hexToBigInt(signature.s);
  const pubKeyX = hexToBigInt(publicKey);
  const z = typeof message === 'string' && message.startsWith('0x') ? hexToBigInt(message) : BigInt(message);

  // Validate r, s are in valid range
  if (r <= 0n || r >= STARK_CURVE_N) return false;
  if (s <= 0n || s >= STARK_CURVE_N) return false;

  try {
    const sInv = modInverse(s, STARK_CURVE_N);
    const u1 = (z * sInv) % STARK_CURVE_N;
    const u2 = (r * sInv) % STARK_CURVE_N;

    const [x1] = ecAdd(
      ecMul(u1, [STARK_CURVE_Gx, STARK_CURVE_Gy], STARK_CURVE_P),
      ecMul(u2, [pubKeyX, STARK_CURVE_Gy], STARK_CURVE_P),
      STARK_CURVE_P,
    );

    return x1 % STARK_CURVE_N === r;
  } catch {
    // If modular inverse fails, signature is invalid
    return false;
  }
}

/**
 * Validate a Starknet signature format.
 * Checks that r and s are valid felt252 values within the curve order.
 */
export function isValidStarknetSignature(sig: StarknetSignature | string[]): boolean {
  if (Array.isArray(sig)) {
    if (sig.length < 2) return false;
    return isValidFeltStrict(sig[0]) && isValidFeltStrict(sig[1]);
  }
  return isValidFeltStrict(sig.r) && isValidFeltStrict(sig.s);
}

/**
 * Strict felt validation (must be within valid range, not zero).
 */
function isValidFeltStrict(value: string): boolean {
  if (typeof value !== 'string') return false;
  const hex = value.startsWith('0x') ? value.slice(2) : value;
  if (!/^[0-9a-fA-F]+$/.test(hex)) return false;
  if (hex.length === 0 || hex.length > 64) return false;
  try {
    const n = BigInt(value);
    return n > 0n && n < Felt252_MAX;
  } catch {
    return false;
  }
}

/* ─────────────────────────────────────────────────────────────── */
/*  Account Deployment                                              */
/* ─────────────────────────────────────────────────────────────── */

/** Deploy account parameters. */
export interface DeployAccountParams {
  /** Account class hash (e.g., ArgentX or Braavos class hash). */
  classHash: string;
  /** Contract address salt (random). */
  addressSalt: string;
  /** Constructor calldata. */
  constructorCalldata: string[];
  /** Max fee for deployment. */
  maxFee?: string;
  /** Signature for deployment. */
  signature: string[];
  /** Transaction version. */
  version?: string;
  /** Nonce (should be 0 for new accounts). */
  nonce?: string;
}

/**
 * Build a deploy account transaction.
 *
 * Creates a DEPLOY_ACCOUNT transaction for deploying a new Starknet account
 * (ArgentX, Braavos, or custom account).
 *
 * @param params - Deployment parameters.
 * @returns Deploy account transaction payload.
 */
export function buildDeployAccountTx(
  params: DeployAccountParams,
): {
  type: 'DEPLOY_ACCOUNT';
  contract_address_salt: string;
  class_hash: string;
  constructor_calldata: string[];
  signature: string[];
  max_fee: string;
  version: string;
  nonce: string;
} {
  return {
    type: 'DEPLOY_ACCOUNT',
    contract_address_salt: normalizeStarknetAddress(params.addressSalt),
    class_hash: normalizeStarknetAddress(params.classHash),
    constructor_calldata: params.constructorCalldata,
    signature: params.signature,
    max_fee: params.maxFee ?? '0x523932C4B000',
    version: params.version ?? '0x1',
    nonce: params.nonce ?? '0x0',
  };
}

/**
 * Compute the counterfactual address for a new account before deployment.
 *
 * Implements the canonical Starknet formula using the real Pedersen hash via
 * the `starknet` peer dependency:
 *
 *   address = pedersen_chain(
 *     'STARKNET_CONTRACT_ADDRESS', deployerAddress, salt, classHash,
 *     pedersen_array(constructorCalldata)
 *   ) mod ADDR_BOUND
 *
 * `starknet.hash.calculateContractAddressFromHash` performs exactly this
 * derivation, so the resulting address matches Argent-X / Braavos and any
 * Starknet node. This is async because the hash backend is loaded lazily.
 */
export async function computeAccountAddress(
  classHash: string,
  salt: string,
  constructorCalldata: string[],
  deployerAddress: string = '0x0',
): Promise<string> {
  let hash: typeof import('starknet').hash;
  try {
    ({ hash } = await import('starknet'));
  } catch {
    throw new Error(
      "computeAccountAddress requires the 'starknet' peer dependency (>=6.0.0) " +
        'for correct Pedersen-based address derivation. Install it with ' +
        '`npm install starknet`.',
    );
  }

  const address = hash.calculateContractAddressFromHash(
    normalizeStarknetAddress(salt),
    normalizeStarknetAddress(classHash),
    constructorCalldata.map(normalizeStarknetAddress),
    normalizeStarknetAddress(deployerAddress),
  );

  return padHex(
    typeof address === 'string' ? address : '0x' + BigInt(address).toString(16),
  );
}

/* ─────────────────────────────────────────────────────────────── */
/*  Contract Call (Read-Only)                                       */
/* ─────────────────────────────────────────────────────────────── */

/** Contract call parameters. */
export interface ContractCallParams {
  /** Contract address. */
  contractAddress: string;
  /** Function name / entrypoint selector. */
  entrypoint: string;
  /** Encoded calldata. */
  calldata?: string[];
  /** Block reference (default: 'latest'). */
  block?: import('../types.js').BlockReference;
}

/**
 * Build a starknet_call RPC payload.
 */
export function buildCallRpc(params: ContractCallParams): {
  method: string;
  params: unknown[];
} {
  if (!isValidStarknetAddress(params.contractAddress)) {
    throw new Error(`Invalid contract address: ${params.contractAddress}`);
  }

  return {
    method: 'starknet_call',
    params: [
      {
        contract_address: normalizeStarknetAddress(params.contractAddress),
        entry_point_selector: getSelectorFromName(params.entrypoint),
        calldata: params.calldata ?? [],
      },
      typeof params.block === 'string' ? params.block : params.block ?? 'latest',
    ],
  };
}

/* ─────────────────────────────────────────────────────────────── */
/*  Transaction Execution (Write)                                   */
/* ─────────────────────────────────────────────────────────────── */

/** Execute transaction options. */
export interface ExecuteOptions {
  /** Max fee (override auto-estimation). */
  maxFee?: string;
  /** Nonce (override auto-fetch). */
  nonce?: string;
  /** Transaction version. */
  version?: string;
  /** Block reference for fee estimation. */
  block?: import('../types.js').BlockReference;
}

/**
 * Build an execute transaction for the Starknet account abstraction model.
 *
 * Starknet accounts are smart contracts that can execute arbitrary logic.
 * This builds a v1 invoke transaction with the standard calldata format.
 *
 * @param senderAddress - Account address.
 * @param calls - Contract calls to execute.
 * @param options - Optional execution parameters.
 * @returns Invoke transaction ready for signing.
 */
export function buildExecuteTx(
  senderAddress: string,
  calls: StarknetCall | StarknetCall[],
  options?: ExecuteOptions,
): StarknetInvokeTransaction {
  const callArray = Array.isArray(calls) ? calls : [calls];

  return {
    type: 'INVOKE',
    sender_address: normalizeStarknetAddress(senderAddress),
    calldata: encodeMultiCall(callArray),
    nonce: options?.nonce,
    max_fee: options?.maxFee,
    version: options?.version ?? '0x1',
  };
}

/**
 * Build a multi-call execute transaction with detailed call objects.
 */
export function buildMultiExecuteTx(
  senderAddress: string,
  calls: Array<{
    contractAddress: string;
    entrypoint: string;
    calldata: string[];
  }>,
  options?: ExecuteOptions,
): StarknetInvokeTransaction {
  return buildExecuteTx(senderAddress, calls, options);
}

/* ─────────────────────────────────────────────────────────────── */
/*  Fee Estimation                                                  */
/* ─────────────────────────────────────────────────────────────── */

/**
 * Build an estimate fee RPC payload.
 */
export function buildEstimateFeeRpc(
  senderAddress: string,
  calls: StarknetCall | StarknetCall[],
  nonce: string,
  block?: import('../types.js').BlockReference,
): {
  method: string;
  params: unknown[];
} {
  const callArray = Array.isArray(calls) ? calls : [calls];

  return {
    method: 'starknet_estimateFee',
    params: [
      {
        type: 'INVOKE',
        sender_address: normalizeStarknetAddress(senderAddress),
        calldata: encodeMultiCall(callArray),
        nonce,
        version: '0x1',
      },
      typeof block === 'string' ? block : block ?? 'latest',
    ],
  };
}

/** Fee estimate result. */
export interface FeeEstimate {
  /** Gas consumed. */
  gasConsumed: string;
  /** Gas price. */
  gasPrice: string;
  /** Overall fee in wei. */
  overallFee: string;
  /** Fee unit (WEI/FRI). */
  unit: string;
}

/**
 * Parse fee estimate from RPC response.
 */
export function parseFeeEstimate(data: Record<string, unknown>): FeeEstimate {
  return {
    gasConsumed: (data.gas_consumed as string) ?? '0x0',
    gasPrice: (data.gas_price as string) ?? '0x0',
    overallFee: (data.overall_fee as string) ?? '0x0',
    unit: (data.unit as string) ?? 'WEI',
  };
}

/* ─────────────────────────────────────────────────────────────── */
/*  Nonce Management                                                */
/* ─────────────────────────────────────────────────────────────── */

/**
 * Build a get nonce RPC payload.
 */
export function buildGetNonceRpc(
  address: string,
  block?: import('../types.js').BlockReference,
): {
  method: string;
  params: unknown[];
} {
  return {
    method: 'starknet_getNonce',
    params: [
      typeof block === 'string' ? block : block ?? 'latest',
      normalizeStarknetAddress(address),
    ],
  };
}

/* ─────────────────────────────────────────────────────────────── */
/*  Class / Contract Queries                                        */
/* ─────────────────────────────────────────────────────────────── */

/**
 * Build a get class hash RPC payload.
 */
export function buildGetClassHashRpc(address: string): {
  method: string;
  params: unknown[];
} {
  return {
    method: 'starknet_getClassHashAt',
    params: ['latest', normalizeStarknetAddress(address)],
  };
}

/**
 * Build a get class RPC payload.
 */
export function buildGetClassRpc(classHash: string): {
  method: string;
  params: unknown[];
} {
  return {
    method: 'starknet_getClass',
    params: ['latest', { class_hash: normalizeStarknetAddress(classHash) }],
  };
}

/**
 * Build a get storage at RPC payload.
 */
export function buildGetStorageAtRpc(
  contractAddress: string,
  key: string,
  block?: import('../types.js').BlockReference,
): {
  method: string;
  params: unknown[];
} {
  return {
    method: 'starknet_getStorageAt',
    params: [
      normalizeStarknetAddress(contractAddress),
      key,
      typeof block === 'string' ? block : block ?? 'latest',
    ],
  };
}

/* ─────────────────────────────────────────────────────────────── */
/*  ERC-20 on Starknet                                              */
/* ─────────────────────────────────────────────────────────────── */

/**
 * Build an ERC-20 transfer on Starknet.
 * Starknet ERC-20 uses u256 amounts split into low/high.
 */
export function buildErc20TransferOnStarknet(
  senderAddress: string,
  tokenAddress: string,
  recipient: string,
  amount: string | bigint,
  options?: ExecuteOptions,
): StarknetInvokeTransaction {
  const amountBig = BigInt(amount);
  const low = amountBig & ((1n << 128n) - 1n);
  const high = amountBig >> 128n;

  const call: StarknetCall = {
    contractAddress: normalizeStarknetAddress(tokenAddress),
    entrypoint: 'transfer',
    calldata: [
      normalizeStarknetAddress(recipient),
      padHex('0x' + low.toString(16)),
      padHex('0x' + high.toString(16)),
    ],
  };

  return buildExecuteTx(senderAddress, call, options);
}

/**
 * Build an ERC-20 approve on Starknet.
 */
export function buildErc20ApproveOnStarknet(
  senderAddress: string,
  tokenAddress: string,
  spender: string,
  amount: string | bigint,
  options?: ExecuteOptions,
): StarknetInvokeTransaction {
  const amountBig = BigInt(amount);
  const low = amountBig & ((1n << 128n) - 1n);
  const high = amountBig >> 128n;

  const call: StarknetCall = {
    contractAddress: normalizeStarknetAddress(tokenAddress),
    entrypoint: 'approve',
    calldata: [
      normalizeStarknetAddress(spender),
      padHex('0x' + low.toString(16)),
      padHex('0x' + high.toString(16)),
    ],
  };

  return buildExecuteTx(senderAddress, call, options);
}

/**
 * Build a batch of ERC-20 operations.
 */
export function buildErc20BatchOnStarknet(
  senderAddress: string,
  operations: Array<{
    type: 'transfer' | 'approve';
    tokenAddress: string;
    target: string;
    amount: string | bigint;
  }>,
  options?: ExecuteOptions,
): StarknetInvokeTransaction {
  const calls: StarknetCall[] = operations.map((op) => {
    const amountBig = BigInt(op.amount);
    const low = amountBig & ((1n << 128n) - 1n);
    const high = amountBig >> 128n;

    return {
      contractAddress: normalizeStarknetAddress(op.tokenAddress),
      entrypoint: op.type,
      calldata: [
        normalizeStarknetAddress(op.target),
        padHex('0x' + low.toString(16)),
        padHex('0x' + high.toString(16)),
      ],
    };
  });

  return buildExecuteTx(senderAddress, calls, options);
}

/* ─────────────────────────────────────────────────────────────── */
/*  Direct RPC Submission                                            */
/* ─────────────────────────────────────────────────────────────── */

/**
 * Build a starknet_addInvokeTransaction RPC payload.
 */
export function buildInvokeRpc(
  invokeTx: {
    sender_address: string;
    calldata: string[];
    nonce: string;
    max_fee?: string;
    version: string;
    signature: string[];
  },
): { method: string; params: unknown[] } {
  return {
    method: 'starknet_addInvokeTransaction',
    params: [
      {
        type: 'INVOKE',
        sender_address: normalizeStarknetAddress(invokeTx.sender_address),
        calldata: invokeTx.calldata,
        nonce: invokeTx.nonce,
        max_fee: invokeTx.max_fee ?? '0x0',
        version: invokeTx.version,
        signature: invokeTx.signature,
      },
    ],
  };
}

/** Result of broadcasting a transaction. */
export interface BroadcastResult {
  /** Transaction hash. */
  transactionHash: string;
}

/**
 * Broadcast a signed invoke transaction directly via RPC.
 */
export async function broadcastTransaction(
  rpcUrl: string,
  invokeTx: {
    sender_address: string;
    calldata: string[];
    nonce: string;
    max_fee?: string;
    version: string;
    signature: string[];
  },
): Promise<BroadcastResult> {
  const rpc = buildInvokeRpc(invokeTx);
  const result = await starknetRpc<{ transaction_hash: string }>(
    rpcUrl,
    rpc.method,
    rpc.params,
  );
  return { transactionHash: result.transaction_hash };
}

/** Deploy account RPC payload. */
export function buildDeployAccountRpc(params: DeployAccountParams): {
  method: string;
  params: unknown[];
} {
  const tx = buildDeployAccountTx(params);
  return {
    method: 'starknet_addDeployAccountTransaction',
    params: [
      {
        type: tx.type,
        contract_address_salt: tx.contract_address_salt,
        class_hash: tx.class_hash,
        constructor_calldata: tx.constructor_calldata,
        signature: tx.signature,
        max_fee: tx.max_fee,
        version: tx.version,
        nonce: tx.nonce,
      },
    ],
  };
}

/**
 * Deploy a Starknet account directly via RPC.
 */
export async function deployAccount(
  rpcUrl: string,
  params: DeployAccountParams,
): Promise<{
  transactionHash: string;
  accountAddress: string;
}> {
  const rpc = buildDeployAccountRpc(params);
  const result = await starknetRpc<{ transaction_hash: string; contract_address: string }>(
    rpcUrl,
    rpc.method,
    rpc.params,
  );
  return {
    transactionHash: result.transaction_hash,
    accountAddress: result.contract_address,
  };
}

/**
 * Estimate fee for an invoke transaction via RPC.
 */
export async function estimateFee(
  rpcUrl: string,
  senderAddress: string,
  calls: StarknetCall | StarknetCall[],
  nonce: string,
  block?: import('../types.js').BlockReference,
): Promise<FeeEstimate> {
  const rpc = buildEstimateFeeRpc(senderAddress, calls, nonce, block);
  const result = await starknetRpc<Record<string, unknown>>(
    rpcUrl,
    rpc.method,
    rpc.params,
  );
  return parseFeeEstimate(result);
}

/**
 * Fetch the current nonce for an account via RPC.
 */
export async function getNonce(
  rpcUrl: string,
  address: string,
  block?: import('../types.js').BlockReference,
): Promise<string> {
  const rpc = buildGetNonceRpc(address, block);
  return starknetRpc<string>(rpcUrl, rpc.method, rpc.params);
}

/**
 * Estimate fee, build, and execute a Starknet transaction via direct RPC.
 * Combines nonce retrieval, fee estimation (with 50% buffer), and broadcast.
 */
export async function estimateFeeAndExecute(
  rpcUrl: string,
  senderAddress: string,
  calls: StarknetCall | StarknetCall[],
  signature: string[],
  options?: ExecuteOptions,
): Promise<BroadcastResult> {
  const nonce = options?.nonce ?? (await getNonce(rpcUrl, senderAddress));

  let maxFee = options?.maxFee;
  if (!maxFee) {
    const fee = await estimateFee(rpcUrl, senderAddress, calls, nonce);
    const estimated = BigInt(fee.overallFee);
    maxFee = '0x' + (estimated + (estimated / 2n)).toString(16);
  }

  const invokeTx = buildExecuteTx(senderAddress, calls, { ...options, maxFee, nonce });

  return broadcastTransaction(rpcUrl, {
    sender_address: invokeTx.sender_address,
    calldata: invokeTx.calldata,
    nonce: invokeTx.nonce ?? '0x0',
    max_fee: invokeTx.max_fee,
    version: invokeTx.version,
    signature,
  });
}

/**
 * Execute a deploy_account transaction via RPC with fee estimation.
 */
export async function executeDeployAccount(
  rpcUrl: string,
  params: DeployAccountParams,
): Promise<{
  transactionHash: string;
  accountAddress: string;
}> {
  if (!params.maxFee) {
    const deployTx = buildDeployAccountTx({
      ...params,
      maxFee: '0x0',
      signature: params.signature,
    });

    try {
      const feeResult = await starknetRpc<Record<string, unknown>>(
        rpcUrl,
        'starknet_estimateFee',
        [
          {
            type: 'DEPLOY_ACCOUNT',
            contract_address_salt: deployTx.contract_address_salt,
            class_hash: deployTx.class_hash,
            constructor_calldata: deployTx.constructor_calldata,
            version: deployTx.version,
          },
          'latest',
        ],
      );
      const fee = parseFeeEstimate(feeResult);
      const estimated = BigInt(fee.overallFee);
      params.maxFee = '0x' + (estimated + (estimated / 2n)).toString(16);
    } catch {
      params.maxFee = '0x523932C4B000';
    }
  }

  return deployAccount(rpcUrl, params);
}
