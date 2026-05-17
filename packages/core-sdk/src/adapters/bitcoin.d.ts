/**
 * Bitcoin Chain Adapter — provides Bitcoin-specific operations.
 *
 * Supports BIP-322 message signing, PSBT (Partially Signed Bitcoin Transaction),
 * and multiple address formats: legacy (P2PKH), segwit (P2WPKH), taproot (P2TR).
 * Compatible with Xverse, Leather, and Unisat wallets.
 */
import type { Chain } from '../types.js';
/** UTXO returned by the wallet/RPC. */
export interface UTXO {
    /** Transaction ID. */
    txid: string;
    /** Output index. */
    vout: number;
    /** Value in satoshis. */
    value: number;
    /** Hex-encoded scriptPubKey. */
    scriptPubKey: string;
    /** Address (if available). */
    address?: string;
    /** Confirmations. */
    confirmations?: number;
}
/** Partially Signed Bitcoin Transaction. */
export interface PSBT {
    /** Base64-encoded PSBT. */
    toBase64(): string;
    /** Extract the final transaction (hex). */
    extractTransaction(): {
        toHex(): string;
    };
}
/** Minimal Bitcoin wallet provider (Unisat/Leather/Xverse interface). */
interface BitcoinProvider {
    /** Get connected accounts. */
    requestAccounts(): Promise<string[]>;
    /** Get the current account. */
    getAccounts(): Promise<string[]>;
    /** Get network (mainnet/testnet). */
    getNetwork?(): Promise<string>;
    /** Sign a message (BIP-322). */
    signMessage?(message: string, type?: 'ecdsa' | 'bip322-simple'): Promise<string>;
    /** Send Bitcoin. */
    sendBitcoin?(toAddress: string, satoshis: number): Promise<string>;
    /** Sign a PSBT. */
    signPsbt?(psbt: string): Promise<string>;
    /** Push a transaction. */
    pushPsbt?(psbt: string): Promise<string>;
    /** Disconnect. */
    disconnect?(): Promise<void>;
}
/** Bitcoin address format types. */
export type AddressFormat = 'legacy' | 'p2sh' | 'p2wpkh' | 'p2wsh' | 'p2tr';
/** Validate a Bitcoin address and detect its format. */
export declare function validateBitcoinAddress(address: string): {
    valid: boolean;
    format: AddressFormat | 'unknown';
};
export interface BitcoinWalletInfo {
    id: string;
    name: string;
    rdns: string;
    icon: string;
    downloadUrl: string;
}
export declare const BITCOIN_WALLETS: BitcoinWalletInfo[];
/** Well-known Bitcoin chain presets. */
export declare const BITCOIN_CHAINS: Chain[];
/**
 * Bitcoin chain adapter providing Bitcoin-specific operations.
 *
 * Supports BIP-322 message signing, PSBT building/signing, UTXO
 * management, and multiple address formats.
 */
export declare class BitcoinChainAdapter {
    private provider;
    private chains;
    private rpcUrl;
    private _connectedAddress;
    /** Register supported Bitcoin chains. */
    registerChains(chains: Chain[]): void;
    /** Set the RPC/mempool API URL. */
    setRpcUrl(url: string): void;
    /** Set the active wallet provider. */
    setProvider(provider: BitcoinProvider): void;
    /** Get the current provider. */
    getProvider(): BitcoinProvider | null;
    /**
     * Connect to a Bitcoin wallet.
     * Tries Xverse → Leather → Unisat in order.
     * @returns Array of connected addresses.
     */
    connect(walletId?: string): Promise<string[]>;
    /** Disconnect from the wallet. */
    disconnect(): Promise<void>;
    /** Get the connected address. */
    getAddress(): string | null;
    /**
     * Get BTC balance for an address.
     * @param address - Bitcoin address (any format).
     * @returns Balance in satoshis.
     */
    getBalance(address: string): Promise<number>;
    /**
     * Get formatted balance as a BTC string.
     * @param address - Bitcoin address.
     * @returns Balance as a decimal string (e.g. "0.00123456").
     */
    getBalanceFormatted(address: string): Promise<string>;
    /**
     * Get UTXOs for an address.
     * @param address - Bitcoin address.
     * @returns Array of UTXOs.
     */
    getUTXOs(address: string): Promise<UTXO[]>;
    /**
     * Select UTXOs for a target amount (coin selection).
     * Uses a simple largest-first algorithm.
     * @param utxos - Available UTXOs.
     * @param target - Target amount in satoshis.
     * @param feeRate - Fee rate in sat/vB (default: 10).
     * @returns Selected UTXOs and estimated fee.
     */
    selectUTXOs(utxos: UTXO[], target: number, feeRate?: number): {
        selected: UTXO[];
        fee: number;
        change: number;
    };
    /**
     * Sign a message using BIP-322.
     * @param message - Message to sign.
     * @param address - Address to sign with (uses connected address if not provided).
     * @returns Base64-encoded signature.
     */
    signMessage(message: string, address?: string): Promise<string>;
    /**
     * Build a PSBT for a simple transfer.
     * @param fromAddress - Sender address.
     * @param toAddress - Recipient address.
     * @param satoshis - Amount to send in satoshis.
     * @param utxos - UTXOs to spend from.
     * @param feeRate - Fee rate in sat/vB.
     * @returns Base64-encoded PSBT.
     */
    buildPSBT(fromAddress: string, toAddress: string, satoshis: number, utxos?: UTXO[], feeRate?: number): Promise<string>;
    /**
     * Sign a PSBT using the connected wallet.
     * @param psbt - Base64-encoded PSBT.
     * @returns Signed PSBT (base64).
     */
    signPSBT(psbt: string): Promise<string>;
    /**
     * Broadcast a signed PSBT.
     * @param psbt - Signed PSBT (base64).
     * @returns Transaction ID.
     */
    broadcastPSBT(psbt: string): Promise<string>;
    /**
     * Send BTC to an address.
     * @param toAddress - Recipient address.
     * @param satoshis - Amount in satoshis.
     * @param feeRate - Fee rate in sat/vB.
     * @returns Transaction ID.
     */
    sendBTC(toAddress: string, satoshis: number, feeRate?: number): Promise<string>;
    /** Convert satoshis to BTC string. */
    static satoshisToBTC(satoshis: number): string;
    /** Convert BTC to satoshis. */
    static btctToSatoshis(btc: number | string): number;
    /** Find a chain by its ID. */
    findChain(chainId: string): Chain | undefined;
    private _resolveWallet;
}
export {};
//# sourceMappingURL=bitcoin.d.ts.map