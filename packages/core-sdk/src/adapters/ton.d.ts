/**
 * TON Chain Adapter — provides TON-specific operations.
 *
 * Uses TON Connect protocol for wallet interactions and supports Tonkeeper,
 * OpenMask, and other TON wallets. Implements JSON-RPC over HTTP for balance
 * queries and transaction broadcasting.
 */
import type { Connector } from '../connector.js';
import type { Chain } from '../types.js';
/**
 * TON address type descriptor.
 *
 * TON uses two address encodings:
 *  - Friendly (user-facing): base64url-encoded, e.g.
 *    EQCD39VS5jcptHL8vMjEXrzGaRcCVYto7HUn4bpAOg8xqB2N
 *  - Raw: workchain:hex, e.g. 0:a4db…ff5c
 */
export type TONAddress = string;
/** TON Connect parameters for wallet pairing. */
export interface TONConnectParams {
    /** dApp manifest URL (required by TON Connect 2). */
    manifestUrl: string;
    /** Optional redirect URL after connection. */
    redirectUrl?: string;
    /** Optional bridge URL for TON Connect relay. */
    bridgeUrl?: string;
}
/** TON transaction descriptor for building transfers. */
export interface TONTransaction {
    /** Recipient address (friendly format). */
    to: TONAddress;
    /** Amount in nanotons (string to avoid precision loss). */
    value: string;
    /** Optional body (base64-encoded cell). */
    body?: string;
    /** Optional comment text. */
    comment?: string;
    /** State init (for contract deployment). */
    stateInit?: string;
}
/** Jetton transfer descriptor. */
export interface TONJettonTransfer {
    /** Jetton master/mint address. */
    jettonMaster: TONAddress;
    /** Recipient address. */
    to: TONAddress;
    /** Amount in jetton's smallest unit (string). */
    amount: string;
    /** Optional comment. */
    comment?: string;
}
/** Account info from connected wallet. */
interface TONWalletAccount {
    address: TONAddress;
    walletStateInit: string;
    publicKey: string;
}
/** Minimal TON Connect provider interface. */
interface TONProvider {
    account: TONWalletAccount | null;
    connect(params: TONConnectParams): Promise<TONWalletAccount[]>;
    disconnect(): Promise<void>;
    sendTransaction(transaction: unknown): Promise<unknown>;
    on(event: string, handler: (...args: unknown[]) => void): void;
    off(event: string, handler: (...args: unknown[]) => void): void;
    /** Request method from the wallet (optional, for advanced use). */
    request?(args: {
        method: string;
        params?: unknown[];
    }): Promise<unknown>;
}
/**
 * Validate a TON address (friendly/base64url format).
 *
 * Rules:
 *  - 48 characters for friendly addresses (EQ/EA/EV/EB + 46 chars)
 *  - 48 characters for user-friendly (UQ/UA/UV/UB + 46 chars)
 *  - Contains only base64url characters: A-Z, a-z, 0-9, _, -
 */
export declare function isValidTONAddress(address: string): boolean;
/**
 * Parse a friendly TON address into workchain and hash.
 * Returns null if the address is invalid.
 */
export declare function parseTONAddress(address: TONAddress): {
    workchain: number;
    hashHex: string;
    tag: {
        bounceable: boolean;
        testOnly: boolean;
    };
} | null;
/** Convert hex string to base64url encoding. */
export declare function hexToBase64url(hex: string): string;
/** Convert base64url to hex. */
export declare function base64urlToHex(b64: string): string;
export interface TONWalletInfo {
    id: string;
    name: string;
    rdns: string;
    icon: string;
    downloadUrl: string;
    /** TON Connect bridge URL (optional). */
    bridgeUrl?: string;
}
export declare const TON_WALLETS: TONWalletInfo[];
/** Well-known TON chain presets. */
export declare const TON_CHAINS: Chain[];
/**
 * TON chain adapter implementing chain-specific operations.
 *
 * Uses TON Connect 2.0 protocol for wallet pairing and JSON-RPC over HTTP
 * for balance queries and transaction broadcasting. Supports TON transfers,
 * Jetton (token) transfers, and message signing.
 */
export declare class TONChainAdapter {
    /** Unique adapter identifier. */
    readonly id: string;
    /** Human-readable adapter name. */
    readonly name: string;
    private provider;
    private chains;
    private rpcUrl;
    private _connectedAccount;
    /** Set the CinaConnect connector. Required by ChainAdapter interface. */
    setConnector(_connector: Connector): void;
    /** Register supported TON chains. */
    registerChains(chains: Chain[]): void;
    /** Set the RPC endpoint URL. */
    setRpcUrl(url: string): void;
    /** Find a chain by numeric ID (TON doesn't use numeric chain IDs — always undefined). */
    findChain(_chainId: number): Chain | undefined;
    /** Set the active wallet provider. */
    setProvider(provider: TONProvider): void;
    /** Get the current provider. */
    getProvider(): TONProvider | null;
    /**
     * Connect to a TON wallet.
     * Tries Tonkeeper → Tonhub → OpenMask → MyTonWallet in order.
     * @param params - TON Connect parameters (manifestUrl required).
     * @returns Array of connected addresses.
     */
    connect(params?: TONConnectParams | string): Promise<string[]>;
    /** Disconnect from the wallet. */
    disconnect(): Promise<void>;
    /** Get the connected address. */
    getAddress(): TONAddress | null;
    /**
     * Get TON balance for an address.
     * @param address - TON address (friendly or raw format).
     * @returns Balance in nanotons as a string.
     */
    getBalance(address: string): Promise<string>;
    /**
     * Get formatted balance in TON (decimal string).
     * @param address - TON address.
     * @returns Balance in TON (e.g. "12.345678901").
     */
    getBalanceFormatted(address: string): Promise<string>;
    /**
     * Build a TON transfer transaction.
     * @param to - Recipient address (friendly format).
     * @param value - Amount in nanotons (string).
     * @param comment - Optional comment to include.
     * @returns A TON transaction object ready for signing.
     */
    buildTransfer(to: TONAddress, value: string, comment?: string): TONTransaction;
    /**
     * Build a Jetton (token) transfer transaction.
     * @param params - Jetton transfer parameters.
     * @returns A TON transaction object for the jetton transfer.
     */
    buildJettonTransfer(params: TONJettonTransfer): TONTransaction;
    /**
     * Send a TON transaction via the connected wallet.
     * @param tx - TON transaction object.
     * @returns Transaction BOC (bag of cells) hash as hex string.
     */
    sendTransaction(tx: TONTransaction): Promise<string>;
    /**
     * Sign a message with the connected wallet.
     * TON Connect supports signing arbitrary payloads (cells).
     * @param message - Message to sign (string).
     * @returns Signature as a hex string.
     */
    signMessage(message: string): Promise<string>;
    /** Switch the active chain (TON adapters typically use a single chain). */
    switchChain(chainId: number): Promise<void>;
    /** Get connected account addresses. Required by ChainAdapter interface. */
    getAccounts(): Promise<string[]>;
    /** Convert nanotons to TON string. */
    static nanotonsToTON(nanotons: string | number): string;
    /** Convert TON to nanotons. */
    static tonToNanotons(ton: string | number): string;
    /** Find a TON chain by its ID string. */
    findChainById(chainId: string): Chain | undefined;
    private _resolveWallet;
    /** Encode a string into a TON Cell payload (simplified). */
    private _stringToTONCell;
    /** Encode a Jetton transfer body (simplified). */
    private _encodeJettonTransferBody;
    /** Convert bytes to base64. */
    private _bytesToBase64;
}
export {};
//# sourceMappingURL=ton.d.ts.map