/**
 * Martian Wallet connector.
 *
 * Connects via the `window.martian` injected object provided by the
 * Martian Wallet browser extension.
 *
 * @module connectors/martian
 */
import type { SuiConnector, SuiPlatform, SuiFeature, SuiWalletProvider } from '../types.js';
/**
 * Connector for the Martian Wallet browser extension.
 *
 * @example
 * ```ts
 * const connector = new MartianConnector();
 * if (connector.isAvailable()) {
 *   const { accounts } = await connector.connect();
 *   console.log('Connected:', accounts[0]);
 * }
 * ```
 */
export declare class MartianConnector implements SuiConnector {
    readonly id = "martian";
    readonly name = "Martian Wallet";
    readonly icon = "https://martianwallet.xyz/favicon.svg";
    readonly platforms: SuiPlatform[];
    readonly supportedFeatures: SuiFeature[];
    private provider;
    /**
     * Resolve the injected Martian Wallet provider.
     */
    private _resolveProvider;
    isAvailable(): boolean;
    getAddress(): string | null;
    getProvider(): SuiWalletProvider | null;
    /**
     * Connect to Martian Wallet.
     */
    connect(): Promise<{
        accounts: string[];
        chain?: string;
    }>;
    /**
     * Disconnect from Martian Wallet.
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
//# sourceMappingURL=martian.d.ts.map