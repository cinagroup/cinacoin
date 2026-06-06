/**
 * Leap wallet connector for Cosmos SDK chains.
 *
 * Detects `window.leap` and provides the same `CosmosWalletConnector`
 * interface as the Keplr connector. Leap supports a subset of Cosmos
 * chains plus additional networks like Terra and Neutron.
 *
 * @see https://docs.leapwallet.io/cosmos/leap-extension/api
 */
import type { CosmosWalletConnector, SignDoc } from '../types.js';
/** Minimal type declarations for the Leap browser extension API. */
interface LeapAccount {
    address: string;
    algo: string;
    pubKey: Uint8Array;
}
interface LeapOfflineSigner {
    getChainId(): Promise<string>;
    getAccounts(): Promise<LeapAccount[]>;
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
    signAmino(signerAddress: string, signDoc: unknown): Promise<{
        signed: unknown;
        signature: unknown;
    }>;
}
interface LeapKey {
    name: string;
    algo: string;
    pubKey: Uint8Array;
    address: Uint8Array;
    bech32Address: string;
    nanoAddress?: string;
    isNanoLedger: boolean;
}
/** The global `window.leap` object provided by the Leap extension. */
interface LeapProvider {
    enable(chainIds: string | string[]): Promise<void>;
    disconnect(): Promise<void>;
    getKey(chainId: string): Promise<LeapKey>;
    suggestToken(chainId: string, contractAddress: string, viewingKey?: string): Promise<void>;
    suggestChain(chainInfo: unknown): Promise<void>;
    getOfflineSigner(chainId: string): LeapOfflineSigner;
    getOfflineSignerOnlyAmino(chainId: string): LeapOfflineSigner;
    getOfflineSignerAuto(chainId: string): Promise<LeapOfflineSigner>;
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
        return_url?: string;
    }>;
    verifyArbitrary(chainId: string, signerAddress: string, data: string | Uint8Array, signature: Uint8Array): Promise<boolean>;
    sendTx(chainId: string, tx: Uint8Array, mode: 'sync' | 'async' | 'block'): Promise<Uint8Array>;
    on(event: string, handler: (event: unknown) => void): void;
    experimentalSuggestChain(chainInfo: unknown): Promise<void>;
}
/**
 * Leap wallet connector implementing `CosmosWalletConnector`.
 *
 * API surface is identical to KeplrConnector, making it trivially
 * swappable in user code.
 */
export declare class LeapConnector implements CosmosWalletConnector {
    /** @inheritdoc */
    readonly id = "leap";
    /** @inheritdoc */
    readonly name = "Leap";
    private _leap;
    private _connectedChainId;
    /**
     * Check whether the Leap extension is installed.
     *
     * Looks for `window.leap` in browser environments.
     * Returns `false` in SSR / Node.js contexts.
     */
    isAvailable(): boolean;
    /**
     * Retrieve the Leap provider from `window.leap`.
     *
     * @param timeoutMs - Max wait time in ms (default 5000).
     * @returns The Leap provider.
     */
    getProvider(timeoutMs?: number): Promise<LeapProvider>;
    /**
     * Connect to Leap and enable access for the specified chain.
     *
     * @param chainId - Cosmos chain ID (e.g. "cosmoshub-4").
     * @returns Connected address and chain ID.
     */
    connect(chainId: string): Promise<{
        address: string;
        chainId: string;
    }>;
    /**
     * Disconnect from Leap.
     */
    disconnect(): Promise<void>;
    /**
     * Get accounts available on the given chain.
     *
     * @param chainId - Cosmos chain ID.
     * @returns Array of account objects.
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
     * Uses Leap's `signDirect` method for ADR-036 compliant signing.
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
     * @param signerAddress - Bech32 address of the signer.
     * @param data - Data to sign.
     * @returns Signature bytes.
     */
    signArbitrary(signerAddress: string, data: string | Uint8Array): Promise<{
        signature: Uint8Array;
    }>;
    /**
     * Send a token transfer through Leap.
     *
     * Returns a structured payload for CosmosAdapter to build the full
     * transaction via @cosmjs/stargate.
     *
     * @param chainId - Target chain ID.
     * @param recipient - Recipient bech32 address.
     * @param amount - Amount in smallest unit.
     * @param denom - Token denomination.
     * @param memo - Optional memo.
     * @returns JSON-encoded transfer payload.
     */
    sendTransfer(chainId: string, recipient: string, amount: string, denom: string, memo?: string): Promise<string>;
    /**
     * Suggest a custom chain to Leap.
     *
     * @param chainInfo - Chain configuration.
     */
    suggestChain(chainInfo: unknown): Promise<void>;
    /**
     * Listen for Leap keystore change events.
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
//# sourceMappingURL=leap.d.ts.map