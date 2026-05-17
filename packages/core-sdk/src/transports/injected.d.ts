/**
 * Injected provider transport — communicates with browser wallet extensions
 * via the EIP-1193 interface.
 *
 * This is the standard way to connect to MetaMask, Rabby, and other
 * injected wallet providers.
 */
import { Connector } from '../connector.js';
import type { ConnectParams, ConnectionResult, TransactionRequest } from '../types.js';
/**
 * InjectedProvider wraps a browser-injected EIP-1193 provider.
 *
 * It acts as both a Connector and a transport layer for direct
 * wallet-to-dApp communication without a relay.
 */
export declare class InjectedProvider extends Connector {
    readonly id: string;
    readonly name: string;
    readonly icon: string;
    readonly type = "injected";
    private _provider;
    private _installed;
    /**
     * Create an injected provider connector.
     * @param id - Unique identifier (e.g., 'io.metamask').
     * @param name - Display name.
     * @param icon - Icon URL or data URI.
     * @param provider - Optional EIP-1193 provider instance. If not provided, will auto-detect.
     */
    constructor(id: string, name: string, icon: string, provider?: EIP1193Provider);
    get installed(): boolean;
    /** Detect if the provider is available in window.ethereum. */
    private detectProvider;
    /** Get all detected EIP-1193 providers. */
    private getDetectedProviders;
    /** Set up event listeners for chain/account changes. */
    private setupEventListeners;
    connect(params?: ConnectParams): Promise<ConnectionResult>;
    disconnect(): Promise<void>;
    getAccounts(): Promise<string[]>;
    getChainId(): Promise<number>;
    switchChain(chainId: number): Promise<void>;
    signMessage(message: string): Promise<string>;
    signTransaction(tx: TransactionRequest): Promise<string>;
    /** Get the raw EIP-1193 provider for advanced usage. */
    getProvider(): EIP1193Provider | null;
    private wrapError;
}
/**
 * EIP-1193 Provider interface (subset needed for our SDK).
 */
interface EIP1193Provider {
    request(args: {
        method: string;
        params?: unknown[];
    }): Promise<unknown>;
    on(event: string, handler: (...args: unknown[]) => void): void;
    removeListener(event: string, handler: (...args: unknown[]) => void): void;
}
/** Augment Window type for ethereum property. */
declare global {
    interface Window {
        ethereum?: Record<string, unknown> & {
            isMetaMask?: boolean;
            isRabby?: boolean;
            providers?: unknown[];
            rdns?: string;
            request(args: {
                method: string;
                params?: unknown[];
            }): Promise<unknown>;
            on(event: string, handler: (...args: unknown[]) => void): void;
            removeListener(event: string, handler: (...args: unknown[]) => void): void;
        };
    }
}
export {};
//# sourceMappingURL=injected.d.ts.map