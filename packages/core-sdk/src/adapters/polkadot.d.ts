/**
 * Polkadot Chain Adapter — provides Polkadot-specific operations.
 *
 * Uses polkadot.js for wallet interactions and supports Polkadot.js Extension,
 * Talisman, and SubWallet. Implements JSON-RPC over WebSocket for balance
 * queries and transaction broadcasting. Supports DOT transfers and asset transfers.
 */
import type { Connector } from '../connector.js';
import type { Chain } from '../types.js';
/**
 * Polkadot transfer descriptor.
 */
export interface PolkadotTransaction {
    /** Recipient address (SS58 format). */
    to: string;
    /** Amount in Plancks (string to avoid precision loss). */
    value: string;
    /** Optional memo (for chains that support it). */
    memo?: string;
}
/**
 * Asset transfer descriptor for multi-asset chains.
 */
export interface PolkadotAssetTransfer {
    /** Asset ID on the chain. */
    assetId: string | number;
    /** Recipient address (SS58 format). */
    to: string;
    /** Amount in smallest unit (string). */
    amount: string;
}
/**
 * Decoded SS58 address info.
 */
export interface SS58AddressInfo {
    /** Network prefix. */
    prefix: number;
    /** Public key as hex. */
    publicKey: string;
    /** Checksum. */
    checksum: Uint8Array;
}
/** Injected account from Polkadot.js Extension. */
interface InjectedAccount {
    address: string;
    name?: string;
    genesisHash?: string | null;
}
/** Injected Polkadot signer. */
interface InjectedPolkadotSigner {
    signPayload(payload: unknown): Promise<{
        signature: string;
    }>;
    signRaw?(payload: {
        address: string;
        data: string;
        type: 'bytes';
    }): Promise<{
        signature: string;
    }>;
}
/** Minimal Polkadot provider interface. */
interface PolkadotProvider {
    /** Connected accounts. */
    accounts: InjectedAccount[];
    /** Signer interface. */
    signer: InjectedPolkadotSigner;
    /** Subscribe to account changes. */
    subscribe(cb: (accounts: InjectedAccount[]) => void): () => void;
    /** Disconnect. */
    disconnect(): Promise<void>;
}
/** Polkadot API (minimal interface for JSON-RPC). */
interface PolkadotApi {
    /** Query balance. */
    query: {
        system: {
            account(address: string): Promise<{
                data: {
                    free: string | number | bigint;
                    reserved: string | number | bigint;
                };
                nonce: number;
            }>;
        };
        balances?: {
            account(address: string): Promise<{
                data: {
                    free: string | number | bigint;
                };
            }>;
        };
        assets?: {
            account(assetId: string | number, address: string): Promise<{
                balance: string | number | bigint;
            }>;
        };
    };
    /** Get chain properties. */
    rpc: {
        system: {
            chain(): Promise<string>;
            name(): Promise<string>;
            version(): Promise<string>;
        };
    };
    /** Transaction builder. */
    tx: {
        balances: {
            transfer(dest: string, value: string | bigint | number): {
                signAndSend(from: string, options?: unknown, statusCb?: (result: unknown) => void): Promise<unknown>;
            };
            transferAll(dest: string, keepAlive?: boolean): {
                signAndSend(from: string, options?: unknown, statusCb?: (result: unknown) => void): Promise<unknown>;
            };
        };
        assets: {
            transfer(assetId: string | number, dest: string, value: string | bigint | number): {
                signAndSend(from: string, options?: unknown, statusCb?: (result: unknown) => void): Promise<unknown>;
            };
        };
    };
    /** Runtime info. */
    runtimeVersion: unknown;
    /** Genesis hash. */
    genesisHash: string;
    /** Disconnect. */
    disconnect(): Promise<void>;
}
/**
 * Decode an SS58 encoded address.
 *
 * SS58 format:
 *  - 1 byte prefix (or 2 bytes for extended prefix)
 *  - 32 bytes public key
 *  - 2 bytes Blake2b checksum
 *
 * Returns null if the address is invalid.
 */
export declare function decodeSS58(address: string): SS58AddressInfo | null;
/**
 * Validate a Polkadot SS58 address.
 * Returns true if the address is a valid SS58 encoded address.
 */
