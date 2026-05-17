import type { BitcoinConnector, BitcoinPlatform, BitcoinFeature, BitcoinConnectionResult, BitcoinConnectorEvents } from '../types';
/**
 * Wallet Standard base interfaces for Bitcoin feature discovery.
 *
 * @see https://wallet-standard.com/
 * @see https://github.com/wallet-standard/wallet-standard
 */
/** Minimal Wallet Standard Wallet interface */
interface WalletStandardWallet {
    readonly version: '1.0.0';
    readonly name: string;
    readonly icon: `data:image/svg+xml;base64,${string}` | string;
    readonly chains: readonly string[];
    readonly features: Readonly<Record<string, unknown>>;
    readonly accounts: ReadonlyArray<{
        readonly address: string;
        readonly publicKey: Uint8Array;
        readonly chains: readonly string[];
        readonly features: Readonly<Record<string, unknown>>;
    }>;
}
/** Wallet Standard registry global */
interface WalletStandardWindow {
    wallets?: ReadonlyArray<WalletStandardWallet>;
    on?(callback: (wallets: ReadonlyArray<WalletStandardWallet>) => void): void;
}
declare global {
    interface Window {
        walletStandard?: WalletStandardWindow;
    }
}
/**
 * Wallet Standard connector for Bitcoin.
 *
 * Auto-discovers any wallet that implements the Wallet Standard interface
 * with Bitcoin feature support. Uses `window.walletStandard` for discovery.
 *
 * This is the most universal connector — any wallet implementing the
 * Wallet Standard protocol for Bitcoin chains will be detected and
 * usable through this connector.
 *
 * @see https://wallet-standard.com/
 *
 * @example
 * ```ts
 * const ws = new WalletStandardConnector();
 * const wallets = ws.getAvailableWallets();
 * console.log(wallets.map(w => w.name));
 *
 * if (wallets.length > 0) {
 *   const result = await ws.connect();
 *   console.log(result.accounts);
 * }
 * ```
 */
export declare class WalletStandardConnector implements BitcoinConnector {
    readonly id = "wallet-standard";
    readonly name = "Wallet Standard";
    readonly icon = "data:image/svg+xml,<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 32 32\"><circle cx=\"16\" cy=\"16\" r=\"16\" fill=\"%23000\"/><text x=\"16\" y=\"22\" text-anchor=\"middle\" font-size=\"14\" fill=\"white\" font-family=\"sans-serif\" font-weight=\"bold\">W</text></svg>";
    readonly platforms: BitcoinPlatform[];
    readonly supportedFeatures: BitcoinFeature[];
    private _handlers;
    private _selectedWallet;
    private _connectedAccounts;
    /**
     * Get all wallets registered with the Wallet Standard that support Bitcoin.
     *
     * A wallet is considered Bitcoin-compatible if its `chains` array
     * includes a Bitcoin chain identifier (e.g. "bitcoin:mainnet").
     */
    getAvailableWallets(): WalletStandardWallet[];
    /**
     * Check whether any Bitcoin-capable Wallet Standard wallet is available.
     */
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
    private _getWalletOrThrow;
    private _inferNetwork;
    private _bindWalletEvents;
}
export {};
//# sourceMappingURL=wallet-standard.d.ts.map