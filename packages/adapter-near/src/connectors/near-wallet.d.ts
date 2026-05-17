/**
 * NEAR Official Wallet Connector.
 *
 * Interfaces with the official NEAR Wallet (wallet.near.org) via the
 * NEAR Wallet Selector or direct browser redirect flow.
 */
import type { NearTransaction, NearTransactionResult, NearWalletConnector } from '../types.js';
/** Minimal NEAR Wallet provider declarations. */
interface NearWalletProvider {
    /** Wallet id. */
    id: string;
    /** Whether currently connected. */
    isConnected: boolean;
    /** Connected account id. */
    account: NearAccount | null;
    /** Sign in / connect. */
    signIn(params: {
        contractId?: string;
        methodNames?: string[];
    }): Promise<unknown>;
    /** Sign out / disconnect. */
    signOut(): Promise<void>;
    /** Get the connected account. */
    account(): NearAccount | Promise<NearAccount>;
    /** Check connection state. */
    isSignedIn(): boolean;
    /** Get account ids. */
    getAccounts(): Promise<{
        accountId: string;
        publicKey: string;
    }[]>;
}
interface NearAccount {
    /** Account id (e.g. "alice.near"). */
    accountId: string;
    /** Get balance. */
    getAccountBalance(): Promise<{
        total: string;
        available: string;
    }>;
    /** Send tokens. */
    sendMoney(params: {
        receiverId: string;
        amount: string;
    }): Promise<NearTransactionResult>;
    /** Call a contract function. */
    functionCall(params: {
        contractId: string;
        methodName: string;
        args: Record<string, unknown> | Uint8Array;
        gas?: string;
        amount?: string;
    }): Promise<NearTransactionResult>;
}
/** NEAR Wallet Selector compatible provider. */
interface WalletSelectorProvider {
    wallet: NearWalletProvider;
}
declare global {
    interface Window {
        near?: NearWalletProvider;
        nearWalletSelector?: WalletSelectorProvider;
    }
}
/**
 * NEAR official wallet connector.
 *
 * Connects to wallet.near.org using the browser redirect flow or
 * Wallet Selector integration.
 */
export declare class NearWalletConnector implements NearWalletConnector {
    readonly id = "near-wallet";
    readonly name = "NEAR Wallet";
    private provider;
    private accountId;
    /**
     * Check if the NEAR Wallet Selector is available.
     */
    isAvailable(): boolean;
    /**
     * Connect to NEAR Wallet.
     * Opens wallet.near.org for approval in browser redirect flow,
     * or uses the Wallet Selector if available.
     * @returns The connected NEAR account id (e.g. "alice.near").
     */
    connect(): Promise<string>;
    /**
     * Disconnect from NEAR Wallet.
     */
    disconnect(): Promise<void>;
    /**
     * Get the connected account id.
     */
    getAccountId(): string | null;
    /**
     * Sign a NEAR transaction.
     * @param tx - NEAR transaction with function calls or transfer actions.
     * @returns Transaction hash (hex string).
     */
    signTransaction(tx: NearTransaction): Promise<string>;
    /**
     * Send a NEAR transaction (sign + broadcast).
     * @param tx - NEAR transaction.
     * @returns Transaction result with hash.
     */
    sendTransaction(tx: NearTransaction): Promise<NearTransactionResult>;
    /**
     * Sign a message using the connected account.
     * @param message - Message to sign.
     * @param recipient - Optional recipient domain for security.
     * @returns Signature as a base64 string.
     */
    signMessage(message: string, recipient?: string): Promise<string>;
    /** Get the underlying provider for advanced use cases. */
    getProvider(): NearWalletProvider | null;
    private _getProvider;
    private _isTransfer;
    private _executeAction;
}
export {};
//# sourceMappingURL=near-wallet.d.ts.map