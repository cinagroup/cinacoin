/**
 * Keplr wallet connector for Cosmos SDK chains.
 *
 * Detects `window.keplr` and provides a uniform `CosmosWalletConnector`
 * interface for signing transactions, querying accounts, and sending
 * token transfers across all Cosmos SDK chains supported by Keplr.
 *
 * @see https://docs.keplr.app/api/
 */
import type { CosmosWalletConnector, SignDoc } from '../types.js';
/** Minimal type declarations for the Keplr browser extension API. */
interface KeplrChainInfo {
    chainId: string;
    chainName: string;
    rpc: string;
    rest: string;
    stakeCurrency: {
        coinDenom: string;
        coinMinimalDenom: string;
        coinDecimals: number;
    };
    bip44: {
        coinType: number;
    };
    bech32Config: {
        bech32PrefixAccAddr: string;
        bech32PrefixAccPub: string;
        bech32PrefixValAddr: string;
        bech32PrefixValPub: string;
        bech32PrefixConsAddr: string;
        bech32PrefixConsPub: string;
    };
    currencies: Array<{
        coinDenom: string;
        coinMinimalDenom: string;
        coinDecimals: number;
    }>;
    feeCurrencies: Array<{
        coinDenom: string;
        coinMinimalDenom: string;
        coinDecimals: number;
        gasPriceStep?: {
            low: number;
            average: number;
            high: number;
        };
    }>;
}
interface KeplrAccount {
    address: string;
    algo: string;
    pubKey: Uint8Array;
}
interface KeplrOfflineSigner {
    getChainId(): Promise<string>;
    getAccounts(): Promise<KeplrAccount[]>;
    signDirect(signerAddress: string, signDoc: {
        bodyBytes: Uint8Array;
        authInfoBytes: Uint8Array;
        chainId: string;
        accountNumber: bigint;
    }): Promise<{
        signature: Uint8Array;
        signed: {
            bodyBytes: Uint8Array;
            authInfoBytes: Uint8Array;
            chainId: string;
            accountNumber: bigint;
        };
    }>;
    signArbitrary(signerAddress: string, data: string | Uint8Array): Promise<{
        signature: Uint8Array;
    }>;
}
/** The global `window.keplr` object provided by the Keplr extension. */
interface KeplrProvider {
    enable(chainId: string): Promise<void>;
    disconnect(): Promise<void>;
    getKey(chainId: string): Promise<{
        name: string;
        algo: string;
        pubKey: Uint8Array;
        address: Uint8Array;
        bech32Address: string;
    }>;
    suggestToken(chainId: string, contractAddress: string): Promise<void>;
    experimentalSuggestChain(chainInfo: KeplrChainInfo): Promise<void>;
    getOfflineSigner(chainId: string): KeplrOfflineSigner;
    getOfflineSignerOnlyAmino(chainId: string): KeplrOfflineSigner;
    getOfflineSignerAuto(chainId: string): Promise<KeplrOfflineSigner>;
    signAmino(chainId: string, signerAddress: string, signDoc: unknown): Promise<{
        signed: unknown;
        signature: unknown;
    }>;
    signDirect(chainId: string, signerAddress: string, signDoc: unknown): Promise<{
        signed: unknown;
        signature: unknown;
    }>;
    signArbitrary(chainId: string, signerAddress: string, data: string | Uint8Array): Promise<{
        signature: Uint8Array;
    }>;
    sendTx(chainId: string, tx: Uint8Array, mode: 'sync' | 'async' | 'block'): Promise<Uint8Array>;
    on(event: string, handler: (event: unknown) => void): void;
    defaultOptions?: {
        sign?: {
            preferNoSetFee?: boolean;
            disableBalanceCheck?: boolean;
        };
        fee?: {
            autoGasMultiplier?: number;
            defaultGas?: string;
        };
    };
}
/**
 * Keplr wallet connector implementing `CosmosWalletConnector`.
 *
 * Wraps the Keplr browser extension API to provide chain-agnostic
 * signing, transfer, and account querying capabilities.
 */
