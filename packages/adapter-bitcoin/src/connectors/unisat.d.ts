import type { BitcoinConnector, BitcoinPlatform, BitcoinFeature, BitcoinConnectionResult, BitcoinConnectorEvents, BitcoinProvider } from '../types';
declare global {
    interface Window {
        unisat?: BitcoinProvider & {
            requestAccounts?: () => Promise<string[]>;
            getAccounts?: () => Promise<string[]>;
            getNetwork?: () => Promise<string>;
            switchNetwork?: (network: string) => Promise<void>;
            signMessage?: (message: string, type?: string) => Promise<string>;
            signPsbt?: (psbt: string, options?: {
                autoFinalized?: boolean;
                signInputs?: Record<number, number[]>;
            }) => Promise<string>;
            sendBitcoin?: (toAddress: string, amount: number, feeRate?: number) => Promise<string>;
        };
    }
}
/**
 * Unisat Wallet connector for native Bitcoin.
 *
 * Detects `window.unisat` and wraps it with the standard
 * {@link BitcoinConnector} interface.
 *
 * @see https://docs.unisat.io/
 *
 * @example
 * ```ts
 * const unisat = new UnisatConnector();
 * if (unisat.isAvailable()) {
 *   const result = await unisat.connect();
 *   console.log(result.accounts); // ["bc1q...", ...]
 * }
 * ```
 */
export declare class UnisatConnector implements BitcoinConnector {
    readonly id = "unisat";
    readonly name = "Unisat Wallet";
    readonly icon = "data:image/svg+xml,<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 32 32\"><circle cx=\"16\" cy=\"16\" r=\"16\" fill=\"%23D8A852\"/><text x=\"16\" y=\"22\" text-anchor=\"middle\" font-size=\"16\" fill=\"white\" font-family=\"sans-serif\" font-weight=\"bold\">U</text></svg>";
    readonly platforms: BitcoinPlatform[];
    readonly supportedFeatures: BitcoinFeature[];
    private _handlers;
    private _provider;
    constructor();
    isAvailable(): boolean;
    connect(params?: {
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
    on<E extends keyof BitcoinConnectorEvents>(event: E, handler: BitcoinConnectorEvents[E]): void;
    off<E extends keyof BitcoinConnectorEvents>(event: E, handler: BitcoinConnectorEvents[E]): void;
    /** Capture window.unisat if available (idempotent). */
    private _captureProvider;
    private _getProviderOrThrow;
    /**
     * Try a provider-specific convenience method, falling back to
     * the generic `request()` call if the convenience method is absent.
     */
    private _safeCall;
    /** Bind provider events to our internal event system. */
    private _bindProviderEvents;
}
/**
 * Announce the Unisat Bitcoin provider via EIP-6963 event.
 * Call this during application bootstrap to enable multi-wallet discovery.
 */
export declare function announceUnisatEIP6963(): void;
//# sourceMappingURL=unisat.d.ts.map