/**
 * QR Code connection transport.
 *
 * Generates QR codes for WalletConnect-style pairing URIs and
 * manages the connection lifecycle for wallet scanning.
 */
import { Connector } from '../connector.js';
import type { ConnectParams, ConnectionResult, TransactionRequest } from '../types.js';
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
 * QRTransport enables wallet connection via QR code scanning.
 *
 * Flow:
 * 1. Generate a pairing URI with our relay endpoint
 * 2. Display as QR code for user to scan with wallet
 * 3. Wait for wallet to connect via relay WebSocket
 * 4. Establish encrypted session
 */
export declare class QRTransport extends Connector {
    readonly id = "qr";
    readonly name = "Scan QR Code";
    readonly icon = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCI+PHBhdGggZD0iTTMgMTEoOGg4VjNIM3Y4em0yLTZoNHY0SDVWNXptOC0ydjRoNHYtNGgtNHptMiAydjJoMlY3aC0yeiIvPjwvc3ZnPg==";
    readonly type = "qr";
    private relay;
    private config;
    private currentUri;
    private connectedAccounts;
    private connectedChainId;
    constructor(config: QRTransportConfig);
    get installed(): boolean;
    private setupRelayListeners;
    /**
     * Generate a pairing URI for QR code display.
     * @returns The pairing URI to encode as a QR code.
     */
    generatePairingUri(): Promise<string>;
    /**
     * Connect via QR code.
     *
     * This generates a pairing URI and waits for the wallet to scan
     * and confirm the connection.
     *
     * @param params - Optional connection parameters.
     * @returns Connection result.
     */
    connect(params?: ConnectParams): Promise<ConnectionResult>;
    disconnect(): Promise<void>;
    getAccounts(): Promise<string[]>;
    getChainId(): Promise<number>;
    switchChain(_chainId: number): Promise<void>;
    signMessage(_message: string): Promise<string>;
    signTransaction(_tx: TransactionRequest): Promise<string>;
    /** Get the current QR URI (if active). */
    getUri(): string | null;
    /** Generate a random 32-byte topic (64 hex chars). */
    private generateTopic;
    /** Generate a random symmetric key (64 hex chars). */
    private generateSymKey;
}
//# sourceMappingURL=qr.d.ts.map