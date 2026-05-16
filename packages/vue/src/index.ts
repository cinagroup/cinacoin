/**
 * @onchainux/vue
 *
 * Vue 3 adapter for OnChainUX white-label UI toolkit.
 */

export { default as OnChainUXProvider } from './OnChainUXProvider.vue';
export type { OnChainUXProviderProps } from './OnChainUXProvider.vue';

export { ONCHAINUX_KEY } from './types';
export type { OnChainUXConfig, OnChainUXContext, AccountState, Connector, ChainConfig, ThemeMode } from './types';

export { OcxConnectButton, OcxConnectModal, OcxChainSwitcher } from './components';

export {
  useOnChainUX,
  useAccount,
  useChainId,
  useConnect,
  useDisconnect,
} from './composables';
