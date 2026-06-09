/**
 * Pairing protocol for WalletConnect v2.
 *
 * Handles pairing URI generation, parsing, and the full pairing lifecycle:
 * create, approve, reject, delete, ping. A pairing is the first step before
 * session establishment — it creates a secure, encrypted channel for
 * exchanging session proposals.
 */

import { generateSymKey, generateTopic, bytesToHex, hexToBytes, encrypt, decrypt } from './crypto.js';
import type { Pairing, ParsedWcUri, RelayConfig, JsonRpcRequest, JsonRpcResponse } from './types.js';
import { WcRelay } from './relay.js';

/** Configuration for creating a pairing. */
export interface PairingConfig {
  /** Relay server URL. */
  relayUrl: string;
  /** Optional existing relay instance (reuses connection). */
  relay?: WcRelay;
  /** Pairing expiry in seconds (default: 300 = 5 minutes). */
  expiry?: number;
}

// ============================================================
// URI parsing/formatting
// ============================================================

/**
 * Parse a WalletConnect v2 URI into its components.
 *
 * Format: `wc:<topic>@<version>?relay-protocol=<protocol>&relay-url=<url>&symKey=<key>&methods=<methods>`
 *
 * @param uri - WalletConnect URI string.
 * @returns Parsed components.
 */
export function parseWcUri(uri: string): ParsedWcUri {
  // Remove "wc:" prefix
  const withoutPrefix = uri.startsWith('wc:') ? uri.slice(3) : uri;

  // Split topic@version from query params
  const [topicVersion, queryString] = withoutPrefix.split('?');
  const [topic, versionStr] = topicVersion.split('@');

  const version = parseInt(versionStr, 10);
  if (version !== 2) {
    throw new Error(`Unsupported WalletConnect version: ${version}. Expected 2.`);
  }

  // Parse query params
  const params = new URLSearchParams(queryString);
  const relayProtocol = params.get('relay-protocol') ?? 'waku';
  const relayUrl = decodeURIComponent(params.get('relay-url') ?? '');
  const symKey = params.get('symKey') ?? '';

  if (!topic || !symKey) {
    throw new Error('Invalid WC URI: missing topic or symKey');
  }

  const methods = params.get('methods');

  return {
    version: 2,
    topic,
    relayProtocol,
    relayUrl,
    symKey,
    methods: methods ? methods.split(',').map((m) => m.trim()) : undefined,
  };
}

/**
 * Format a WalletConnect v2 URI from parsed components.
 *
 * @param params - Parsed WC URI components.
 * @returns Formatted WC URI string.
 */
export function formatWcUri(params: ParsedWcUri): string {
  const query = new URLSearchParams();
  query.set('relay-protocol', params.relayProtocol);
  query.set('relay-url', encodeURIComponent(params.relayUrl));
  query.set('symKey', params.symKey);
  if (params.methods?.length) {
    query.set('methods', params.methods.join(','));
  }

  return `wc:${params.topic}@${params.version}?${query.toString()}`;
}

// ============================================================
// Pairing lifecycle
// ============================================================

/**
 * Create a new pairing and generate a WC v2 URI.
 *
 * This creates a random topic and symmetric key, connects to the relay,
 * and subscribes to the pairing topic to wait for wallet response.
 *
 * @param config - Pairing configuration.
 * @returns The pairing object with the URI to display as QR code.
 */
export async function createPairing(config: PairingConfig): Promise<{
  pairing: Pairing;
  relay: WcRelay;
}> {
  const topic = generateTopic();
  const symKey = generateSymKey();
  const expiry = Date.now() + (config.expiry ?? 300) * 1000;

  const relay = config.relay ?? new WcRelay({ url: config.relayUrl });
  await relay.connect();

  // Subscribe to the pairing topic to receive wallet messages
  relay.subscribe(topic);

  const uri = formatWcUri({
    version: 2,
    topic,
    relayProtocol: 'waku',
    relayUrl: config.relayUrl,
    symKey,
  });

  const pairing: Pairing = {
    topic,
    uri,
    active: true,
    expiry,
    symKey,
  };

  return { pairing, relay };
}

/**
 * Approve a pairing by scanning/connecting to a WC URI.
 *
 * This parses the URI, connects to the relay, and subscribes to the
 * pairing topic to receive session proposals.
 *
 * @param uri - WalletConnect v2 URI.
 * @param config - Optional relay configuration override.
 * @returns The approved pairing.
 */
export async function approvePairing(
  uri: string,
  config?: Pick<PairingConfig, 'relayUrl' | 'relay'>,
): Promise<{
  pairing: Pairing;
  relay: WcRelay;
}> {
  const parsed = parseWcUri(uri);

  const relay = config?.relay ?? new WcRelay({ url: parsed.relayUrl || config?.relayUrl ?? '' });
  await relay.connect();

  relay.subscribe(parsed.topic);

  const pairing: Pairing = {
    topic: parsed.topic,
    uri,
    active: true,
    expiry: Date.now() + (config?.expiry ?? 300) * 1000,
    symKey: parsed.symKey,
  };

  return { pairing, relay };
}

/**
 * Reject a pairing by sending a delete notification.
 *
 * @param relay - Connected relay.
 * @param topic - Pairing topic.
 * @param symKey - Symmetric key for the pairing channel.
 * @param reason - Human-readable rejection reason.
 */
