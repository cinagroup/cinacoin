/**
 * TRON Chain Adapter — provides TRON-specific operations.
 *
 * Uses TRON Link protocol for wallet interactions and supports TronLink,
 * Trust Wallet, and other TRON wallets. Implements JSON-RPC over HTTP for
 * balance queries and transaction broadcasting. Supports TRX and TRC-20 tokens.
 */
import type { Connector } from '../connector.js';
import type { Chain } from '../types.js';
/** TRON transaction descriptor for building transfers. */
export interface TRONTransaction {
    /** Recipient address (base58 format). */
    to: string;
    /** Amount in sun (string to avoid precision loss). */
    value: string;
    /** Optional data (hex string). */
    data?: string;
}
/** TRC-20 token transfer descriptor. */
export interface TRC20Transfer {
    /** TRC-20 contract address (base58). */
    contractAddress: string;
    /** Recipient address (base58). */
    to: string;
    /** Amount in token's smallest unit (string). */
    amount: string;
}
/** TRON transaction from the API. */
export interface TRONTransactionRaw {
    visible: boolean;
    txID: string;
    raw_data: {
        contract: Array<{
            parameter: {
                value: Record<string, unknown>;
                type: string;
            };
        }>;
        ref_block_bytes: string;
        ref_block_hash: string;
        expiration: number;
        timestamp: number;
        fee_limit?: number;
    };
    raw_data_hex?: string;
    signature?: string[];
}
/** Minimal TRON wallet provider interface (TronLink-compatible). */
interface TRONProvider {
    /** Ready flag set by the wallet. */
    ready?: boolean;
    /** Full name / display name. */
    tronWeb?: {
        ready?: boolean;
        address: {
            base58?: string;
            hex?: string;
        };
        trc20(contractAddress: string): {
            methods: {
                transfer(to: string, amount: string): {
                    send(options?: unknown): Promise<unknown>;
                    call(): Promise<unknown>;
                };
                balanceOf(address: string): {
                    call(): Promise<unknown>;
                };
            };
            decimals(): {
                call(): Promise<number>;
            };
            name(): {
                call(): Promise<string>;
            };
            symbol(): {
                call(): Promise<string>;
            };
        };
        trx: {
            sendTransaction(to: string, amount: number, options?: unknown): Promise<unknown>;
            sign(message: string, privateKey?: string): Promise<{
                message: string;
                signature: string;
            }>;
            getAccount(address?: string): Promise<{
                address: string;
                balance: number;
            }>;
            getBalance(address?: string): Promise<number>;
            getBlock(): Promise<{
                number: number;
            }>;
            getTransaction(txId: string): Promise<unknown>;
            sendRawTransaction(data: {
                visible: boolean;
                txID: string;
                raw_data_hex: string;
                signature: string[];
            }): Promise<unknown>;
            signTransaction(tx: unknown, privateKey?: string): Promise<unknown>;
        };
    };
    /** Connect request. */
    request(args: {
        method: string;
        params?: unknown;
    }): Promise<unknown>;
    on(event: string, handler: (...args: unknown[]) => void): void;
}
/**
 * Validate a TRON address (base58 format with 'T' prefix).
 *
 * Rules:
 *  - Starts with 'T'
 *  - Exactly 34 characters
 *  - Contains only valid base58 characters
 */
export declare function isValidTRONAddress(address: string): boolean;
/**
 * Decode a base58 string to a hex address.
 */
export declare function base58ToHex(address: string): string;
/**
 * Encode a hex string to base58.
 */
export declare function hexToBase58(hex: string): string;
export interface TRONWalletInfo {
    id: string;
    name: string;
    rdns: string;
    icon: string;
    downloadUrl: string;
}
export declare const TRON_WALLETS: TRONWalletInfo[];
/** Well-known TRON chain presets. */
export declare const TRON_CHAINS: Chain[];
/**
 * TRON chain adapter implementing chain-specific operations.
 *
 * Uses TRON Link protocol for wallet pairing and JSON-RPC over HTTP for
 * balance queries and transaction broadcasting. Supports TRX transfers,
 * TRC-20 token transfers, and message signing.
 */
