/**
 * @cinacoin/appkit-config/vue
 *
 * Vue-specific exports for Cinacoin AppKit configuration.
 * Provides Vue composables for wallet connection.
 */

import { ref, computed, onMounted, onUnmounted, type Ref } from 'vue';

import {
  createCinacoinAppKit,
  type CinacoinAppKitConfig,
  type CinacoinAppKitInstance,
} from './config';

// Re-export config types
export type { CinacoinAppKitConfig, CinacoinAppKitInstance };

// ============================================================================
// Composable
// ============================================================================

export interface UseCinacoinWalletReturn {
  /** Connected address */
  address: Ref<string | null>;
  /** Whether wallet is connected */
  isConnected: Ref<boolean>;
  /** Current chain ID */
  chainId: Ref<number | undefined>;
  /** Whether modal is open */
  isOpen: Ref<boolean>;
  /** Connection status */
  status: Ref<'connecting' | 'connected' | 'disconnected'>;
  /** Open connect modal */
  openConnectModal: () => void;
  /** Close connect modal */
  closeConnectModal: () => void;
  /** Disconnect wallet */
  disconnect: () => Promise<void>;
}

/**
 * Vue composable for Cinacoin wallet connection.
 *
 * @example
 * ```vue
 * <script setup>
 * import { useCinacoinWallet } from '@cinacoin/appkit-config/vue';
 *
 * const { address, isConnected, openConnectModal } = useCinacoinWallet();
 * </script>
 *
 * <template>
 *   <button @click="openConnectModal">
 *     {{ isConnected ? address : 'Connect Wallet' }}
 *   </button>
 * </template>
 * ```
 */
export function useCinacoinWallet(): UseCinacoinWalletReturn {
  const address = ref<string | null>(null);
  const chainId = ref<number | undefined>(undefined);
  const isOpen = ref(false);
  const status = ref<'connecting' | 'connected' | 'disconnected'>('disconnected');

  const isConnected = computed(() => status.value === 'connected' && !!address.value);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let appkit: any = null;
  let unsubscribe: (() => void) | null = null;

  onMounted(() => {
    // Get AppKit instance from global scope (set by createCinacoinAppKit)
    // @ts-expect-error - AppKit is attached to window
    appkit = window?.appkit ?? null;

    if (appkit) {
      // Subscribe to state changes
      unsubscribe = appkit.subscribe(
        (state: { address?: string; chainId?: number; isOpen?: boolean }) => {
          address.value = state.address ?? null;
          chainId.value = state.chainId;
          isOpen.value = state.isOpen ?? false;
          status.value = state.address ? 'connected' : 'disconnected';
        }
      );

      // Initialize state
      const currentState = appkit.getState();
      address.value = currentState.address ?? null;
      chainId.value = currentState.chainId;
      status.value = currentState.address ? 'connected' : 'disconnected';
    }
  });

  onUnmounted(() => {
    unsubscribe?.();
  });

  const openConnectModal = () => {
    appkit?.open();
    isOpen.value = true;
  };

  const closeConnectModal = () => {
    appkit?.close();
    isOpen.value = false;
  };

  const disconnect = async () => {
    await appkit?.disconnect();
    address.value = null;
    chainId.value = undefined;
    status.value = 'disconnected';
  };

  return {
    address,
    isConnected,
    chainId,
    isOpen,
    status,
    openConnectModal,
    closeConnectModal,
    disconnect,
  };
}

/**
 * Create and initialize Cinacoin AppKit for Vue apps.
 *
 * @example
 * ```ts
 * import { createCinacoinAppKitVue, mainnet, polygon } from '@cinacoin/appkit-config/vue';
 *
 * const appkit = createCinacoinAppKitVue({
 *   projectId: 'xxx',
 *   chains: [mainnet, polygon],
 *   metadata: { name: 'My App', url: 'https://...' },
 * });
 * ```
 */
export function createCinacoinAppKitVue(config: CinacoinAppKitConfig): CinacoinAppKitInstance {
  const appkit = createCinacoinAppKit(config);

  // Attach to window for composable access
  if (typeof window !== 'undefined') {
    // @ts-expect-error - Attach to window
    window.appkit = appkit;
  }

  return appkit;
}
