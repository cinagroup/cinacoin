/**
 * useConnect — connect to a wallet.
 *
 * ```vue
 * <script setup>
 * const { connect, status, isSwitchingChain } = useConnect()
 * </script>
 * ```
 */
import { useCinacoin } from '../composables.js'

export function useConnect() {
  const { connect, status, isSwitchingChain } = useCinacoin()
  return { connect, status, isSwitchingChain }
}
