/**
 * QR Code connection transport.
 *
 * Generates QR codes for Cinacoin-style pairing URIs and
 * manages the connection lifecycle for wallet scanning.
 */

import { logger } from '@cinacoin/logger';
import { Connector } from '../connector.js';
import { EventEmitter } from '../events.js';
import { SDK } from '../errors/codes.js';
import type { ConnectParams, ConnectionResult, TransactionRequest } from '../types.js';
import { RelayTransport } from './relay.js';
import { createError, NETWORK, WALLET_CONNECT, SIGNING, TRANSACTION } from '../errors/index.js';

/** QR transport configuration. */
export interface QRTransportConfig {
  /** Relay URL for the underlying WebSocket connection. */
  relayUrl: string;
  /** QR code display timeout in milliseconds. */
  qrTimeout?: number;
  /** Project ID for relay authentication. */
  projectId: string;
}

/**
 * SDK-09 FIX: ECDH key agreement for secure session key derivation.
 *
 * Instead of embedding a symmetric key in the QR URI (which exposes it to
 * anyone who can see the QR code), we use ECDH (P-256) to establish a shared
 * secret. The QR URI contains only our public key; the wallet generates its
 * own keypair and both sides derive the same shared secret via deriveKey().
 */
interface ECDHKeyPair {
  publicKey: CryptoKey;
  privateKey: CryptoKey;
}

const ECDH_CURVE = 'P-256';
const ECDH_KDF = 'HKDF';
const ECDH_HASH = 'SHA-256';

/**
 * QRTransport enables wallet connection via QR code scanning.
 *
 * Flow:
 * 1. Generate a pairing URI with our relay endpoint
 * 2. Display as QR code for user to scan with wallet
 * 3. Wait for wallet to connect via relay WebSocket
 * 4. Establish encrypted session
 */
export class QRTransport extends Connector {
  readonly id = 'qr';
  readonly name = 'Scan QR Code';
  readonly icon = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCI+PHBhdGggZD0iTTMgMTEoOGg4VjNIM3Y4em0yLTZoNHY0SDVWNXptOC0ydjRoNHYtNGgtNHptMiAydjJoMlY3aC0yeiIvPjwvc3ZnPg==';
  readonly type = 'qr';

  private relay: RelayTransport;
  private config: Required<QRTransportConfig>;
  private currentUri: string | null = null;
  private connectedAccounts: string[] = [];
  private connectedChainId: number | null = null;
  /** SDK-09 FIX: ECDH keypair for this pairing session. */
  private ecdhKeyPair: ECDHKeyPair | null = null;
  /** SDK-09 FIX: Derived shared secret (available after wallet handshake). */
  private sharedSecret: CryptoKey | null = null;

  constructor(config: QRTransportConfig) {
    super();
    this.config = {
      relayUrl: config.relayUrl,
      qrTimeout: config.qrTimeout ?? 300_000, // 5 minutes
      projectId: config.projectId,
    };
    this.relay = new RelayTransport({ url: config.relayUrl });
    this.setupRelayListeners();
  }

  get installed(): boolean {
    // QR transport is always available — user scans with their wallet
    return true;
  }

  private setupRelayListeners(): void {
    this.relay.on('message', (_topic: unknown, payload: unknown) => {
      // Parse incoming encrypted message
      try {
        const data = JSON.parse(payload as string);
        this.emit('message', data);
      } catch (err) {
        logger.warn(`[core-sdk:setupRelayListeners] error:`, err as Record<string, unknown>);
        // Encrypted payload — will be decrypted at the session layer
        this.emit('encryptedMessage', payload);
      }
    });

    this.relay.on('connected', () => {
      this.emit('relayConnected');
    });

    this.relay.on('disconnected', () => {
      this.emit('relayDisconnected');
    });
  }

  /**
   * Generate a pairing URI for QR code display.
   *
   * SDK-09 FIX: Uses ECDH key agreement instead of a plaintext symmetric key.
   * The URI contains our ephemeral public key (safe to expose); the shared
   * secret is derived only after the wallet responds with its public key.
   *
   * @returns The pairing URI to encode as a QR code.
   */
  async generatePairingUri(): Promise<string> {
    // Connect relay first
    if (!this.relay.isConnected()) {
      await this.relay.connect();
    }

    // SDK-09 FIX: Generate ECDH keypair instead of plaintext symKey
    this.ecdhKeyPair = await this.generateECDHKeyPair();
    const publicKeyRaw = await this.exportPublicKeyRaw(this.ecdhKeyPair.publicKey);

    // Generate pairing topic
    const pairingTopic = this.generateTopic();

    // Construct Cinacoin-compatible URI — contains only the ephemeral public key
    const uri = `wc:${pairingTopic}@2?relay-protocol=ws&relay-url=${encodeURIComponent(this.config.relayUrl)}&ephemPubKey=${publicKeyRaw}`;
    this.currentUri = uri;

    // Set QR timeout
    setTimeout(() => {
      if (this.currentUri === uri) {
        this.currentUri = null;
        this.ecdhKeyPair = null;
        this.sharedSecret = null;
        this.emit('qrExpired');
      }
    }, this.config.qrTimeout);

    return uri;
  }