export async function rejectPairing(
  relay: WcRelay,
  topic: string,
  symKey: string,
  reason: string = 'User rejected',
): Promise<void> {
  await sendPairingDelete(relay, topic, symKey, 1000, reason);
}

/**
 * Delete a pairing and notify the peer.
 *
 * Sends a `wc_pairingDelete` notification and unsubscribes from the topic.
 *
 * @param relay - Connected relay.
 * @param topic - Pairing topic.
 * @param symKey - Symmetric key for the pairing channel.
 * @param code - WC error code (default: 6000 = user disconnected).
 * @param message - Human-readable reason.
 */
export async function deletePairing(
  relay: WcRelay,
  topic: string,
  symKey: string,
  code: number = 6000,
  message: string = 'User disconnected',
): Promise<void> {
  await sendPairingDelete(relay, topic, symKey, code, message);
  relay.unsubscribe(topic);
}

/**
 * Send a pairing delete notification.
 */
async function sendPairingDelete(
  relay: WcRelay,
  topic: string,
  symKey: string,
  code: number,
  message: string,
): Promise<void> {
  const notification = {
    jsonrpc: '2.0',
    method: 'wc_pairingDelete',
    params: { code, message },
  };

  const encrypted = encryptPairingMessage(symKey, notification);
  await relay.publish(topic, encrypted);
}

/**
 * Send a pairing ping and wait for pong.
 *
 * @param relay - Connected relay.
 * @param topic - Pairing topic.
 * @param symKey - Symmetric key for the pairing channel.
 * @param timeoutMs - Timeout in milliseconds (default: 5000).
 * @returns Whether the peer responded with a pong.
 */
export async function pairingPing(
  relay: WcRelay,
  topic: string,
  symKey: string,
  timeoutMs: number = 5000,
): Promise<boolean> {
  return new Promise((resolve) => {
    const id = Date.now();
    const request: JsonRpcRequest = {
      id,
      jsonrpc: '2.0',
      method: 'wc_pairingPing',
      params: {},
    };

    const handler = (payload: string) => {
      try {
        const decrypted = decryptPairingMessage(symKey, payload);
        const msg = decrypted as Record<string, unknown>;
        // Check for response to our ping
        if (msg.id === id && msg.result !== undefined) {
          relay.unsubscribe(topic, handler);
          resolve(true);
        }
        // Or check for incoming ping from peer
        if (msg.method === 'wc_pairingPing' && msg.id !== id) {
          // Respond with pong
          const pong: JsonRpcResponse = {
            id: msg.id as number,
            jsonrpc: '2.0',
            result: {},
          };
          const pongEncrypted = encryptPairingMessage(symKey, pong);
          relay.publish(topic, pongEncrypted).catch(() => {});
        }
      } catch {
        // Ignore decryption failures
      }
    };

    relay.subscribe(topic, handler);

    // Send ping
    const encrypted = encryptPairingMessage(symKey, request);
    relay.publish(topic, encrypted).catch(() => {});

    // Timeout
    setTimeout(() => {
      relay.unsubscribe(topic, handler);
      resolve(false);
    }, timeoutMs);
  });
}

// ============================================================
// Encryption helpers
// ============================================================

/**
 * Encrypt a JSON payload for the pairing channel using the symmetric key.
 *
 * @param symKey - Symmetric key (64-char hex).
 * @param payload - JSON-serializable data to encrypt.
 * @returns Base64-encoded encrypted payload.
 */
export function encryptPairingMessage(symKey: string, payload: unknown): string {
  const key = hexToBytes(symKey);
  const plaintext = new TextEncoder().encode(JSON.stringify(payload));
  return encrypt(key, plaintext);
}

/**
 * Decrypt a message from the pairing channel.
 *
 * @param symKey - Symmetric key (64-char hex).
 * @param encrypted - Base64-encoded encrypted payload.
 * @returns Decrypted JSON object.
 */
export function decryptPairingMessage(symKey: string, encrypted: string): unknown {
  const key = hexToBytes(symKey);
  const plaintext = decrypt(key, encrypted);
  return JSON.parse(new TextDecoder().decode(plaintext));
}

// ============================================================
// Validation
// ============================================================

/**
 * Validate a WC v2 URI string.
 *
 * @param uri - URI to validate.
 * @returns Whether the URI is valid.
 */
export function isValidWcUri(uri: string): boolean {
  try {
    const parsed = parseWcUri(uri);
    return (
      parsed.version === 2 &&
      parsed.topic.length === 64 &&
      parsed.symKey.length === 64 &&
      parsed.relayUrl.length > 0
    );
  } catch {
    return false;
  }
}

/**
 * Check if a pairing has expired.
 *
 * @param pairing - Pairing to check.
 * @returns Whether the pairing is expired.
 */
export function isPairingExpired(pairing: Pairing): boolean {
  return Date.now() > pairing.expiry;
}

/**
 * Check if a pairing is still valid (active and not expired).
 *
 * @param pairing - Pairing to check.
 * @returns Whether the pairing is valid.
 */
export function isPairingValid(pairing: Pairing): boolean {
  return pairing.active && !isPairingExpired(pairing);
}
