/**
 * MetaMask adapter exports.
 */

export { MetaMaskAdapter } from './adapter.js';
export type { MetaMaskConfig, MetaMaskProvider, EIP6963ProviderDetail } from './types.js';
export {
  detectMetaMask,
  isMetaMaskInstalled,
  getMetaMaskInstallLink,
  toHexChainId,
  fromHexChainId,
} from './utils.js';
