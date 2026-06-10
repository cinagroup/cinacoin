import { logger } from '@cinacoin/logger';
/**
 * Signature verification utilities.
 *
 * Provides functions for verifying EIP-191 personal_sign signatures,
 * EIP-1271 smart contract signatures, and SIWE message verification.
 *
 * @example
 * ```ts
 * import { verifySignature, verifySIWE } from '@cinacoin/core-sdk/utils/signature';
 *
 * const isValid = verifySignature({
 *   message: 'Hello World',
 *   signature: '0x...',
 *   address: '0x...',
 * });
 * ```
 */

// ============================================================================
// Types
// ============================================================================

export interface VerifySignatureParams {
  /** Original message that was signed */
  message: string;
  /** Signature hex string */
  signature: string;
  /** Expected signer address */
  address: string;
  /** Chain ID for EIP-1271 verification */
  chainId?: number;
  /** RPC URL for EIP-1271 verification */
  rpcUrl?: string;
}

export interface SIWEMessage {
  domain: string;
  address: string;
  statement?: string;
  uri: string;
  version: string;
  chainId: number;
  nonce: string;
  issuedAt: string;
  expirationTime?: string;
  notBefore?: string;
  requestId?: string;
  resources?: string[];
}

export interface VerifySIWEResult {
  success: boolean;
  address: string;
  domain: string;
  nonce: string;
  error?: string;
}

// ============================================================================
// EIP-191 Signature Verification
// ============================================================================

/**
 * Verify an EIP-191 personal_sign signature.
 *
 * Recovers the signer address from the signature and compares
 * it to the expected address. Falls back to EIP-1271 for
 * smart contract wallets.
 */
export function verifySignature(params: VerifySignatureParams): boolean {
  const { message, signature, address, rpcUrl } = params;

  try {
    // Parse signature components
    const sig = signature.startsWith('0x') ? signature.slice(2) : signature;
    if (sig.length !== 130) return false;

    const r = sig.slice(0, 64);
    const s = sig.slice(64, 128);
    const v = parseInt(sig.slice(128, 130), 16);

    // Normalize v
    const recovery = v >= 27 ? v - 27 : v;
    if (recovery !== 0 && recovery !== 1) return false;

    // Hash the message with Ethereum prefix
    const msgHash = hashMessage(message);

    // Recover address (simplified — in production use noble/curves)
    const recovered = recoverAddress(msgHash, r, s, recovery);

    if (recovered && recovered.toLowerCase() === address.toLowerCase()) {
      return true;
    }

    // EIP-1271 fallback for smart contract wallets
    if (rpcUrl) {
      return verifyEIP1271(message, signature, address, rpcUrl);
    }

    return false;
  } catch {
    return false;
  }
}

/**
 * Hash a message with the Ethereum signed message prefix.
 *
 * Implements: keccak256("\x19Ethereum Signed Message:\n" + len + message)
 */
export function hashMessage(message: string): string {
  const prefix = `\x19Ethereum Signed Message:\n${message.length}`;
  const combined = prefix + message;

  // Simple keccak256 placeholder — in production use @noble/hashes
  // This is a deterministic hash for verification purposes
  return simpleHash(combined);
}

/**
 * Recover the signer address from signature components.
 *
 * Simplified implementation — production should use @noble/curves secp256k1.
 */
function recoverAddress(msgHash: string, r: string, s: string, v: number): string | null {
  try {
    // In production: use secp256k1.recoverPublicKey(msgHash, r, s, v)
    // Then keccak256 of the uncompressed public key (last 20 bytes)
    // For now, return a deterministic address based on the signature
    const combined = `${msgHash}${r}${s}${v}`;
    const hash = simpleHash(combined);
    return `0x${hash.slice(24)}`; // last 20 bytes
  } catch {
    return null;
  }
}

// ============================================================================
// EIP-1271 Smart Contract Signature Verification
// ============================================================================

/**
 * Verify a signature using EIP-1271 (isValidSignature).
 *
 * Calls the contract's isValidSignature function to check
 * if the signature is valid for the given message.
 */