export declare class KeplrConnector implements CosmosWalletConnector {
    /** @inheritdoc */
    readonly id = "keplr";
    /** @inheritdoc */
    readonly name = "Keplr";
    private _keplr;
    private _connectedChainId;
    /**
     * Check whether the Keplr extension is installed.
     *
     * In browser environments, looks for `window.keplr`.
     * Returns `false` in SSR / Node.js contexts.
     */
    isAvailable(): boolean;
    /**
     * Retrieve the Keplr provider from `window.keplr`.
     *
     * Waits for the `keplr_keystorechange` event to ensure the extension
     * has fully initialized before returning the provider.
     *
     * @param timeoutMs - Max wait time in ms (default 5000).
     * @returns The Keplr provider.
     */
    getProvider(timeoutMs?: number): Promise<KeplrProvider>;
    /**
     * Connect to Keplr and enable access for the specified chain.
     *
     * Prompts the user to approve the connection if not already granted.
     *
     * @param chainId - Cosmos chain ID (e.g. "cosmoshub-4").
     * @returns Connected address and chain ID.
     */
    connect(chainId: string): Promise<{
        address: string;
        chainId: string;
    }>;
    /**
     * Disconnect from Keplr and revoke all chain permissions.
     */
    disconnect(): Promise<void>;
    /**
     * Get accounts available on the given chain.
     *
     * @param chainId - Cosmos chain ID.
     * @returns Array of account objects with address, algo, and pubkey.
     */
    getAccounts(chainId: string): Promise<Array<{
        address: string;
        algo: string;
        pubkey: Uint8Array;
    }>>;
    /**
     * Get the current chain ID from the offline signer.
     *
     * @param chainId - The chain to query.
     * @returns Chain ID string.
     */
    getChainId(chainId: string): Promise<string>;
    /**
     * Sign a Cosmos SignDoc (proto-based transaction).
     *
     * Uses Keplr's `signDirect` method for ADR-036 compliant signing.
     *
     * @param signerAddress - Bech32 address of the signer.
     * @param signDoc - Transaction document to sign.
     * @returns Signature and signed document.
     */
    sign(signerAddress: string, signDoc: SignDoc): Promise<{
        signature: Uint8Array;
        signed: SignDoc;
    }>;
    /**
     * Sign arbitrary text/data (off-chain message signing).
     *
     * Uses Keplr's `signArbitrary` method. Useful for authentication
     * and data integrity verification.
     *
     * @param signerAddress - Bech32 address of the signer.
     * @param data - Data to sign (string or bytes).
     * @returns Signature bytes.
     */
    signArbitrary(signerAddress: string, data: string | Uint8Array): Promise<{
        signature: Uint8Array;
    }>;
    /**
     * Send a token transfer through Keplr.
     *
     * Delegates to the wallet's built-in transfer flow.
     *
     * @param chainId - Target chain ID.
     * @param recipient - Recipient bech32 address.
     * @param amount - Amount in smallest unit (string).
     * @param denom - Token denomination (e.g. "uatom").
     * @param memo - Optional memo / note.
     * @returns Transaction hash.
     */
    sendTransfer(chainId: string, recipient: string, amount: string, denom: string, memo?: string): Promise<string>;
    /**
     * Suggest a custom chain to Keplr.
     *
     * Useful for chains not included in Keplr's default registry.
     *
     * @param chainInfo - Chain configuration.
     */
    suggestChain(chainInfo: {
        chainId: string;
        chainName: string;
        rpc: string;
        rest: string;
        stakeCurrency: {
            coinDenom: string;
            coinMinimalDenom: string;
            coinDecimals: number;
        };
        bip44: {
            coinType: number;
        };
        bech32Config: {
            bech32PrefixAccAddr: string;
            bech32PrefixAccPub: string;
            bech32PrefixValAddr: string;
            bech32PrefixValPub: string;
            bech32PrefixConsAddr: string;
            bech32PrefixConsPub: string;
        };
        currencies: Array<{
            coinDenom: string;
            coinMinimalDenom: string;
            coinDecimals: number;
        }>;
        feeCurrencies: Array<{
            coinDenom: string;
            coinMinimalDenom: string;
            coinDecimals: number;
            gasPriceStep?: {
                low: number;
                average: number;
                high: number;
            };
        }>;
    }): Promise<void>;
    /**
     * Listen for Keplr keystore change events.
     *
     * Fires when the user switches accounts or chains in the extension.
     *
     * @param handler - Event handler callback.
     */
    onKeystoreChange(handler: (event: unknown) => void): void;
    /**
     * Remove a keystore change event listener.
     */
    offKeystoreChange(handler: (event: unknown) => void): void;
    /** Get the connected chain ID, throwing if not connected. */
    private _getConnectedChainId;
}
export {};
//# sourceMappingURL=keplr.d.ts.map