  /**
   * Connect via QR code.
   *
   * This generates a pairing URI and waits for the wallet to scan
   * and confirm the connection.
   *
   * @param params - Optional connection parameters.
   * @returns Connection result.
   */
  async connect(params?: ConnectParams): Promise<ConnectionResult> {
    const uri = params?.uri ?? (await this.generatePairingUri());

    // Wait for connection confirmation from relay
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.relay.off('message', handler);
        reject(createError(NETWORK.NETWORK_TIMEOUT.code, 'QR connection timed out'));
      }, this.config.qrTimeout);

      const handler = async (_topic: unknown, payload: unknown) => {
        try {
          const data = JSON.parse(payload as string);

          // SDK-09 FIX: If wallet sends its public key, derive shared secret
          if (data.method === 'wc_sessionPropose' && data.params?.ephemPubKey) {
            if (this.ecdhKeyPair) {
              try {
                this.sharedSecret = await this.deriveSharedSecret(
                  this.ecdhKeyPair.privateKey,
                  data.params.ephemPubKey,
                );
              } catch (deriveErr) {
                logger.warn(`[core-sdk:connect] ECDH derivation failed:`, deriveErr as Record<string, unknown>);
                clearTimeout(timeout);
                this.relay.off('message', handler);
                reject(createError(WALLET_CONNECT.PROTOCOL_ERROR.code, 'Key agreement failed'));
                return;
              }
            }
          }

          if (data.method === 'wc_sessionPropose') {
            clearTimeout(timeout);
            this.relay.off('message', handler);

            // In production: approve session and get accounts/chainId
            // For now, emit the proposal for UI handling
            this.emit('sessionProposal', data);
            reject(createError(WALLET_CONNECT.SESSION_PROPOSAL_REJECTED.code, 'Session proposal received — handle approval in UI layer'));
          }
        } catch (err) {
          logger.warn(`[core-sdk:connect] error:`, err as Record<string, unknown>);
          // Encrypted — ignore at transport level
        }
      };

      this.relay.on('message', handler);
    });
  }

  async disconnect(): Promise<void> {
    this.relay.disconnect();
    this.connectedAccounts = [];
    this.connectedChainId = null;
    this.currentUri = null;
    this.ecdhKeyPair = null;
    this.sharedSecret = null;
    this.emit('disconnect');
  }

  async getAccounts(): Promise<string[]> {
    return this.connectedAccounts;
  }

  async getChainId(): Promise<number> {
    if (this.connectedChainId === null) {
      throw createError(WALLET_CONNECT.SESSION_NOT_FOUND.code, 'Not connected');
    }
    return this.connectedChainId;
  }

  async switchChain(_chainId: number): Promise<void> {
    throw createError(SDK.METHOD_NOT_IMPLEMENTED.code, 'QR transport does not support chain switching directly');
  }

  async signMessage(_message: string): Promise<string> {
    throw createError(SIGNING.UNSUPPORTED_SIGNING_METHOD.code, 'Sign via session layer, not transport');
  }

  async signTransaction(_tx: TransactionRequest): Promise<string> {
    throw createError(TRANSACTION.SIMULATION_FAILED.code, 'Sign via session layer, not transport');
  }

  /** Get the current QR URI (if active). */
  getUri(): string | null {
    return this.currentUri;
  }

  /** Generate a random 32-byte topic (64 hex chars). */
  private generateTopic(): string {
    const bytes = new Uint8Array(32);
    crypto.getRandomValues(bytes);
    return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
  }

  // ============================================================
  // SDK-09 FIX: ECDH key agreement helpers (Web Crypto API)
  // ============================================================

  /**
   * Generate an ECDH key pair on the P-256 curve.
   */
  private async generateECDHKeyPair(): Promise<ECDHKeyPair> {
    const keyPair = await crypto.subtle.generateKey(
      { name: 'ECDH', namedCurve: ECDH_CURVE },
      true,  // extractable (needed for deriveKey)
      ['deriveKey', 'deriveBits'],
    );
    return { publicKey: keyPair.publicKey as CryptoKey, privateKey: keyPair.privateKey as CryptoKey };
  }

  /**
   * Export a public key as uncompressed raw hex (04 || x || y).
   */
  private async exportPublicKeyRaw(key: CryptoKey): Promise<string> {
    const raw = await crypto.subtle.exportKey('raw', key);
    return Array.from(new Uint8Array(raw), (b) => b.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Import a peer's raw public key hex for ECDH.
   */
  private async importPeerPublicKey(rawHex: string): Promise<CryptoKey> {
    const bytes = new Uint8Array(
      rawHex.match(/.{1,2}/g)!.map((b) => parseInt(b, 16)),
    );
    return crypto.subtle.importKey(
      'raw',
      bytes,
      { name: 'ECDH', namedCurve: ECDH_CURVE },
      false,
      [],
    );
  }

  /**
   * Derive a shared AES-GCM key via ECDH key agreement.
   *
   * Uses crypto.subtle.deriveKey() with:
   *   - ECDH on P-256 for key agreement (raw shared secret)
   *   - AES-GCM 256-bit as the derived key algorithm
   *
   * The pairing topic provides session uniqueness; the ECDH shared secret
   * replaces the plaintext symKey that was previously embedded in the URI.
   */
  private async deriveSharedSecret(
    privateKey: CryptoKey,
    peerPublicKeyRaw: string,
  ): Promise<CryptoKey> {
    const peerPublicKey = await this.importPeerPublicKey(peerPublicKeyRaw);

    return crypto.subtle.deriveKey(
      { name: 'ECDH', public: peerPublicKey },
      privateKey,
      { name: 'AES-GCM', length: 256 },
      true,
      ['encrypt', 'decrypt'],
    );
  }

  /**
   * Get the derived shared secret (available after wallet handshake).
   * Returns null if ECDH has not completed yet.
   */
  getSharedSecret(): CryptoKey | null {
    return this.sharedSecret;
  }
}
