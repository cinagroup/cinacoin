/**
 * useDisconnect — disconnect wallet composable.
 *
 * ```vue
 * <script setup>
 * const { disconnect } = useDisconnect()
 *
 * const handleClick = () => { disconnect() }
 * </script>
 * ```
 */

import { useCinacoin } from '../composables.js'

export function useDisconnect() {
  const { disconnect } = useCinacoin()
  return { disconnect }
}
