/**
 * @cinacoin/vue
 *
 * Vue 3 adapter for Cinacoin white-label UI toolkit.
 */

export { default as CinacoinProvider } from './CinacoinProvider.vue';
export type { CinacoinProviderProps } from './CinacoinProvider.vue';

export { ONCHAINUX_KEY } from './types.js';
export type { CinacoinConfig, CinacoinContext, AccountState, Connector, ChainConfig, ThemeMode } from './types.js';

export { OcxConnectButton, OcxConnectModal, OcxChainSwitcher } from './components.js';

export {
  useCinacoin,
  useAccount,
  useChainId,
  useConnect,
  useDisconnect,
} from './composables.js';

// EIP-5792 Wallet Call API composables
export {
  useWalletCapabilities,
  useSendCalls,
  useAtomicBatch,
  useCallsStatus,
} from './composables.js';

export type {
  UseWalletCapabilitiesReturn,
  UseSendCallsReturn,
  UseAtomicBatchReturn,
  UseCallsStatusReturn,
  SendCallsOptions,
  AtomicBatchOptions,
} from './composables.js';

// Additional composables: balance, ENS, send tx, sign message
export {
  useBalance,
  useEnsName,
  useEnsAddress,
  useSendTransaction,
  useSignMessage,
} from './composables.js';

export type {
  UseBalanceReturn,
  UseEnsNameReturn,
  UseEnsAddressReturn,
  SendTransactionArgs,
  UseSendTransactionReturn,
  UseSignMessageReturn,
} from './composables.js';

// Connector manager for real wallet connections
export { ConnectorManager } from './connectorManager.js';

// Native Vue 3 components
export { default as ConnectModal } from './components/ConnectModal.vue'
export type { ConnectModalProps } from './components/ConnectModal.vue'
export { default as ChainSwitcher } from './components/ChainSwitcher.vue'
export type { ChainSwitcherProps } from './components/ChainSwitcher.vue'
export { default as WalletButton } from './components/WalletButton.vue'
export type { WalletButtonProps } from './components/WalletButton.vue'
export { default as WalletButtonGroup } from './components/WalletButtonGroup.vue'
export type { WalletButtonGroupProps } from './components/WalletButtonGroup.vue'
export { default as AccountModal } from './components/AccountModal.vue'
export type { AccountModalProps } from './components/AccountModal.vue'
export { default as BalanceDisplay } from './components/BalanceDisplay.vue'
export type { BalanceDisplayProps } from './components/BalanceDisplay.vue'
