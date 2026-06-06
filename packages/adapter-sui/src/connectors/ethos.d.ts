/**
 * Ethos Wallet connector.
 *
 * Connects via the `window.ethosWallet` injected object provided by
 * the Ethos Wallet browser extension.
 *
 * @module connectors/ethos
 */
import type { SuiConnector, SuiPlatform, SuiFeature, SuiWalletProvider } from '../types.js';
/**
 * Connector for the Ethos Wallet browser extension.
 *
 * @example
 * ```ts
 * const connector = new EthosConnector();
 * if (connector.isAvailable()) {
 *   const { accounts } = await connector.connect();
 *   console.log('Connected:', accounts[0]);
 * }
 * ```
 */
export declare class EthosConnector implements SuiConnector {
    readonly id = "ethos";
    readonly name = "Ethos Wallet";
    readonly icon = "https://ethoswallet.xyz/favicon.svg";
    readonly platforms: SuiPlatform[];
    readonly supportedFeatures: SuiFeature[];
    private provider;
    /**
     * Resolve the injected Ethos Wallet provider.
     */
    private _resolveProvider;
    isAvailable(): boolean;
    getAddress(): string | null;
    getProvider(): SuiWalletProvider | null;
    /**
     * Connect to Ethos Wallet.
     */
    connect(): Promise<{
        accounts: string[];
        chain?: string;
    }>;
    /**
     * Disconnect from Ethos Wallet.
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
//# sourceMappingURL=ethos.d.ts.map