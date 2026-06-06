/**
 * Farcaster Mini App provider.
 *
 * Adapts the Farcaster Mini App environment to the EIP-1193 provider interface,
 * enabling wallet operations inside Farcaster Mini Apps with Sign-In with Farcaster support.
 *
 * @packageDocumentation
 */
import type { FarcasterProviderConfig, FarcasterContext, FarcasterUser } from './types.js';
/**
 * FarcasterProvider adapts Farcaster Mini App context to a wallet provider interface.
 *
 * It extracts user data from the Farcaster context and provides EIP-1193-compatible
 * request handling for wallet operations within Farcaster Mini Apps.
 */
export declare class FarcasterProvider {
    /** Farcaster context (may be mocked). */
    private _context;
    /** Whether the provider is ready. */
    private _ready;
    /** Currently connected wallet address. */
    private _account;
    /** Current chain ID. */
    private _chainId;
    /** Event listeners. */
    private _listeners;
    /** Supported chains. */
    private readonly _chains;
    /** App name. */
    readonly appName: string;
    constructor(config?: FarcasterProviderConfig);
    /**
     * Initialize the provider.
     *
     * @returns FarcasterContext if running inside Farcaster, null otherwise.
     */
    init(): Promise<FarcasterContext | null>;
    /** Get the Farcaster context. */
    get context(): FarcasterContext | null;
    /** Get the Farcaster user. */
    get user(): FarcasterUser | null;
    /** Get the current account address. */
    get account(): `0x${string}` | null;
    /** Get the current chain ID. */
    get chainId(): number;
    /** Check if the provider is running inside Farcaster. */
    get isInFarcaster(): boolean;
    /** Check if the provider is ready. */
    get isReady(): boolean;
    /** Set the wallet account address. */
    setAccount(address: `0x${string}`): void;
    /** Switch the active chain. */
    switchChain(chainId: number): void;
    /** Get supported chains. */
    getSupportedChains(): number[];
    /** EIP-1193 compatible request handler. */
    request(args: {
        method: string;
        params?: unknown[];
    }): Promise<unknown>;
    /** Register an event listener. */
    on(event: string, callback: (...args: unknown[]) => void): void;
    /** Remove an event listener. */
    off(event: string, callback: (...args: unknown[]) => void): void;
    private _detectFarcaster;
    private _handleRequestAccounts;
    private _handleAccounts;
    private _emit;
}
//# sourceMappingURL=FarcasterProvider.d.ts.map