export declare class TRONChainAdapter {
    /** Unique adapter identifier. */
    readonly id: string;
    /** Human-readable adapter name. */
    readonly name: string;
    private provider;
    private chains;
    private rpcUrl;
    private _connectedAddress;
    /** Set the CinaConnect connector. Required by ChainAdapter interface. */
    setConnector(_connector: Connector): void;
    /** Register supported TRON chains. */
    registerChains(chains: Chain[]): void;
    /** Set the RPC endpoint URL. */
    setRpcUrl(url: string): void;
    /** Find a chain by numeric ID (returns first chain — TRON doesn't use numeric IDs in this adapter). */
    findChain(_chainId: number): Chain | undefined;
    /** Set the active wallet provider. */
    setProvider(provider: TRONProvider): void;
    /** Get the current provider. */
    getProvider(): TRONProvider | null;
    /**
     * Connect to a TRON wallet.
     * Tries TronLink → Trust Wallet → Ledger in order.
     * @returns Array of connected addresses (base58).
     */
    connect(walletId?: string): Promise<string[]>;
    /** Disconnect from the wallet. */
    disconnect(): Promise<void>;
    /** Get the connected address. */
    getAddress(): string | null;
    /**
     * Get TRX balance for an address.
     * @param address - TRON address (base58 format).
     * @returns Balance in sun (string, 1 TRX = 1,000,000 sun).
     */
    getBalance(address: string): Promise<string>;
    /**
     * Get formatted balance in TRX (decimal string).
     * @param address - TRON address.
     * @returns Balance in TRX (e.g. "12.345678").
     */
    getBalanceFormatted(address: string): Promise<string>;
    /**
     * Get TRC-20 token balance for an address.
     * @param contractAddress - TRC-20 contract address (base58).
     * @param address - Wallet address (base58).
     * @returns Token balance in smallest unit.
     */
    getTokenBalance(contractAddress: string, address: string): Promise<string>;
    /**
     * Build a TRX transfer transaction.
     * @param to - Recipient address (base58).
     * @param value - Amount in sun (string).
     * @returns A TRON transaction object.
     */
    buildTransfer(to: string, value: string): TRONTransaction;
    /**
     * Build a TRC-20 token transfer.
     * @param params - TRC-20 transfer parameters.
     * @returns TRON transaction with TRC-20 data.
     */
    buildTRC20Transfer(params: TRC20Transfer): TRONTransaction;
    /**
     * Send a TRX transaction via the connected wallet.
     * @param tx - TRON transaction object.
     * @returns Transaction ID (hex).
     */
    sendTransaction(tx: TRONTransaction): Promise<string>;
    /**
     * Sign a message with the connected wallet.
     * @param message - Message to sign (string).
     * @returns Signature as a hex string.
     */
    signMessage(message: string): Promise<string>;
    /** Switch the active chain. */
    switchChain(chainId: number): Promise<void>;
    /** Get connected account addresses. Required by ChainAdapter interface. */
    getAccounts(): Promise<string[]>;
    /** Convert sun to TRX string. */
    static sunToTRX(sun: string | number): string;
    /** Convert TRX to sun. */
    static trxToSun(trx: string | number): string;
    /** Find a TRON chain by its ID string. */
    findChainById(chainId: string): Chain | undefined;
    private _resolveWallet;
    /** Encode TRC-20 transfer function call data. */
    private _encodeTRC20Transfer;
    /** Extract recipient from TRC-20 transfer data. */
    private _extractTRC20Recipient;
    /** Extract amount from TRC-20 transfer data. */
    private _extractTRC20Amount;
}
export {};
//# sourceMappingURL=tron.d.ts.map