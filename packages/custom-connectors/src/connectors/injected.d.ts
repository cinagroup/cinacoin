import { ConnectorConfig, ConnectorEvents, ConnectionResult } from '../types';
/**
 * Built-in connector that detects window.ethereum and similar injected providers.
 *
 * Supports EIP-6963 multi-wallet discovery for wallets that announce themselves
 * via the `eip6963:announceProvider` mechanism.
 */
export declare class InjectedConnector implements ConnectorConfig {
    readonly id = "injected";
    readonly name = "Injected Wallet";
    readonly icon = "data:image/svg+xml,<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 24 24\"><path fill=\"%233B82F6\" d=\"M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15l-5-5 1.41-1.41L11 14.17l7.59-7.59L20 8l-9 9z\"/></svg>";
    readonly type: "injected";
    /** Active event listeners stored for cleanup */
    private _handlers;
    /** Cached provider reference */
    private _provider;
    /** Discovered EIP-6963 providers */
    private _eip6963Providers;
    /** Whether init() has been called */
    private _initialized;
    constructor();
    /**
     * Initialize the connector by capturing the current injected provider.
     */
    init(): Promise<void>;
    /**
     * Request connection from the injected provider.
     *
     * Triggers the wallet's permission prompt and returns connected accounts.
     */
    connect(_params?: Record<string, unknown>): Promise<ConnectionResult>;
    /**
     * Disconnect is a no-op for injected providers since the wallet
     * lives in the browser. We fire a disconnect event for consistency.
     */
    disconnect(): Promise<void>;
    /**
     * Forward a JSON-RPC request to the injected provider.
     */
    request(args: {
        method: string;
        params?: unknown[];
    }): Promise<unknown>;
    getAccounts(): Promise<string[]>;
    getChainId(): Promise<string>;
    /**
     * Check whether an ethereum provider is available in the current window.
     */
    isAvailable(): boolean;
    on<E extends keyof ConnectorEvents>(event: E, handler: ConnectorEvents[E]): void;
    off<E extends keyof ConnectorEvents>(event: E, handler: ConnectorEvents[E]): void;
    /**
     * Listen for EIP-6963 provider announcements to discover wallets
     * that don't set window.ethereum directly.
     */
    private _listenForEIP6963;
    private _getProviderOrThrow;
    /**
     * Bind runtime events from the provider to our internal event system.
     */
    private _bindProviderEvents;
}
//# sourceMappingURL=injected.d.ts.map