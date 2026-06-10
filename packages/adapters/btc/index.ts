/**
 * Bitcoin adapter exports.
 */

export { BitcoinAdapter } from './adapter.js';
export type { BitcoinWalletConfig, BitcoinProvider, UTXO, BitcoinAccount } from './types.js';
export {
  detectBitcoinWallet,
  isBitcoinWalletInstalled,
  getBitcoinWalletInstallLinks,
  isValidBitcoinAddress,
  getAddressType,
  formatBTC,
  parseBTCAmount,
  getNetworkName,
} from './utils.js';
