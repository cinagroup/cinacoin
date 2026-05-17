/**
 * Braavos Wallet Connector.
 *
 * Interfaces with the Braavos browser extension and mobile wallet for Starknet.
 * Braavos natively supports account abstraction with hardware-enclave signing.
 */
import type { StarknetCall, StarknetTransactionResult, StarknetWalletConnector } from '../types.js';
/** Minimal Braavos provider type declarations. */
interface BraavosProvider {
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
        braavos?: BraavosProvider;
    }
}
/**
 * Braavos wallet connector for Starknet.
 *
 * Provides a standardized interface over the Braavos browser extension / mobile wallet,
 * leveraging Starknet's native account abstraction through the Braavos account
 * contract with hardware-enclave security.
 */
export declare class BraavosConnector implements StarknetWalletConnector {
    readonly id = "braavos";
    readonly name = "Braavos";
    private provider;
    private accountAddress;
    /**
     * Check if the Braavos extension is installed.
     */
    isInstalled(): boolean;
    /**
     * Connect to Braavos wallet.
     * @returns The connected Starknet account address.
     */
    connect(): Promise<string>;
    /**
     * Disconnect from Braavos wallet.
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
    getProvider(): BraavosProvider | null;
    private _getProvider;
}
export {};
//# sourceMappingURL=braavos.d.ts.map