import type { BitcoinConnector, BitcoinPlatform, BitcoinFeature, BitcoinConnectionResult, BitcoinConnectorEvents } from '../types';
/**
 * Shape of the Xverse Wallet provider injected at `window.xverse`.
 *
 * Xverse supports both Bitcoin and Stacks chains.
 * This connector focuses on Bitcoin functionality.
 *
 * @see https://www.xverse.app/
 */
interface XverseBitcoinProvider {
    request: <T = unknown>(args: {
        method: string;
        params?: unknown[];
    }) => Promise<T>;
    on: (event: string, handler: (...args: unknown[]) => void) => void;
    removeListener: (event: string, handler: (...args: unknown[]) => void) => void;
    requestAccounts?: () => Promise<string[]>;
    getAccount?: () => Promise<{
        addresses: Array<{
            type: string;
            address: string;
            publicKey: string;
        }>;
        walletType: string;
    }>;
}
interface XverseWindow {
    bitcoin?: XverseBitcoinProvider;
}
declare global {
    interface Window {
        xverse?: XverseWindow;
    }
}
/**
 * Xverse Wallet connector for native Bitcoin (+ Stacks support).
 *
 * Detects `window.xverse.bitcoin` and wraps it with the standard
 * {@link BitcoinConnector} interface. Xverse supports both Bitcoin
 * Ordinals and Stacks — this connector covers Bitcoin operations
 * while exposing Stacks through the `request()` interface.
 *
 * @see https://www.xverse.app/
 *
 * @example
 * ```ts
 * const xverse = new XverseConnector();
 * if (xverse.isAvailable()) {
 *   const result = await xverse.connect();
 *   console.log(result.accounts); // ["bc1q...", ...]
 * }
 * ```
 */
export declare class XverseConnector implements BitcoinConnector {
    readonly id = "xverse";
    readonly name = "Xverse Wallet";
    readonly icon = "data:image/svg+xml,<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 32 32\"><rect width=\"32\" height=\"32\" rx=\"4\" fill=\"%231E1E2C\"/><text x=\"16\" y=\"22\" text-anchor=\"middle\" font-size=\"16\" fill=\"%236C5DD3\" font-family=\"sans-serif\" font-weight=\"bold\">X</text></svg>";
    readonly platforms: BitcoinPlatform[];
    readonly supportedFeatures: BitcoinFeature[];
    private _handlers;
    private _provider;
    private _connectedAccounts;
    constructor();
    isAvailable(): boolean;
    connect(_params?: {
        accounts?: string[];
    }): Promise<BitcoinConnectionResult>;
    disconnect(): Promise<void>;
    request<T = unknown>(args: {
        method: string;
        params?: unknown[];
    }): Promise<T>;
    getAccounts(): Promise<string[]>;
    getNetwork(): Promise<string>;
    switchNetwork(network: string): Promise<void>;
    signMessage(params: {
        message: string;
        address: string;
    }): Promise<{
        signature: string;
    }>;
    signPsbt(params: {
        psbt: string;
        signInputs?: Record<number, number[]>;
    }): Promise<{
        psbt: string;
    }>;
    sendTransfer(params: {
        recipient: string;
        amount: number;
        feeRate?: number;
    }): Promise<{
        txid: string;
    }>;
    /**
     * Get Stacks addresses through the Xverse provider.
     *
     * Xverse uses the same `window.xverse` surface for Stacks operations.
     */
    getStacksAccount(): Promise<{
        addresses: Array<{
            type: string;
            address: string;
            publicKey: string;
        }>;
    }>;
    /**
     * Sign a Stacks transaction through Xverse.
     */
    signStacksTransaction(params: {
        transaction: string;
    }): Promise<{
        signedTransaction: string;
    }>;
    on<E extends keyof BitcoinConnectorEvents>(event: E, handler: BitcoinConnectorEvents[E]): void;
    off<E extends keyof BitcoinConnectorEvents>(event: E, handler: BitcoinConnectorEvents[E]): void;
    private _captureProvider;
    private _getProviderOrThrow;
    private _requestAccounts;
    private _getAccount;
    private _bindProviderEvents;
}
export {};
//# sourceMappingURL=xverse.d.ts.map