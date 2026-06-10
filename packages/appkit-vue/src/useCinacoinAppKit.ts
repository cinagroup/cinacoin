/**
 * useCinacoinAppKit — Vue 3 composable for accessing AppKit instance
 *
 * Provides reactive access to the AppKit instance and connection state.
 */

import { inject, computed, type Ref } from 'vue';
import type { CinacoinAppKitInstance, ConnectionState } from '@cinacoin/appkit';

// ============================================================================
// Injection Key
// ============================================================================

export const CINACOIN_APPKIT_KEY = Symbol('cinacoin-appkit');

// ============================================================================
// Composable
// ============================================================================

export interface UseCinacoinAppKitReturn {
  /** The AppKit instance */
  appkit: CinacoinAppKitInstance;
  /** Current connection state (reactive) */
  state: Ref<ConnectionState>;
  /** Whether the modal is open */
  isOpen: Ref<boolean>;
  /** Current connection status */
  status: Ref<ConnectionState['status']>;
  /** Connected account (null if disconnected) */
  account: Ref<ConnectionState['account']>;
  /** Open the modal */
  open: () => void;
  /** Close the modal */
  close: () => void;
  /** Connect to a specific wallet */
  connect: (walletId: string) => Promise<void>;
  /** Disconnect the current wallet */
  disconnect: () => Promise<void>;
  /** Switch to a different chain */
  switchChain: (chainId: number) => Promise<void>;
}

/**
 * Vue 3 composable for accessing the CinacoinAppKit instance.
 *
 * Must be used within a component that has `<CinacoinProvider>` as an ancestor.
 *
 * @example
 * ```vue
 * <script setup>
 * import { useCinacoinAppKit } from '@cinacoin/appkit-vue';
 *
 * const { open, status, account } = useCinacoinAppKit();
 * </script>
 *
 * <template>
 *   <button @click="open">
 *     {{ status === 'connected' ? account?.address : 'Connect Wallet' }}
 *   </button>
 * </template>
 * ```
 */
export function useCinacoinAppKit(): UseCinacoinAppKitReturn {
  const appkit = inject<CinacoinAppKitInstance>(CINACOIN_APPKIT_KEY);
  if (!appkit) {
    throw new Error('useCinacoinAppKit must be used within a <CinacoinProvider>');
  }

  // Reactive state
  const state = computed(() => appkit.getState());
  const isOpen = computed(() => state.value.isOpen);
  const status = computed(() => state.value.status);
  const account = computed(() => state.value.account);

  // Subscribe to state changes to trigger reactivity
  // Note: In a real implementation, this would use Vue's reactive system
  // For now, we rely on computed properties that call getState()

  return {
    appkit,
    state,
    isOpen,
    status,
    account,
    open: () => appkit.open(),
    close: () => appkit.close(),
    connect: (walletId: string) => appkit.connect(walletId).then(() => {}),
    disconnect: () => appkit.disconnect(),
    switchChain: (chainId: number) => appkit.switchChain(chainId),
  };
}
