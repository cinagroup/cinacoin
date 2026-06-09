/**
 * Solana utility functions.
 *
 * Includes base58 encoding/decoding, lamports conversion,
 * and Associated Token Account (ATA) derivation.
 *
 * @packageDocumentation
 */

/* ------------------------------------------------------------------ */
/*  Base58                                                              */
/* ------------------------------------------------------------------ */

const BASE58_ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';

/**
 * Decode a base58-encoded string to a Uint8Array.
 */
export function base58Decode(input: string): Uint8Array {
  if (typeof input !== 'string') {
    throw new TypeError('base58Decode expects a string');
  }

  let num = 0n;
  for (let i = 0; i < input.length; i++) {
    const charIndex = BASE58_ALPHABET.indexOf(input[i]);
    if (charIndex === -1) {
      throw new Error(`Invalid base58 character: ${input[i]}`);
    }
    num = num * 58n + BigInt(charIndex);
  }

  const bytes: number[] = [];
  while (num > 0n) {
    bytes.unshift(Number(num % 256n));
    num = num / 256n;
  }

  // Add leading zeros for each '1' in the input
  for (let i = 0; i < input.length && input[i] === '1'; i++) {
    bytes.unshift(0);
  }

  return new Uint8Array(bytes);
}

/**
 * Encode a Uint8Array (or number[]) to a base58 string.
 */
export function base58Encode(bytes: Uint8Array | number[]): string {
  const src = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);

  if (src.length === 0) return '';

  let num = 0n;
  for (let i = 0; i < src.length; i++) {
    num = num * 256n + BigInt(src[i]);
  }

  let encoded = '';
  while (num > 0n) {
    const remainder = Number(num % 58n);
    encoded = BASE58_ALPHABET[remainder] + encoded;
    num = num / 58n;
  }

  // Add '1' for each leading zero byte
  for (let i = 0; i < src.length && src[i] === 0; i++) {
    encoded = '1' + encoded;
  }

  return encoded || '1';
}

/**
 * Check that a string contains only valid base58 characters.
 */
export function isValidBase58(input: string): boolean {
  for (let i = 0; i < input.length; i++) {
    if (BASE58_ALPHABET.indexOf(input[i]) === -1) return false;
  }
  return true;
}

/**
 * Validate a Solana base58 address.
 */
export function isValidSolanaAddress(address: string): boolean {
  if (typeof address !== 'string') return false;
  if (address.length < 32 || address.length > 44) return false;
  return isValidBase58(address);
}

/* ------------------------------------------------------------------ */
/*  Lamports <-> SOL conversion                                         */
/* ------------------------------------------------------------------ */

/**
 * Convert lamports to SOL (1 SOL = 10^9 lamports).
 *
 * @param lamports - Amount in lamports.
 * @returns Amount as a SOL string (e.g. "1.234").
 */
export function lamportsToSol(lamports: number | bigint | string): string {
  const lamportsNum = BigInt(lamports);
  const whole = lamportsNum / 1_000_000_000n;
  const frac = lamportsNum % 1_000_000_000n;
  if (frac === 0n) return whole.toString();
  const fracStr = frac.toString().padStart(9, '0').replace(/0+$/, '');
  return `${whole}.${fracStr}`;
}

/**
 * Convert SOL to lamports.
 *
 * @param sol - Amount in SOL (string or number).
 * @returns Amount in lamports as a bigint.
 */
export function solToLamports(sol: string | number | bigint): bigint {
  if (typeof sol === 'bigint') return sol * 1_000_000_000n;
  const str = String(sol);
  const [whole, frac] = str.split('.');
  const wholePart = BigInt(whole || '0') * 1_000_000_000n;
  if (!frac) return wholePart;
  const fracPadded = frac.padEnd(9, '0').slice(0, 9);
  return wholePart + BigInt(fracPadded);
}

/* ------------------------------------------------------------------ */
/*  Associated Token Address (ATA) derivation                           */
/* ------------------------------------------------------------------ */

