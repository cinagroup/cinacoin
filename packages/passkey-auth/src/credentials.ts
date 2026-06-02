/**
 * Credential response parsing and backend verification for WebAuthn.
 *
 * Handles parsing of `navigator.credentials` responses (PublicKeyCredential)
 * into JSON-friendly formats and provides server-side assertion verification.
 *
 * @packageDocumentation
 */

import { sha256 } from '@noble/hashes/sha256.js';
import { p256 } from '@noble/curves/nist.js';
import { bytesToHex, hexToBytes } from '@noble/hashes/utils.js';

// ─── Types ──────────────────────────────────────────────────────────────

/** Parsed registration response ready for server-side verification. */
export interface ParsedRegistrationResponse {
  /** Credential ID (base64url). */
  id: string;
  /** Raw credential ID bytes (base64url). */
  rawId: string;
  /** Response type discriminator. */
  type: 'public-key';
  /** Attestation response. */
  attestationObject: string;
  /** Client data JSON (base64url). */
  clientDataJSON: string;
  /** Transports (USB, NFC, BLE, etc.). */
  transports?: string[];
}

/** Parsed authentication (assertion) response ready for server-side verification. */
export interface ParsedAuthenticationResponse {
  /** Credential ID (base64url). */
  id: string;
  /** Raw credential ID bytes (base64url). */
  rawId: string;
  /** Response type discriminator. */
  type: 'public-key';
  /** Authenticator data (base64url). */
  authenticatorData: string;
  /** Client data JSON (base64url). */
  clientDataJSON: string;
  /** Signature (base64url). */
  signature: string;
  /** User handle (base64url), if present. */
  userHandle?: string;
}

/** Parsed client data from the clientDataJSON field. */
export interface ParsedClientData {
  /** Always "webauthn.create" or "webauthn.get". */
  type: string;
  /** The challenge as originally sent by the server (base64url). */
  challenge: string;
  /** The origin (scheme + host + port) of the page. */
  origin: string;
  /** Cross-origin flag. */
  crossOrigin?: boolean;
}

/** Server-side credential data for verification. */
export interface CredentialRecord {
  /** Credential ID (base64url). */
  id: string;
  /** User handle (base64url). */
  userHandle: string;
  /** Public key in COSE/SPKI format (base64url). */
  publicKey: string;
  /** Counter from last authentication. */
  counter: number;
  /** When this credential was created. */
  createdAt: string;
}

/** Result of server-side registration verification. */
export interface RegistrationVerificationResult {
  /** Whether verification succeeded. */
  verified: boolean;
  /** Parsed credential record (on success). */
  credential?: CredentialRecord;
  /** Error message (on failure). */
  error?: string;
}

/** Result of server-side authentication verification. */
export interface AuthenticationVerificationResult {
  /** Whether verification succeeded. */
  verified: boolean;
  /** Updated signature counter. */
  counter?: number;
  /** User handle. */
  userHandle?: string;
  /** Error message (on failure). */
  error?: string;
}

// ─── Base64url helpers ──────────────────────────────────────────────────