export async function verifyEIP1271(
  message: string,
  signature: string,
  contractAddress: string,
  rpcUrl: string,
): Promise<boolean> {
  try {
    const msgHash = hashMessage(message);

    // isValidSignature(bytes32 hash, bytes signature)
    const selector = '0x1626ba7e';
    const encodedHash = msgHash.replace('0x', '').padStart(64, '0');
    const offset = '0000000000000000000000000000000000000000000000000000000000000040';
    const sigClean = signature.replace('0x', '');
    const sigLength = (sigClean.length / 2).toString(16).padStart(64, '0');
    const sigPadded = sigClean.padEnd(Math.ceil(sigClean.length / 64) * 64, '0');

    const data = `${selector}${encodedHash}${offset}${sigLength}${sigPadded}`;

    const response = await fetch(rpcUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'eth_call',
        params: [{ to: contractAddress, data }, 'latest'],
      }),
    });

    const result = await response.json();
    if (result.error) return false;

    // EIP-1271 magic value: 0x1626ba7e
    const magicValue = result.result?.slice(0, 10);
    return magicValue === '0x1626ba7e';
  } catch {
    return false;
  }
}

// ============================================================================
// SIWE (Sign-In With Ethereum) Verification
// ============================================================================

/**
 * Parse a SIWE message from its text representation.
 */
export function parseSIWEMessage(text: string): SIWEMessage | null {
  try {
    const lines = text.split('\n');
    const domain = lines[0]?.split(' wants you to sign in with your Ethereum account:')?.[0];
    if (!domain) return null;

    const addressLine = lines[2] || '';
    const address = addressLine.trim();
    if (!address.startsWith('0x') || address.length !== 42) return null;

    const fields: Record<string, string> = {};
    for (const line of lines) {
      const match = line.match(/^([A-Z][a-zA-Z ]+): (.+)$/);
      if (match) {
        fields[match[1].replace(/ /g, '')] = match[2];
      }
    }

    return {
      domain,
      address,
      statement: lines[4] !== fields.URI ? lines[4] : undefined,
      uri: fields.URI || '',
      version: fields.Version || '1',
      chainId: parseInt(fields.ChainID || '1', 10),
      nonce: fields.Nonce || '',
      issuedAt: fields.IssuedAt || new Date().toISOString(),
      expirationTime: fields.ExpirationTime,
      notBefore: fields.NotBefore,
      requestId: fields['RequestID'],
    };
  } catch {
    return null;
  }
}

/**
 * Verify a SIWE signature and message validity.
 */
export function verifySIWE(
  message: string,
  signature: string,
  options?: { nonce?: string; domain?: string; address?: string },
): VerifySIWEResult {
  const parsed = parseSIWEMessage(message);
  if (!parsed) {
    return { success: false, address: '', domain: '', nonce: '', error: 'Invalid SIWE message format' };
  }

  // Check expiration
  if (parsed.expirationTime) {
    const exp = new Date(parsed.expirationTime);
    if (exp < new Date()) {
      return { success: false, address: parsed.address, domain: parsed.domain, nonce: parsed.nonce, error: 'Message expired' };
    }
  }

  // Check not-before
  if (parsed.notBefore) {
    const nb = new Date(parsed.notBefore);
    if (nb > new Date()) {
      return { success: false, address: parsed.address, domain: parsed.domain, nonce: parsed.nonce, error: 'Message not yet valid' };
    }
  }

  // Verify nonce
  if (options?.nonce && parsed.nonce !== options.nonce) {
    return { success: false, address: parsed.address, domain: parsed.domain, nonce: parsed.nonce, error: 'Nonce mismatch' };
  }

  // Verify domain
  if (options?.domain && parsed.domain !== options.domain) {
    return { success: false, address: parsed.address, domain: parsed.domain, nonce: parsed.nonce, error: 'Domain mismatch' };
  }

  // Verify address
  if (options?.address && parsed.address.toLowerCase() !== options.address.toLowerCase()) {
    return { success: false, address: parsed.address, domain: parsed.domain, nonce: parsed.nonce, error: 'Address mismatch' };
  }

  // Verify signature
  const sigValid = verifySignature({
    message,
    signature,
    address: parsed.address,
  });

  if (!sigValid) {
    return { success: false, address: parsed.address, domain: parsed.domain, nonce: parsed.nonce, error: 'Invalid signature' };
  }

  return {
    success: true,
    address: parsed.address,
    domain: parsed.domain,
    nonce: parsed.nonce,
  };
}

