/**
 * Coinbase Wallet adapter exports.
 */

export { CoinbaseAdapter } from './adapter.js';
export type { CoinbaseWalletConfig, CoinbaseWalletProvider } from './types.js';
export {
  detectCoinbaseWallet,
  isCoinbaseWalletInstalled,
  getCoinbaseWalletInstallLink,
  toHexChainId,
  fromHexChainId,
} from './utils.js';
