/**
 * Cinacoin SDK wrapper module.
 *
 * This module provides a lazy-loaded barrier that defers the Cinacoin SDK
 * import until a user actually attempts a Cinacoin connection.
 * This keeps the initial bundle small.
 */

let cachedProvider: typeof import('@walletconnect/ethereum-provider').EthereumProvider | null = null

export async function getEthereumProvider() {
  if (!cachedProvider) {
    const mod = await import('@walletconnect/ethereum-provider')
    cachedProvider = mod.EthereumProvider
  }
  return cachedProvider
}
