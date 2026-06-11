/**
 * EIP-5792 Context Registry
 * 
 * Module-level registry for EIP-5792 context, replacing window global pollution.
 * All framework packages (react, vue, svelte, next) import from here.
 */

/**
 * Generic EIP-5792 context shape shared across frameworks.
 * Each framework may cast to more specific types as needed.
 */
export interface EIP5792Context {
  /** Raw EIP-1193 provider for RPC calls. */
  provider: unknown;
  /** Connected account address (or null). */
  address: string | null;
  /** Current chain ID in hex format (e.g. '0x1'). */
  chainIdHex: string | null;
  /** Whether a wallet is currently connected. */
  isConnected: boolean;
}

let contextGetter: (() => EIP5792Context) | null = null;

/**
 * Register the EIP-5792 context getter.
 * Called by CinacoinProvider when mounting.
 */
export function registerEIP5792Context(getter: () => EIP5792Context): void {
  contextGetter = getter;
}

/**
 * Unregister the EIP-5792 context getter.
 * Called by CinacoinProvider when unmounting.
 */
export function unregisterEIP5792Context(): void {
  contextGetter = null;
}

/**
 * Get the current EIP-5792 context.
 * Throws if no context is registered.
 */
export function getEIP5792Context(): EIP5792Context {
  if (!contextGetter) {
    throw new Error(
      'EIP-5792 context not available. Make sure you are using this within <CinacoinProvider> with EIP-5792 support.',
    );
  }
  return contextGetter();
}
