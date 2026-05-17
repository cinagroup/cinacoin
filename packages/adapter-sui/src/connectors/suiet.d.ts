/**
 * Suiet Wallet connector.
 *
 * Connects via the `window.suietWallet` injected object provided by
 * the Suiet Wallet browser extension.
 *
 * @module connectors/suiet
 */
import type { SuiConnector, SuiPlatform, SuiFeature, SuiWalletProvider } from '../types.js';
/**
 * Connector for the Suiet Wallet browser extension.
 *
 * @example
 * ```ts
 * const connector = new SuietConnector();
 * if (connector.isAvailable()) {
 *   const { accounts } = await connector.connect();
 *   console.log('Connected:', accounts[0]);
 * }
 * ```
 */
export declare class SuietConnector implements SuiConnector {
    readonly id = "suiet";
    readonly name = "Suiet Wallet";
    readonly icon = "https://suiet.app/favicon.svg";
    readonly platforms: SuiPlatform[];
    readonly supportedFeatures: SuiFeature[];
    private provider;
    /**
     * Resolve the injected Suiet Wallet provider.
     */
    private _resolveProvider;
    isAvailable(): boolean;
    getAddress(): string | null;
    getProvider(): SuiWalletProvider | null;
    /**
     * Connect to Suiet Wallet.
     */
    connect(): Promise<{
        accounts: string[];
        chain?: string;
    }>;
    /**
     * Disconnect from Suiet Wallet.
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
//# sourceMappingURL=suiet.d.ts.map