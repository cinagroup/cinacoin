/**
 * WalletConnect adapter exports.
 */

export { WalletConnectAdapter } from './adapter.js';
export type {
  WalletConnectConfig,
  WalletConnectSession,
  WalletConnectProvider,
} from './types.js';
export {
  DEFAULT_RELAY_URL,
  DEFAULT_EVM_METHODS,
  DEFAULT_EVM_EVENTS,
  buildRequiredNamespaces,
  parseSessionAccounts,
  parseSessionChainId,
  isSessionExpired,
  formatSessionInfo,
} from './utils.js';
