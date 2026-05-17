/**
 * EIP-6963 Multi-Injected Provider Discovery.
 *
 * Standardized way to discover multiple wallet extensions installed
 * in the same browser session.
 *
 * @see https://eips.ethereum.org/EIPS/eip-6963
 */
import type { EventHandler } from './types.js';
/** EIP-6963 provider info. */
export interface EIP6963ProviderInfo {
    /** Reverse DNS identifier. */
    rdns: string;
    /** Wallet name. */
    name: string;
    /** Icon (data URI). */
    icon: string;
    /** Unique identifier. */
    uuid: string;
}
/** EIP-1193 compatible provider. */
export interface EIP1193Provider {
    /** Send a JSON-RPC request. */
    request(args: {
        method: string;
        params?: unknown[];
    }): Promise<unknown>;
    /** Listen for events. */
    on(event: string, handler: EventHandler): void;
    /** Remove event listener. */
    removeListener(event: string, handler: EventHandler): void;
}
/** EIP-6963 provider detail (info + provider instance). */
export interface EIP6963ProviderDetail {
    info: EIP6963ProviderInfo;
    provider: EIP1193Provider;
}
/**
 * Discover all EIP-6963 compatible wallet providers.
 *
 * Returns a promise that resolves with all discovered wallets
 * after a 300ms discovery window.
 *
 * @returns Promise resolving to array of discovered providers.
 */
export declare function discoverWallets(): Promise<EIP6963ProviderDetail[]>;
/**
 * Watch for wallet provider changes.
 *
 * Useful for detecting wallet install/uninstall during a session.
 *
 * @param callback - Invoked each time a new provider is discovered.
 * @returns Unsubscribe function.
 */
export declare function watchWallets(callback: (detail: EIP6963ProviderDetail) => void): () => void;
/**
 * Find a specific wallet by its RDNS identifier.
 *
 * @param rdns - Reverse DNS identifier to search for.
 * @returns The provider detail if found, undefined otherwise.
 */
export declare function findWalletByRdns(rdns: string): Promise<EIP6963ProviderDetail | undefined>;
//# sourceMappingURL=eip6963.d.ts.map