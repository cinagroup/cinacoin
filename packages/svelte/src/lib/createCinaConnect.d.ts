/**
 * Factory function to create a CinaConnect context for Svelte apps.
 *
 * `createCinaConnect(options)` initializes the SDK and returns a context
 * object with all stores and methods needed for wallet integration.
 *
 * Supports Svelte 5 runes pattern (via `getContext`/`setContext`) and
 * Svelte 4 store syntax. Auto-cleanup on component destroy when used
 * with `onDestroy` or Svelte 5 `$effect.teardown`.
 *
 * @packageDocumentation
 */
import { Connector } from '@cinaconnect/core-sdk';
import type { Chain } from '@cinaconnect/core-sdk';
import { resetCinaConnect, open, close, switchChain, isConnected, address, balance, chainId, status, error, isConnecting, hasError, chains } from './stores.js';
/** Options for creating a CinaConnect context. */
export interface CreateCinaConnectOptions {
    /** Connector instance from @cinaconnect/core-sdk or a custom implementation. */
    connector?: Connector;
    /** Function to create the connector lazily. */
    createConnector?: () => Connector;
    /** Chains available for switching. */
    chains?: Chain[];
    /** Whether to attempt auto-connect from a cached session. */
    autoConnect?: boolean;
    /** Custom context key (for multiple CinaConnect instances). */
    contextKey?: string;
}
/**
 * The context object returned by `createCinaConnect()`.
 *
 * Contains all reactive stores and imperative methods needed for
 * wallet connection in a Svelte app.
 */
export interface CinaConnectContext {
    /** Readable: whether wallet is connected. */
    isConnected: typeof isConnected;
    /** Readable: primary account address or null. */
    address: typeof address;
    /** Readable: current balance (string, in wei). */
    balance: typeof balance;
    /** Readable: current chain ID or null. */
    chainId: typeof chainId;
    /** Readable: current connection status. */
    status: typeof status;
    /** Readable: current error or null. */
    error: typeof error;
    /** Readable: whether connecting is in progress. */
    isConnecting: typeof isConnecting;
    /** Readable: whether there is an active error. */
    hasError: typeof hasError;
    /** Writable: configured chains. */
    chains: typeof chains;
    /** Open wallet connection modal/flow. */
    open: typeof open;
    /** Close wallet connection. */
    close: typeof close;
    /** Switch to a different chain. */
    switchChain: typeof switchChain;
    /** Reset all state and cleanup. */
    reset: typeof resetCinaConnect;
    /** Get the underlying connector instance (may be null). */
    getConnector: () => Connector | null;
}
/**
 * Create a CinaConnect context and register it with Svelte's context API.
 *
 * Automatically registers an `onDestroy` cleanup when called inside a
 * Svelte component (stores reset on component unmount).
 *
 * @param options - Configuration options.
 * @returns CinaConnectContext with stores and methods.
 *
 * @example
 * **Svelte 5 runes pattern:**
 * ```svelte
 * <script lang="ts">
 *   import { createCinaConnect } from '@cinaconnect/svelte';
 *   const ctx = createCinaConnect({ createConnector: () => myConnector });
 * </script>
 *
 * {#if $ctx.isConnected}
 *   <p>Connected: {$ctx.address}</p>
 * {:else}
 *   <button on:click={() => $ctx.open()}>Connect</button>
 * {/if}
 * ```
 *
 * @example
 * **Svelte 4 store syntax:**
 * ```svelte
 * <script lang="ts">
 *   import { createCinaConnect } from '@cinaconnect/svelte';
 *   createCinaConnect({ createConnector: () => myConnector });
 * </script>
 * ```
 */
export declare function createCinaConnect(options?: CreateCinaConnectOptions): CinaConnectContext;
/**
 * Get the CinaConnect context set by `createCinaConnect()`.
 *
 * @param contextKey - Custom context key if one was used.
 * @returns CinaConnectContext or `null` if not found.
 */
export declare function getCinaConnectContext(contextKey?: string): CinaConnectContext | null;
//# sourceMappingURL=createCinaConnect.d.ts.map