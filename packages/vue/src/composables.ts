/**
 * Vue composables for Cinacoin.
 *
 * All composables require being used within <CinacoinProvider>.
 */

import { inject, onUnmounted } from 'vue';
import { ONCHAINUX_KEY, type CinacoinContext } from './types.js';

/**
 * useCinacoin — access the full Cinacoin context.
 *
 * Automatically cleans up WebSocket/provider connections on unmount
 * to prevent memory leaks.
 *
 * ```vue
 * <script setup>
 * const { connect, disconnect, account, status } = useCinacoin()
 * </script>
 * ```
 */
export function useCinacoin(): CinacoinContext {
  const ctx = inject<CinacoinContext | null>(ONCHAINUX_KEY, null);
  if (!ctx) {
    throw new Error('useCinacoin must be used within <CinacoinProvider>');
  }

  // Cleanup: disconnect WebSocket/provider connections on unmount
  onUnmounted(() => {
    if (ctx.status.value === 'connected') {
      ctx.disconnect().catch(() => {
        // Ignore disconnect errors during cleanup
      });
    }
  });

  return ctx;
}

/**
 * useAccount — access the current account state.
 *
 * ```vue
 * <script setup>
 * const { address, balance, chainSymbol } = useAccount()
 * </script>
 * ```
 */
export function useAccount() {
  const { account } = useCinacoin();
  return account;
}

/**
 * useChainId — access the current chain ID.
 */
export function useChainId() {
  const { account } = useCinacoin();
  return account.value.chainId;
}

// EIP-5792 composables
export {
  useWalletCapabilities,
  useSendCalls,
  useAtomicBatch,
  useCallsStatus,
} from './composables/useEIP5792.js';

export type {
  UseWalletCapabilitiesReturn,
  UseSendCallsReturn,
  UseAtomicBatchReturn,
  UseCallsStatusReturn,
  SendCallsOptions,
  AtomicBatchOptions,
} from './composables/useEIP5792.js';

// Additional composables: balance, ENS, send tx, sign message
export {
  useBalance,
  useEnsName,
  useEnsAddress,
  useSendTransaction,
  useSignMessage,
} from './composables/useExtraHooks.js';

export type {
  UseBalanceReturn,
  UseEnsNameReturn,
  UseEnsAddressReturn,
  SendTransactionArgs,
  UseSendTransactionReturn,
  UseSignMessageReturn,
} from './composables/useExtraHooks.js';

// Standalone connect/disconnect composables
export { useConnect } from './composables/useConnect.js'
export { useDisconnect } from './composables/useDisconnect.js'
