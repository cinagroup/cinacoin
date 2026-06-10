/**
 * Phantom adapter exports.
 */

export { PhantomAdapter } from './adapter.js';
export type { PhantomConfig, PhantomSolanaProvider, PhantomEthereumProvider } from './types.js';
export {
  detectPhantomSolana,
  detectPhantomEthereum,
  isPhantomInstalled,
  getPhantomInstallLink,
  encodeSolanaMessage,
  solanaSignatureToHex,
  getSolanaNetworkUrl,
} from './utils.js';
