/**
 * Official Sui Wallet connector.
 *
 * Connects via the `window.sui` injected object provided by the
 * official Sui Wallet browser extension.
 *
 * @module connectors/sui-wallet
 */
import type { SuiConnector, SuiPlatform, SuiFeature, SuiWalletProvider } from '../types.js';
/**
 * Connector for the official Sui Wallet browser extension.
 *
 * @example
 * ```ts
 * const connector = new SuiWalletConnector();
 * if (connector.isAvailable()) {
 *   const { accounts } = await connector.connect();
 *   console.log('Connected:', accounts[0]);
 * }
 * ```
 */
export declare class SuiWalletConnector implements SuiConnector {
    readonly id = "sui-wallet";
    readonly name = "Sui Wallet";
    readonly icon = "https://sui.io/favicon.svg";
    readonly platforms: SuiPlatform[];
    readonly supportedFeatures: SuiFeature[];
    private provider;
    /**
     * Resolve the injected provider.
     */
    private _resolveProvider;
    isAvailable(): boolean;
    getAddress(): string | null;
    getProvider(): SuiWalletProvider | null;
    /**
     * Connect to Sui Wallet.
     * Opens the wallet approval UI if not already connected.
     */
    connect(): Promise<{
        accounts: string[];
        chain?: string;
    }>;
    /**
     * Disconnect from Sui Wallet.
     */
    disconnect(): Promise<void>;
    signTransaction(tx: string): Promise<{
        bytes: string;
        signature: string;
    }>;
    signAndExecuteTransaction(tx: string, options?: {
        requestType?: 'WaitForLocalExec' | 'WaitForEffectsCert';
    }): Promise<{
        digest: string;
        effects?: unknown;
    }>;
    /**
     * Subscribe to connector events.
     */
    on(event: string, handler: (...args: unknown[]) => void): void;
    /**
     * Unsubscribe from connector events.
     */
    off(event: string, handler: (...args: unknown[]) => void): void;
    private _bindEvents;
}
//# sourceMappingURL=sui-wallet.d.ts.map