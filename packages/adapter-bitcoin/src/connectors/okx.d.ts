import type { BitcoinConnector, BitcoinPlatform, BitcoinFeature, BitcoinConnectionResult, BitcoinConnectorEvents } from '../types';
/**
 * Shape of the OKX Bitcoin wallet provider injected at `window.okxwallet.btc`.
 *
 * @see https://www.okx.com/web3
 */
interface OKXBtcProvider {
    request: <T = unknown>(args: {
        method: string;
        params?: unknown[];
    }) => Promise<T>;
    on: (event: string, handler: (...args: unknown[]) => void) => void;
    off: (event: string, handler: (...args: unknown[]) => void) => void;
}
declare global {
    interface Window {
        okxwallet?: {
            /** OKX Bitcoin provider (distinct from the EVM provider) */
            btc?: OKXBtcProvider;
            /** OKX EVM provider — kept here for dual-mode detection */
            ethereum?: unknown;
        };
    }
}
/**
 * OKX Wallet Bitcoin connector.
 *
 * OKX Wallet supports dual EVM/Bitcoin mode. This connector targets
 * `window.okxwallet.btc` — the Bitcoin-specific provider — while
 * correctly handling the dual-mode environment.
 *
 * @see https://www.okx.com/web3
 *
 * @example
 * ```ts
 * const okxBtc = new OKXBitcoinConnector();
 * if (okxBtc.isAvailable()) {
 *   const result = await okxBtc.connect();
 *   console.log(result.accounts); // ["bc1q...", ...]
 * }
 * ```
 */
export declare class OKXBitcoinConnector implements BitcoinConnector {
    readonly id = "okx-btc";
    readonly name = "OKX Wallet (Bitcoin)";
    readonly icon = "data:image/svg+xml,<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 32 32\"><rect width=\"32\" height=\"32\" rx=\"4\" fill=\"%23000\"/><text x=\"16\" y=\"22\" text-anchor=\"middle\" font-size=\"14\" fill=\"white\" font-family=\"sans-serif\" font-weight=\"bold\">OKX</text></svg>";
    readonly platforms: BitcoinPlatform[];
    readonly supportedFeatures: BitcoinFeature[];
    private _handlers;
    private _provider;
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
    on<E extends keyof BitcoinConnectorEvents>(event: E, handler: BitcoinConnectorEvents[E]): void;
    off<E extends keyof BitcoinConnectorEvents>(event: E, handler: BitcoinConnectorEvents[E]): void;
    private _captureProvider;
    private _getProviderOrThrow;
    private _bindProviderEvents;
}
export {};
//# sourceMappingURL=okx.d.ts.map