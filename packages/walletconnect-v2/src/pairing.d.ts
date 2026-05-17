/**
 * Pairing protocol for WalletConnect v2.
 *
 * Handles pairing URI generation, parsing, and the full pairing lifecycle:
 * create, approve, reject, delete, ping. A pairing is the first step before
 * session establishment — it creates a secure, encrypted channel for
 * exchanging session proposals.
 */
import type { Pairing, ParsedWcUri } from './types.js';
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
/**
 * Parse a WalletConnect v2 URI into its components.
 *
 * Format: `wc:<topic>@<version>?relay-protocol=<protocol>&relay-url=<url>&symKey=<key>&methods=<methods>`
 *
 * @param uri - WalletConnect URI string.
 * @returns Parsed components.
 */
export declare function parseWcUri(uri: string): ParsedWcUri;
/**
 * Format a WalletConnect v2 URI from parsed components.
 *
 * @param params - Parsed WC URI components.
 * @returns Formatted WC URI string.
 */
export declare function formatWcUri(params: ParsedWcUri): string;
/**
 * Create a new pairing and generate a WC v2 URI.
 *
 * This creates a random topic and symmetric key, connects to the relay,
 * and subscribes to the pairing topic to wait for wallet response.
 *
 * @param config - Pairing configuration.
 * @returns The pairing object with the URI to display as QR code.
 */
export declare function createPairing(config: PairingConfig): Promise<{
    pairing: Pairing;
    relay: WcRelay;
}>;
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
export declare function approvePairing(uri: string, config?: Pick<PairingConfig, 'relayUrl' | 'relay'>): Promise<{
    pairing: Pairing;
    relay: WcRelay;
}>;
/**
 * Reject a pairing by sending a delete notification.
 *
 * @param relay - Connected relay.
 * @param topic - Pairing topic.
 * @param symKey - Symmetric key for the pairing channel.
 * @param reason - Human-readable rejection reason.
 */
export declare function rejectPairing(relay: WcRelay, topic: string, symKey: string, reason?: string): Promise<void>;
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
export declare function deletePairing(relay: WcRelay, topic: string, symKey: string, code?: number, message?: string): Promise<void>;
/**
 * Send a pairing ping and wait for pong.
 *
 * @param relay - Connected relay.
 * @param topic - Pairing topic.
 * @param symKey - Symmetric key for the pairing channel.
 * @param timeoutMs - Timeout in milliseconds (default: 5000).
 * @returns Whether the peer responded with a pong.
 */
export declare function pairingPing(relay: WcRelay, topic: string, symKey: string, timeoutMs?: number): Promise<boolean>;
/**
 * Encrypt a JSON payload for the pairing channel using the symmetric key.
 *
 * @param symKey - Symmetric key (64-char hex).
 * @param payload - JSON-serializable data to encrypt.
 * @returns Base64-encoded encrypted payload.
 */
export declare function encryptPairingMessage(symKey: string, payload: unknown): string;
/**
 * Decrypt a message from the pairing channel.
 *
 * @param symKey - Symmetric key (64-char hex).
 * @param encrypted - Base64-encoded encrypted payload.
 * @returns Decrypted JSON object.
 */
export declare function decryptPairingMessage(symKey: string, encrypted: string): unknown;
/**
 * Validate a WC v2 URI string.
 *
 * @param uri - URI to validate.
 * @returns Whether the URI is valid.
 */
export declare function isValidWcUri(uri: string): boolean;
/**
 * Check if a pairing has expired.
 *
 * @param pairing - Pairing to check.
 * @returns Whether the pairing is expired.
 */
export declare function isPairingExpired(pairing: Pairing): boolean;
/**
 * Check if a pairing is still valid (active and not expired).
 *
 * @param pairing - Pairing to check.
 * @returns Whether the pairing is valid.
 */
export declare function isPairingValid(pairing: Pairing): boolean;
//# sourceMappingURL=pairing.d.ts.map