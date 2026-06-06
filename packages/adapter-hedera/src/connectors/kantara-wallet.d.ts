import type { HederaConnector, HederaPlatform, HederaFeature, HederaConnectionResult, HederaConnectorEvents, HederaNetwork, HbarTransferParams, TokenTransferParams, ContractCallParams } from '../types';
/**
 * Shape of the Kantara Wallet provider injected at `window.kantara`.
 *
 * @see https://kantarawallet.com/
 */
interface KantaraProvider {
    request: <T = unknown>(args: {
        method: string;
        params?: unknown[] | Record<string, unknown>;
    }) => Promise<T>;
    on: (event: string, handler: (...args: unknown[]) => void) => void;
    off: (event: string, handler: (...args: unknown[]) => void) => void;
}
declare global {
    interface Window {
        kantara?: KantaraProvider;
    }
}
/**
 * Kantara Wallet connector for Hedera Hashgraph.
 *
 * Detects `window.kantara` and wraps it with the standard
 * {@link HederaConnector} interface.
 *
 * @see https://kantarawallet.com/
 *
 * @example
 * ```ts
 * const kantara = new KantaraWalletConnector();
 * if (kantara.isAvailable()) {
 *   const result = await kantara.connect();
 *   console.log(result.accounts); // ["0.0.12345"]
 * }
 * ```
 */
export declare class KantaraWalletConnector implements HederaConnector {
    readonly id = "kantara";
    readonly name = "Kantara Wallet";
    readonly icon = "data:image/svg+xml,<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 32 32\"><circle cx=\"16\" cy=\"16\" r=\"16\" fill=\"%237C3AED\"/><text x=\"16\" y=\"22\" text-anchor=\"middle\" font-size=\"14\" fill=\"white\" font-family=\"sans-serif\" font-weight=\"bold\">K</text></svg>";
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
 * Announce the Kantara Hedera provider via EIP-6963 event.
 */
export declare function announceKantaraEIP6963(): void;
export {};
//# sourceMappingURL=kantara-wallet.d.ts.map