import type { XrplConnector, XrplPlatform, XrplFeature, XrplConnectionResult, XrplConnectorEvents, XrplNetwork, XrpSendParams, AccountSettingsParams, TrustLineParams, NftMintParams, NftBurnParams } from '../types';
/**
 * Shape of the Xaman (formerly Xumm) provider.
 *
 * Xaman is the primary XRPL mobile/desktop wallet.
 * It uses a payload-based signing flow via SDK or deep links.
 *
 * @see https://xaman.app/
 */
interface XamanProvider {
    request: <T = unknown>(args: {
        method: string;
        params?: unknown[] | Record<string, unknown>;
    }) => Promise<T>;
    on: (event: string, handler: (...args: unknown[]) => void) => void;
    off: (event: string, handler: (...args: unknown[]) => void) => void;
}
declare global {
    interface Window {
        xaman?: XamanProvider;
        xumm?: XamanProvider;
    }
}
/**
 * Xaman (formerly Xumm) wallet connector for the XRP Ledger.
 *
 * Detects `window.xaman` (or legacy `window.xumm`) and wraps it with
 * the standard {@link XrplConnector} interface.
 *
 * Xaman uses a payload-based flow: you submit a transaction payload,
 * the user approves it in the wallet, and you receive the signed result.
 *
 * @see https://xaman.app/
 *
 * @example
 * ```ts
 * const xaman = new XamanConnector();
 * if (xaman.isAvailable()) {
 *   const result = await xaman.connect();
 *   console.log(result.accounts); // ["rPEPPER7kfTD9w2To4CQk6UCfuHM9c6GDH"]
 * }
 * ```
 */
export declare class XamanConnector implements XrplConnector {
    readonly id = "xaman";
    readonly name = "Xaman Wallet";
    readonly icon = "data:image/svg+xml,<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 32 32\"><circle cx=\"16\" cy=\"16\" r=\"16\" fill=\"%23000\"/><text x=\"16\" y=\"22\" text-anchor=\"middle\" font-size=\"14\" fill=\"white\" font-family=\"sans-serif\" font-weight=\"bold\">X</text></svg>";
    readonly platforms: XrplPlatform[];
    readonly supportedFeatures: XrplFeature[];
    private _handlers;
    private _provider;
    constructor();
    isAvailable(): boolean;
    connect(params?: {
        network?: XrplNetwork;
    }): Promise<XrplConnectionResult>;
    disconnect(): Promise<void>;
    request<T = unknown>(args: {
        method: string;
        params?: unknown[] | Record<string, unknown>;
    }): Promise<T>;
    getAccounts(): Promise<string[]>;
    getNetwork(): Promise<XrplNetwork>;
    switchNetwork(network: XrplNetwork): Promise<void>;
    signTransaction(params: {
        transaction: Record<string, unknown>;
    }): Promise<{
        signedTransaction: Record<string, unknown>;
        txBlob: string;
    }>;
    sendXRP(params: XrpSendParams): Promise<{
        transactionHash: string;
    }>;
    getBalance(address?: string): Promise<{
        balance: string;
        unit: 'drops';
    }>;
    updateAccountSettings(params: AccountSettingsParams): Promise<{
        transactionHash: string;
    }>;
    setTrustLine(params: TrustLineParams): Promise<{
        transactionHash: string;
    }>;
    mintNFT(params: NftMintParams): Promise<{
        nftId: string;
        transactionHash: string;
    }>;
    burnNFT(params: NftBurnParams): Promise<{
        transactionHash: string;
    }>;
    on<E extends keyof XrplConnectorEvents>(event: E, handler: XrplConnectorEvents[E]): void;
    off<E extends keyof XrplConnectorEvents>(event: E, handler: XrplConnectorEvents[E]): void;
    private _captureProvider;
    private _getProviderOrThrow;
    private _bindProviderEvents;
}
/**
 * Announce the Xaman XRPL provider via EIP-6963 event.
 */
export declare function announceXamanEIP6963(): void;
export {};
//# sourceMappingURL=xaman.d.ts.map