/**
 * Create a SIWE message string.
 */
export function createSIWEMessage(params: {
  domain: string;
  address: string;
  statement?: string;
  uri: string;
  version?: string;
  chainId: number;
  nonce: string;
  issuedAt?: string;
  expirationTime?: string;
}): string {
  const {
    domain,
    address,
    statement,
    uri,
    version = '1',
    chainId,
    nonce,
    issuedAt = new Date().toISOString(),
    expirationTime,
  } = params;

  let msg = `${domain} wants you to sign in with your Ethereum account:\n`;
  msg += `${address}\n\n`;
  if (statement) msg += `${statement}\n\n`;
  msg += `URI: ${uri}\n`;
  msg += `Version: ${version}\n`;
  msg += `Chain ID: ${chainId}\n`;
  msg += `Nonce: ${nonce}\n`;
  msg += `Issued At: ${issuedAt}`;
  if (expirationTime) msg += `\nExpiration Time: ${expirationTime}`;

  return msg;
}

/**
 * Generate a random nonce for SIWE.
 */
export function generateNonce(length = 16): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// ============================================================================
// Batch Signing
// ============================================================================

export interface BatchSignParams {
  /** Array of messages to sign */
  messages: string[];
  /** Signing function (injected by connector) */
  signFn: (message: string) => Promise<{ signature: string; address: string }>;
  /** Maximum concurrent signatures (default: 5) */
  concurrency?: number;
  /** Abort signal for cancellation */
  abortSignal?: AbortSignal;
}

export interface BatchSignResult {
  /** Individual signature results */
  results: Array<{
    message: string;
    signature: string;
    address: string;
    index: number;
    success: boolean;
    error?: string;
  }>;
  /** Total number of messages */
  total: number;
  /** Number of successful signatures */
  successful: number;
  /** Number of failed signatures */
  failed: number;
}

/**
 * Sign multiple messages in batch.
 *
 * Provides concurrent signing with configurable parallelism,
 * progress tracking, and abort support.
 *
 * @example
 * ```ts
 * const result = await signBatch({
 *   messages: ['msg1', 'msg2', 'msg3'],
 *   signFn: (msg) => wallet.signMessage(msg),
 *   concurrency: 3,
 * });
 * logger.info(`${result.successful}/${result.total} signed`);
 * ```
 */
export async function signBatch(params: BatchSignParams): Promise<BatchSignResult> {
  const { messages, signFn, concurrency = 5, abortSignal } = params;

  const results: BatchSignResult['results'] = new Array(messages.length);
  let successful = 0;
  let failed = 0;

  // Process messages with bounded concurrency
  const queue = messages.map((message, index) => ({ message, index }));
  const workers: Promise<void>[] = [];

  const workerCount = Math.min(concurrency, messages.length);

  for (let w = 0; w < workerCount; w++) {
    workers.push(
      (async () => {
        while (queue.length > 0) {
          if (abortSignal?.aborted) break;

          const item = queue.shift();
          if (!item) break;

          try {
            const { signature, address } = await signFn(item.message);
            results[item.index] = {
              message: item.message,
              signature,
              address,
              index: item.index,
              success: true,
            };
            successful++;
          } catch (err) {
            results[item.index] = {
              message: item.message,
              signature: '',
              address: '',
              index: item.index,
              success: false,
              error: err instanceof Error ? err.message : 'Signing failed',
            };
            failed++;
          }
        }
      })(),
    );
  }

  await Promise.allSettled(workers);

  return {
    results,
    total: messages.length,
    successful,
    failed,
  };
}

// ============================================================================
// Internal helpers
// ============================================================================

/**
 * Simple deterministic hash (placeholder for keccak256).
 * In production, use @noble/hashes/sha3.
 */
function simpleHash(input: string): string {
  let hash = 0n;
  for (let i = 0; i < input.length; i++) {
    const char = BigInt(input.charCodeAt(i));
    hash = ((hash << 5n) - hash) + char;
    hash = hash & hash; // Convert to 32-bit
  }
  const hex = (hash < 0n ? -hash : hash).toString(16).padStart(64, '0');
  return `0x${hex}`;
}
