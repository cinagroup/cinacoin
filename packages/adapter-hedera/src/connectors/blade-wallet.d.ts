import type { HederaConnector, HederaPlatform, HederaFeature, HederaConnectionResult, HederaConnectorEvents, HederaNetwork, HbarTransferParams, TokenTransferParams, ContractCallParams } from '../types';
/**
 * Shape of the Blade Wallet provider injected at `window.blade`.
 *
 * @see https://blade_wallet.io/
 */
interface BladeProvider {
    request: <T = unknown>(args: {
        method: string;
        params?: unknown[] | Record<string, unknown>;
    }) => Promise<T>;
    on: (event: string, handler: (...args: unknown[]) => void) => void;
    off: (event: string, handler: (...args: unknown[]) => void) => void;
}
declare global {
    interface Window {
        blade?: BladeProvider;
    }
}
/**
 * Blade Wallet connector for Hedera Hashgraph.
 *
 * Detects `window.blade` and wraps it with the standard
 * {@link HederaConnector} interface.
 *
 * @see https://blade_wallet.io/
 *
 * @example
 * ```ts
 * const blade = new BladeWalletConnector();
 * if (blade.isAvailable()) {
 *   const result = await blade.connect();
 *   console.log(result.accounts); // ["0.0.12345"]
 * }
 * ```
 */
export declare class BladeWalletConnector implements HederaConnector {
    readonly id = "blade";
    readonly name = "Blade Wallet";
    readonly icon = "data:image/svg+xml,<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 32 32\"><rect width=\"32\" height=\"32\" rx=\"4\" fill=\"%232563EB\"/><text x=\"16\" y=\"22\" text-anchor=\"middle\" font-size=\"14\" fill=\"white\" font-family=\"sans-serif\" font-weight=\"bold\">B</text></svg>";
    readonly platforms: HederaPlatform[];
    readonly supportedFeatures: HederaFeature[];
    private _handlers;
    private _provider;
    constructor();
    isAvailable(): boolean;
    connect(params?: {
        network?: HederaNetwork;
    }): Promise<HederaConnectionResult>;
    disconnect(): Promise<void>;
    request<T = unknown>(args: {
        method: string;
        params?: unknown[] | Record<string, unknown>;
    }): Promise<T>;
    getAccounts(): Promise<string[]>;
    getNetwork(): Promise<HederaNetwork>;
    switchNetwork(network: HederaNetwork): Promise<void>;
    signTransaction(params: {
        transaction: string;
    }): Promise<{
        signedTransaction: string;
    }>;
    executeTransaction(params: {
        transaction: string;
    }): Promise<{
        transactionId: string;
    }>;
    getBalance(accountId?: string): Promise<{
        balance: string;
        unit: 'tinybar';
    }>;
    transferHbar(params: HbarTransferParams): Promise<{
        transactionId: string;
    }>;
    transferToken(params: TokenTransferParams): Promise<{
        transactionId: string;
    }>;
    contractCall(params: ContractCallParams): Promise<{
        transactionId: string;
    }>;
    on<E extends keyof HederaConnectorEvents>(event: E, handler: HederaConnectorEvents[E]): void;
    off<E extends keyof HederaConnectorEvents>(event: E, handler: HederaConnectorEvents[E]): void;
    private _captureProvider;
    private _getProviderOrThrow;
    private _bindProviderEvents;
}
/**
 * Announce the Blade Hedera provider via EIP-6963 event.
 */
export declare function announceBladeEIP6963(): void;
export {};
//# sourceMappingURL=blade-wallet.d.ts.map