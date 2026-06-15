/**
 * useConnect — connect to a wallet.
 *
 * ```vue
 * <script setup>
 * const { connect, status, isSwitchingChain } = useConnect()
 * </script>
 * ```
 */
import { onUnmounted } from 'vue'
import { useCinacoin } from '../composables.js'

export function useConnect() {
  const { connect, status, isSwitchingChain, disconnect } = useCinacoin()

  // Cleanup: disconnect on component unmount to prevent memory leaks
  onUnmounted(() => {
    if (status.value === 'connected') {
      disconnect().catch(() => {
        // Ignore disconnect errors during cleanup
      })
    }
  })

  return { connect, status, isSwitchingChain }
}
