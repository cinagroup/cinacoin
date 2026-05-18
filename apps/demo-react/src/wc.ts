/**
 * WalletConnect SDK wrapper module.
 * 
 * This module provides a barrier that prevents Rollup from tree-shaking
 * the WalletConnect SDK. The SDK is imported statically and exposed
 * through the `getEthereumProvider()` function.
 */
import { EthereumProvider } from '@walletconnect/ethereum-provider'

// Expose the provider class so Rollup can't tree-shake the import
export { EthereumProvider }

// Force the module to be retained by exposing at runtime
if (typeof globalThis !== 'undefined') {
  ;(globalThis as any).__CINA_WC = EthereumProvider
}
