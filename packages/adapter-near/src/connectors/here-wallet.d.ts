/**
 * Here Wallet Connector.
 *
 * Interfaces with Here Wallet (herewallet.app) — a mobile-first NEAR wallet
 * with MPC-based key management.
 */
import type { NearTransaction, NearTransactionResult, NearWalletConnector } from '../types.js';
/** Minimal Here Wallet provider declarations. */
interface HereWalletProvider {
    /** Wallet id. */
    id: string;
    /** Whether currently connected. */
    isConnected: boolean;
    /** Connected account id. */
    accountId: string | null;
    /** Sign in / connect. */
    connect(): Promise<HereWalletAccount>;
    /** Sign out / disconnect. */
    disconnect(): Promise<void>;
    /** Send tokens. */
    sendMoney(params: {
        receiverId: string;
        amount: string;
    }): Promise<NearTransactionResult>;
    /** Call a contract function. */
    signAndSendTransaction(params: {
        receiverId: string;
        actions: {
            type: string;
            params: Record<string, unknown>;
        }[];
    }): Promise<NearTransactionResult>;
    /** Sign a message. */
    signMessage(params: {
        message: string;
        recipient: string;
    }): Promise<{
        signature: string;
    }>;
    /** Get balance. */
    getBalance(accountId?: string): Promise<{
        total: string;
        available: string;
    }>;
    /** Generic request method. */
    request?(args: {
        method: string;
        params?: unknown[];
    }): Promise<unknown>;
    /** Event listeners. */
    on(event: 'signIn' | 'signOut', handler: (...args: unknown[]) => void): void;
    off(event: 'signIn' | 'signOut', handler: (...args: unknown[]) => void): void;
}
interface HereWalletAccount {
    accountId: string;
    publicKey: string;
}
declare global {
    interface Window {
        hereWallet?: HereWalletProvider;
    }
}
/**
 * Here Wallet connector for NEAR.
 *
 * Provides a standardized interface over Here Wallet (herewallet.app),
 * a mobile-first NEAR wallet that supports both mobile and browser
 * environments via MPC key management.
 */
export declare class HereWalletConnector implements NearWalletConnector {
    readonly id = "here-wallet";
    readonly name = "Here Wallet";
    private provider;
    private accountId;
    /**
     * Check if Here Wallet is available.
     */
    isAvailable(): boolean;
    /**
     * Connect to Here Wallet.
     * On mobile, opens the Here Wallet app.
     * On browser, connects via the Here Wallet web interface.
     * @returns The connected NEAR account id.
     */
    connect(): Promise<string>;
    /**
     * Disconnect from Here Wallet.
     */
    disconnect(): Promise<void>;
    /**
     * Get the connected account id.
     */
    getAccountId(): string | null;
    /**
     * Sign a NEAR transaction.
     * @param tx - NEAR transaction with function calls or transfer actions.
     * @returns Transaction hash.
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
     * @param recipient - Optional recipient domain.
     * @returns Signature as a string.
     */
    signMessage(message: string, recipient?: string): Promise<string>;
    /** Get the underlying provider for advanced use cases. */
    getProvider(): HereWalletProvider | null;
    private _getProvider;
    private _sendActions;
    private _isTransfer;
    private _getReceiverId;
}
export {};
//# sourceMappingURL=here-wallet.d.ts.map