export declare function isValidSS58Address(address: string): boolean;
export interface PolkadotWalletInfo {
    id: string;
    name: string;
    rdns: string;
    icon: string;
    downloadUrl: string;
}
export declare const POLKADOT_WALLETS: PolkadotWalletInfo[];
/** Well-known Polkadot chain presets. */
export declare const POLKADOT_CHAINS: Chain[];
/**
 * Polkadot chain adapter implementing chain-specific operations.
 *
 * Uses polkadot.js for wallet interactions via the browser extension
 * injection API. Supports DOT transfers, asset transfers on multi-asset
 * chains, and message signing. Compatible with Polkadot.js Extension,
 * Talisman, and SubWallet.
 */
export declare class PolkadotChainAdapter {
    /** Unique adapter identifier. */
    readonly id: string;
    /** Human-readable adapter name. */
    readonly name: string;
    private provider;
    private api;
    private chains;
    private rpcUrl;
    private _connectedAccounts;
    /** Set the CinaConnect connector. Required by ChainAdapter interface. */
    setConnector(_connector: Connector): void;
    /** Register supported Polkadot chains. */
    registerChains(chains: Chain[]): void;
    /** Set the RPC endpoint URL (WebSocket URL). */
    setRpcUrl(url: string): void;
    /** Find a chain by numeric ID (returns first chain). */
    findChain(_chainId: number): Chain | undefined;
    /** Set the active wallet provider and API. */
    setProvider(provider: PolkadotProvider, api?: PolkadotApi): void;
    /** Get the current provider. */
    getProvider(): PolkadotProvider | null;
    /**
     * Connect to a Polkadot wallet via the injected extension.
     * Tries Polkadot.js Extension → Talisman → SubWallet in order.
     * @returns Array of connected addresses (SS58).
     */
    connect(walletId?: string): Promise<string[]>;
    /** Disconnect from the wallet. */
    disconnect(): Promise<void>;
    /** Get the connected address (first account). */
    getAddress(): string | null;
    /**
     * Get DOT balance for an address.
     * @param address - Polkadot address (SS58 format).
     * @returns Balance in Plancks (string, 1 DOT = 10^10 Plancks).
     */
    getBalance(address: string): Promise<string>;
    /**
     * Get formatted balance in DOT (decimal string).
     * @param address - Polkadot address.
     * @returns Balance in DOT (e.g. "12.3456789012").
     */
    getBalanceFormatted(address: string): Promise<string>;
    /**
     * Get asset balance for an address on a multi-asset chain.
     * @param assetId - Asset ID.
     * @param address - Polkadot address.
     * @returns Asset balance in smallest unit.
     */
    getAssetBalance(assetId: string | number, address: string): Promise<string>;
    /**
     * Build a DOT transfer.
     * @param to - Recipient address (SS58).
     * @param value - Amount in Plancks (string).
     * @returns A Polkadot transaction object.
     */
    buildTransfer(to: string, value: string): PolkadotTransaction;
    /**
     * Build an asset transfer for multi-asset chains.
     * @param params - Asset transfer parameters.
     * @returns Transaction object for asset transfer.
     */
    buildAssetTransfer(params: PolkadotAssetTransfer): PolkadotTransaction;
    /**
     * Send a DOT transfer via the connected wallet.
     * @param tx - Polkadot transaction object.
     * @returns Extrinsic hash (hex).
     */
    sendTransaction(tx: PolkadotTransaction): Promise<string>;
    /**
     * Sign a message with the connected wallet.
     * Uses polkadot.js signRaw for arbitrary message signing.
     * @param message - Message to sign (string).
     * @returns Signature as a hex string.
     */
    signMessage(message: string): Promise<string>;
    /** Switch the active chain. */
    switchChain(chainId: number): Promise<void>;
    /** Get connected account addresses. Required by ChainAdapter interface. */
    getAccounts(): Promise<string[]>;
    /** Convert Plancks to DOT string. */
    static plancksToDOT(plancks: string | number): string;
    /** Convert DOT to Plancks. */
    static dotToPlancks(dot: string | number): string;
    /** Find a Polkadot chain by its ID string. */
    findChainById(chainId: string): Chain | undefined;
    private _resolveWallet;
    private _walletToInjectedKey;
    /** Encode a string to hex for signing. */
    private _hexEncode;
    /** Query balance via JSON-RPC over WebSocket. */
    private _rpcQueryBalance;
    /** Generate storage key for balance query. */
    private _storageKeyForBalance;
    /** Send asset transfer via API. */
    private _sendAssetTransfer;
    /** Send transfer via JSON-RPC (fallback). */
    private _rpcSendTransfer;
}
export {};
//# sourceMappingURL=polkadot.d.ts.map