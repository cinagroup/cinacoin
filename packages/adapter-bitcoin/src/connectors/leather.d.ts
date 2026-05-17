import type { BitcoinConnector, BitcoinPlatform, BitcoinFeature, BitcoinConnectionResult, BitcoinConnectorEvents } from '../types';
/**
 * Shape of the Leather Bitcoin provider injected at `window.leather`.
 *
 * @see https://leather.io/
 */
interface LeatherProvider {
    request: <T = unknown>(args: {
        method: string;
        params?: Record<string, unknown>;
    }) => Promise<T>;
    on: (event: string, handler: (...args: unknown[]) => void) => void;
    off: (event: string, handler: (...args: unknown[]) => void) => void;
}
declare global {
    interface Window {
        leather?: {
            bitcoin?: LeatherProvider;
        };
    }
}
/**
 * Leather Wallet connector for native Bitcoin.
 *
 * Detects `window.leather.bitcoin` and wraps it with the standard
 * {@link BitcoinConnector} interface.
 *
 * Leather also supports Stacks — this connector focuses on Bitcoin functionality
 * while exposing the Stacks integration surface via `request()` calls.
 *
 * @see https://leather.io/
 *
 * @example
 * ```ts
 * const leather = new LeatherConnector();
 * if (leather.isAvailable()) {
 *   const result = await leather.connect();
 *   console.log(result.accounts);
 * }
 * ```
 */
export declare class LeatherConnector implements BitcoinConnector {
    readonly id = "leather";
    readonly name = "Leather Wallet";
    readonly icon = "data:image/svg+xml,<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 32 32\"><rect width=\"32\" height=\"32\" rx=\"4\" fill=\"%233D5AFE\"/><text x=\"16\" y=\"22\" text-anchor=\"middle\" font-size=\"16\" fill=\"white\" font-family=\"sans-serif\" font-weight=\"bold\">L</text></svg>";
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
    switchNetwork(_network: string): Promise<void>;
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
/**
 * Send a Stacks request through Leather.
 *
 * Leather uses the same `window.leather` surface for Stacks operations.
 * This helper provides typed access to Stacks-specific methods.
 *
 * @param leather Connector instance
 * @param method Stacks method name (e.g. 'stx_getAddress', 'stx_signMessage')
 * @param params Method parameters
 * @returns Typed response
 */
export declare function leatherStacksRequest<T = unknown>(leather: LeatherConnector, method: string, params?: Record<string, unknown>): Promise<T>;
export {};
//# sourceMappingURL=leather.d.ts.map