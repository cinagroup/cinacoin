import { ConnectorConfig, ConnectorEvents, ConnectionResult } from '../types';
/**
 * QR code wallet connector.
 *
 * Generates a WalletConnect URI and renders a QR code for mobile wallet pairing.
 * Falls back to a deep link URL for mobile browsers where QR scanning isn't possible.
 */
export declare class QRConnector implements ConnectorConfig {
    readonly id = "qr";
    readonly name = "Scan QR Code";
    readonly icon = "data:image/svg+xml,<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 24 24\"><path fill=\"%2310B981\" d=\"M3 3h8v8H3V3zm2 2v4h4V5H5zm8-2h8v8h-8V3zm2 2v4h4V5h-4zM3 13h8v8H3v-8zm2 2v4h4v-4H5zm10 0h2v2h-2v-2zm4 0h2v2h-2v-2zm-4 4h2v2h-2v-2zm2 2h2v2h-2v-2zm2-2h2v2h-2v-2z\"/></svg>";
    readonly type: "qr";
    /** Internal event handlers */
    private _handlers;
    /** Current WalletConnect URI */
    private _uri;
    /** Whether we have an active session */
    private _connected;
    /** Cached accounts */
    private _accounts;
    /** Cached chain ID */
    private _chainId;
    /** WalletConnect relay project ID */
    private _projectId;
    /** Core SDK SignClient (lazily initialized) */
    private _signClient;
    /** Active session topic */
    private _sessionTopic;
    constructor(projectId?: string);
    /**
     * Initialize the connector by creating a SignClient instance.
     */
    init(): Promise<void>;
    /**
     * Start a WalletConnect pairing session.
     *
     * If a URI is provided (e.g. from a QR scan), it pairs directly.
     * Otherwise a new connection URI is generated for display as a QR code.
     */
    connect(params?: Record<string, unknown>): Promise<ConnectionResult>;
    /**
     * Disconnect the active WalletConnect session.
     */
    disconnect(): Promise<void>;
    /**
     * Forward a JSON-RPC request through the WalletConnect session.
     */
    request(args: {
        method: string;
        params?: unknown[];
    }): Promise<unknown>;
    getAccounts(): Promise<string[]>;
    getChainId(): Promise<string>;
    /**
     * QR connector is always "available" since it works on any device
     * (mobile or desktop) as long as the browser is present.
     */
    isAvailable(): boolean;
    /**
     * Get the current WalletConnect URI for QR code rendering.
     * Returns null if no URI has been generated yet.
     */
    getURI(): string | null;
    /**
     * Build a deep-link URL for mobile wallets that support it.
     *
     * @param walletDeepLink - Wallet's URL scheme (e.g. "metamask://wc?uri=")
     * @returns Full deep-link URL with encoded URI
     */
    getDeepLink(walletDeepLink: string): string | null;
    on<E extends keyof ConnectorEvents>(event: E, handler: ConnectorEvents[E]): void;
    off<E extends keyof ConnectorEvents>(event: E, handler: ConnectorEvents[E]): void;
    private _getClientOrThrow;
    /**
     * Bind session-level events to our internal event system.
     */
    private _bindSessionEvents;
}
//# sourceMappingURL=qr.d.ts.map