/**
 * Derive the Associated Token Account address for a given wallet and mint.
 *
 * ATA derivation:
 *   seeds = [owner_pubkey_bytes, token_program_id_bytes, mint_pubkey_bytes]
 *   PDA = findProgramAddress(seeds, ATA_PROGRAM_ID)
 *
 * Uses SHA-256 (via Web Crypto API) for the PDA derivation.
 *
 * @param wallet - Owner wallet address (base58).
 * @param mint - SPL Token mint address (base58).
 * @returns The derived ATA address (base58), or null if no valid PDA found.
 */
export async function deriveAssociatedTokenAddress(
  wallet: string,
  mint: string,
  _programId?: string,
): Promise<string | null> {
  const TOKEN_PROGRAM_ID = 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA';
  const ATA_PROGRAM_ID = 'ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL';

  const ownerBytes = base58Decode(wallet);
  const tokenProgramBytes = base58Decode(TOKEN_PROGRAM_ID);
  const mintBytes = base58Decode(mint);
  const ataProgramBytes = base58Decode(ATA_PROGRAM_ID);

  // Seeds: owner + token_program_id + mint
  const seeds = new Uint8Array([
    ...ownerBytes,
    ...tokenProgramBytes,
    ...mintBytes,
  ]);

  return derivePDA(ataProgramBytes, [seeds]);
}

/**
 * Find a Program Derived Address (PDA) off-chain.
 *
 * Tries bump seeds from 255 down to 0 until a valid PDA is found.
 */
export async function derivePDA(
  programId: Uint8Array,
  seeds: Uint8Array[],
): Promise<string | null> {
  for (let bump = 255; bump >= 0; bump--) {
    const preimageParts: Uint8Array[] = [];
    for (const seed of seeds) {
      preimageParts.push(new Uint8Array([seed.length]), seed);
    }
    preimageParts.push(new Uint8Array([bump]));
    preimageParts.push(programId);

    const totalLength = preimageParts.reduce((sum, p) => sum + p.length, 0);
    const preimage = new Uint8Array(totalLength);
    let offset = 0;
    for (const part of preimageParts) {
      preimage.set(part, offset);
      offset += part.length;
    }

    const hash = await sha256(preimage);
    const hashBytes = new Uint8Array(hash);

    if (!isOnEd25519Curve(hashBytes)) {
      return base58Encode(hashBytes);
    }
  }

  return null;
}

/**
 * Compute SHA-256 hash of the input data.
 */
async function sha256(data: Uint8Array): Promise<ArrayBuffer> {
  if (typeof crypto !== 'undefined' && 'subtle' in crypto) {
    return crypto.subtle.digest('SHA-256', data.buffer as ArrayBuffer);
  }
  throw new Error(
    'SHA-256 not available. Ensure the environment supports Web Crypto API or provide a Node.js crypto implementation.',
  );
}

/**
 * Check whether a 32-byte value represents a valid ed25519 curve point.
 * A point is NOT on the curve if y-coordinate is invalid for curve25519.
 */
function isOnEd25519Curve(bytes: Uint8Array): boolean {
  const y = new Uint8Array(bytes);
  y[31] &= 0x7f; // Clear sign bit

  const p = new Uint8Array([
    0xed, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff,
    0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff,
    0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff,
    0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0x7f,
  ]);

  // Compare y < p (little-endian comparison)
  for (let i = 31; i >= 0; i--) {
    if (y[i] < p[i]) return true;
    if (y[i] > p[i]) return false;
  }

  return true;
}

/* ------------------------------------------------------------------ */
/*  Transaction serialization helpers                                   */
/* ------------------------------------------------------------------ */

/**
 * Serialize a SolanaTransaction to a JSON-compatible string for transport.
 */
export function serializeTransaction(tx: {
  feePayer: string;
  recentBlockhash: string;
  instructions: Array<{
    programId: string;
    keys: Array<{ pubkey: string; isSigner: boolean; isWritable: boolean }>;
    data: string; // hex string
  }>;
}): string {
  return JSON.stringify(tx);
}

/**
 * Deserialize a JSON string back to a SolanaTransaction.
 */
export function deserializeTransaction(serialized: string) {
  return JSON.parse(serialized);
}