/** Encode bytes to base64url (no padding). */
export function toBase64Url(bytes: Uint8Array): string {
  return btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

/** Decode base64url string to bytes. */
export function fromBase64Url(base64url: string): Uint8Array {
  const base64 = base64url
    .replace(/-/g, '+')
    .replace(/_/g, '/')
    .padEnd(base64url.length + ((4 - (base64url.length % 4)) % 4), '=');
  return new Uint8Array(Array.from(atob(base64), (c) => c.charCodeAt(0)));
}

// ─── Uint8Array utilities ───────────────────────────────────────────────

function readUInt32BE(buf: Uint8Array, offset: number): number {
  return (
    (buf[offset] << 24) |
    (buf[offset + 1] << 16) |
    (buf[offset + 2] << 8) |
    buf[offset + 3]
  );
}

function concatBytes(...arrays: Uint8Array[]): Uint8Array {
  const total = arrays.reduce((s, a) => s + a.length, 0);
  const out = new Uint8Array(total);
  let off = 0;
  for (const a of arrays) {
    out.set(a, off);
    off += a.length;
  }
  return out;
}

// ─── Client-side parsing ────────────────────────────────────────────────

/**
 * Parse a PublicKeyCredential from `navigator.credentials.create()`
 * into a JSON-friendly registration response.
 */
export function parseRegistrationResponse(
  credential: PublicKeyCredential
): ParsedRegistrationResponse {
  const response = credential.response as AuthenticatorAttestationResponse;

  return {
    id: credential.id,
    rawId: toBase64Url(new Uint8Array(credential.rawId)),
    type: credential.type as 'public-key',
    attestationObject: toBase64Url(new Uint8Array(response.attestationObject)),
    clientDataJSON: toBase64Url(new Uint8Array(response.clientDataJSON)),
    transports: typeof response.getTransports === 'function'
      ? response.getTransports()
      : undefined,
  };
}

/**
 * Parse a PublicKeyCredential from `navigator.credentials.get()`
 * into a JSON-friendly authentication response.
 */
export function parseAuthenticationResponse(
  credential: PublicKeyCredential
): ParsedAuthenticationResponse {
  const response = credential.response as AuthenticatorAssertionResponse;

  return {
    id: credential.id,
    rawId: toBase64Url(new Uint8Array(credential.rawId)),
    type: credential.type as 'public-key',
    authenticatorData: toBase64Url(new Uint8Array(response.authenticatorData)),
    clientDataJSON: toBase64Url(new Uint8Array(response.clientDataJSON)),
    signature: toBase64Url(new Uint8Array(response.signature)),
    userHandle: response.userHandle
      ? toBase64Url(new Uint8Array(response.userHandle))
      : undefined,
  };
}

// ─── Client data parsing ────────────────────────────────────────────────

/**
 * Parse and validate the clientDataJSON from a WebAuthn response.
 */
export function parseClientDataJSON(
  clientDataJSON: string,
  expectedType: string,
  expectedChallenge: string,
  expectedOrigin: string
): ParsedClientData {
  const json = new TextDecoder().decode(fromBase64Url(clientDataJSON));
  const data = JSON.parse(json) as ParsedClientData;

  if (data.type !== expectedType) {
    throw new Error(
      `Client data type mismatch: expected "${expectedType}", got "${data.type}"`
    );
  }

  if (data.challenge !== expectedChallenge) {
    throw new Error(
      `Client data challenge mismatch: expected "${expectedChallenge}", got "${data.challenge}"`
    );
  }

  if (data.origin !== expectedOrigin) {
    throw new Error(
      `Client data origin mismatch: expected "${expectedOrigin}", got "${data.origin}"`
    );
  }

  return data;
}

// ─── Server-side verification ───────────────────────────────────────────

/**
 * Verify a WebAuthn registration (attestation) response server-side.
 */
export function verifyRegistrationResponse(
  response: ParsedRegistrationResponse,
  expectedChallenge: string,
  expectedOrigin: string,
  rpId: string
): RegistrationVerificationResult {
  try {
    // 1. Parse client data
    parseClientDataJSON(
      response.clientDataJSON,
      'webauthn.create',
      expectedChallenge,
      expectedOrigin
    );

    // 2. Hash client data JSON
    const clientDataHash = sha256(fromBase64Url(response.clientDataJSON));

    // 3. Decode attestation object
    const authData = decodeAuthenticatorData(
      fromBase64Url(response.attestationObject)
    );

    // 4. Verify authenticator data flags
    const flags = authData[32];
    const userPresent = (flags & 0x01) !== 0;
    const attestedCredentialData = (flags & 0x40) !== 0;

    if (!userPresent) {
      return { verified: false, error: 'User not present' };
    }

    if (!attestedCredentialData) {
      return { verified: false, error: 'No attested credential data' };
    }

    // 5. Extract credential public key
    const credentialData = extractAttestedCredentialData(authData);
    if (!credentialData) {
      return { verified: false, error: 'Failed to extract credential data' };
    }

    // 6. Verify RP ID hash
    const rpIdHash = authData.slice(0, 32);
    const expectedRpIdHash = sha256(new TextEncoder().encode(rpId));
    if (bytesToHex(rpIdHash) !== bytesToHex(expectedRpIdHash)) {
      return { verified: false, error: 'RP ID hash mismatch' };
    }

    // 7. Build credential record
    const credential: CredentialRecord = {
      id: response.rawId,
      userHandle: '',
      publicKey: bytesToHex(credentialData.credentialPublicKey),
      counter: readUInt32BE(authData, 40),
      createdAt: new Date().toISOString(),
    };

    return { verified: true, credential };
  } catch (error) {
    return {
      verified: false,
      error: error instanceof Error ? error.message : 'Unknown verification error',
    };
  }
}

/**
 * Verify a WebAuthn authentication (assertion) response server-side.
 */
export function verifyAuthenticationResponse(
  response: ParsedAuthenticationResponse,
  credential: CredentialRecord,
  expectedChallenge: string,
  expectedOrigin: string,
  rpId: string
): AuthenticationVerificationResult {
  try {
    // 1. Verify credential ID matches
    if (response.rawId !== credential.id) {
      return { verified: false, error: 'Credential ID mismatch' };
    }

    // 2. Parse client data
    parseClientDataJSON(
      response.clientDataJSON,
      'webauthn.get',
      expectedChallenge,
      expectedOrigin
    );

    // 3. Hash client data JSON
    const clientDataHash = sha256(fromBase64Url(response.clientDataJSON));

    // 4. Verify RP ID hash
    const authData = fromBase64Url(response.authenticatorData);
    const rpIdHash = authData.slice(0, 32);
    const expectedRpIdHash = sha256(new TextEncoder().encode(rpId));
    if (bytesToHex(rpIdHash) !== bytesToHex(expectedRpIdHash)) {
      return { verified: false, error: 'RP ID hash mismatch' };
    }

    // 5. Check user present flag
    const flags = authData[32];
    if ((flags & 0x01) === 0) {
      return { verified: false, error: 'User not present' };
    }

    // 6. Verify signature counter has not decreased
    const signatureCounter = readUInt32BE(authData, 40);
    if (credential.counter > 0 && signatureCounter <= credential.counter && signatureCounter !== 0) {
      return {
        verified: false,
        error: `Signature counter decreased: ${signatureCounter} <= ${credential.counter}`,
      };
    }

    // 7. Verify signature
    const signature = fromBase64Url(response.signature);
    const message = concatBytes(authData, clientDataHash);
    const hash = sha256(message);

    const coseKey = parseCosePublicKey(fromBase64Url(credential.publicKey));
    if (!coseKey) {
      return { verified: false, error: 'Failed to parse COSE public key' };
    }

    const valid = p256.verify(signature, hash, coseKey);
    if (!valid) {
      return { verified: false, error: 'Signature verification failed' };
    }

    return {
      verified: true,
      counter: signatureCounter,
      userHandle: response.userHandle || credential.userHandle,
    };
  } catch (error) {
    return {
      verified: false,
      error: error instanceof Error ? error.message : 'Unknown verification error',
    };
  }
}

// ─── Authenticator data parsing ─────────────────────────────────────────

/**
 * Extract authData from a CBOR-encoded attestation object.
 *
 * The attestation object is a CBOR map:
 *   { "fmt": text, "authData": bytes, "attStmt": map }
 *
 * This is a minimal parser for self-attestation (fmt = "none").
 * For production, use a proper CBOR library like `cbor-x`.
 */
function decodeAuthenticatorData(attestationBytes: Uint8Array): Uint8Array {
  // Skip CBOR map header and "fmt" key + value to reach "authData"
  // Typical layout: a3 63 66 6d 74 64 6e 6f 6e 65 68 authData 58 <len> <data>
  let offset = 0;

  // Skip map header byte
  offset += 1;

  // Skip "fmt" key (text string, len = 3: 0x63 + "fmt")
  offset += 1 + 3;

  // Skip "none" value (text string, len = 4: 0x64 + "none")
  offset += 1 + 4;

  // Skip "authData" key (text string, len = 8: 0x68 + "authData")
  offset += 1 + 8;

  // Now at authData byte string header
  // Byte string major type = 0x40
  const header = attestationBytes[offset];
  const majorType = (header >> 5) & 0x07;
  const inlineLen = header & 0x1f;

  if (majorType === 2) {
    // Byte string with inline length (≤23)
    offset += 1;
    return attestationBytes.slice(offset, offset + inlineLen);
  } else if (majorType === 3 && inlineLen === 24) {
    // Byte string with 1-byte length
    const len = attestationBytes[offset + 1];
    offset += 2;
    return attestationBytes.slice(offset, offset + len);
  }

  // Fallback: assume the authData starts after the header
  offset += 1;
  return attestationBytes.slice(offset);
}

interface AttestedCredentialData {
  aaguid: Uint8Array;
  credentialId: Uint8Array;
  credentialPublicKey: Uint8Array;
}

/**
 * Extract attested credential data from authenticator data.
 *
 * Authenticator data structure:
 * - 32 bytes: rpIdHash
 * - 1 byte: flags
 * - 4 bytes: counter
 * - 16 bytes: AAGUID
 * - 2 bytes: credential ID length
 * - N bytes: credential ID
 * - M bytes: credential public key (COSE-encoded)
 */
function extractAttestedCredentialData(
  authData: Uint8Array
): AttestedCredentialData | null {
  if (authData.length < 55) return null;

  let offset = 32 + 1 + 4; // rpIdHash + flags + counter
  const aaguid = authData.slice(offset, offset + 16);
  offset += 16;

  const credentialIdLength = readUInt32BE(new Uint8Array([0, 0, authData[offset], authData[offset + 1]]), 0);
  offset += 2;

  const credentialId = authData.slice(offset, offset + credentialIdLength);
  offset += credentialIdLength;

  const credentialPublicKey = authData.slice(offset);

  return { aaguid, credentialId, credentialPublicKey };
}

// ─── COSE public key parsing ────────────────────────────────────────────

/**
 * Parse a COSE-encoded P-256 public key to uncompressed point format.
 *
 * COSE key (EC2, P-256):
 *   map { 1: 2, 3: -7, -1: 1, -2: x (32 bytes), -3: y (32 bytes) }
 *
 * Returns 0x04 || x || y (65 bytes) or null on failure.
 */
function parseCosePublicKey(bytes: Uint8Array): Uint8Array | null {
  try {
    if (bytes.length === 65 && bytes[0] === 0x04) {
      return bytes; // Already uncompressed
    }

    // Search for x (-2 = 0x21) and y (-3 = 0x22) coordinates
    const xOff = findCoseCoord(bytes, 0x21);
    const yOff = findCoseCoord(bytes, 0x22);

    if (xOff !== -1 && yOff !== -1) {
      return concatBytes(
        new Uint8Array([0x04]),
        bytes.slice(xOff, xOff + 32),
        bytes.slice(yOff, yOff + 32)
      );
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Find a COSE coordinate value (x or y) in the byte stream.
 */
function findCoseCoord(bytes: Uint8Array, cborKey: number): number {
  for (let i = 0; i < bytes.length - 32; i++) {
    if (bytes[i] === cborKey) {
      // Next: byte string header (0x58 0x20 = 32 bytes)
      if (bytes[i + 1] === 0x58 && bytes[i + 2] === 0x20) {
        return i + 3;
      }
      // Inline 32-byte string (major type 2, value 32 = 0x58)
      if ((bytes[i + 1] & 0xe0) === 0x40 && (bytes[i + 1] & 0x1f) === 32) {
        return i + 2;
      }
    }
  }
  return -1;
}
