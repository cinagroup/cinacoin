/**
 * Argent X Wallet Connector.
 *
 * Interfaces with the Argent X browser extension wallet for Starknet.
 * Argent X natively supports account abstraction via the Argent account contract.
 */
import type { StarknetCall, StarknetTransactionResult, StarknetWalletConnector } from '../types.js';
/** Minimal Argent X provider type declarations. */
interface ArgentXProvider {
    id: string;
    name: string;
    icon: string;
    isConnected: boolean;
    account: StarknetAccount | null;
    enable(options?: {
        starknetVersion?: string;
    }): Promise<StarknetAccount>;
    disconnect(): Promise<void>;
    on(event: 'accountsChanged' | 'networkChanged', handler: (...args: unknown[]) => void): void;
    off(event: 'accountsChanged' | 'networkChanged', handler: (...args: unknown[]) => void): void;
    request?(args: {
        method: string;
        params?: unknown[];
    }): Promise<unknown>;
}
interface StarknetAccount {
    address: string;
    execute(calls: StarknetCall[], details?: {
        maxFee?: string;
        nonce?: string;
        version?: string;
    }): Promise<{
        transaction_hash: string;
    }>;
    estimateFee(calls: StarknetCall[]): Promise<{
        suggestedMaxFee: string;
    }>;
    signMessage(typedData: unknown): Promise<unknown>;
}
declare global {
    interface Window {
        argentX?: ArgentXProvider;
    }
}
/**
 * Argent X wallet connector for Starknet.
 *
 * Provides a standardized interface over the Argent X browser extension,
 * leveraging Starknet's native account abstraction through the Argent
 * account contract.
 */
export declare class ArgentXConnector implements StarknetWalletConnector {
    readonly id = "argent-x";
    readonly name = "Argent X";
    private provider;
    private accountAddress;
    /**
     * Check if the Argent X extension is installed.
     */
    isInstalled(): boolean;
    /**
     * Connect to Argent X wallet.
     * @returns The connected Starknet account address.
     */
    connect(): Promise<string>;
    /**
     * Disconnect from Argent X wallet.
     */
    disconnect(): Promise<void>;
    /**
     * Get the connected account address.
     */
    getAccount(): string | null;
    /**
     * Sign a Starknet transaction (does not broadcast).
     */
    signTransaction(calls: StarknetCall[]): Promise<unknown>;
    /**
     * Execute a Starknet transaction on the connected wallet.
     * Leverages native account abstraction — the wallet's account contract
     * handles fee estimation, nonce management, and validation.
     */
    executeTransaction(calls: StarknetCall[], details?: Record<string, unknown>): Promise<StarknetTransactionResult>;
    /**
     * Sign a message using the connected account.
     */
    signMessage(message: string | unknown): Promise<string>;
    /** Get the underlying provider for advanced use cases. */
    getProvider(): ArgentXProvider | null;
    private _getProvider;
}
export {};
//# sourceMappingURL=argent-x.d.ts.map