/**
 * useBalance — reactive wallet balance composable.
 *
 * ```vue
 * <script setup>
 * const { balance, isLoading, refetch } = useBalance()
 * </script>
 * ```
 */

import { ref, watch, onMounted, type Ref } from 'vue'
import { useCinacoin } from '../composables.js'

export interface UseBalanceReturn {
  balance: Ref<string>
  isLoading: Ref<boolean>
  error: Ref<Error | null>
  refetch: () => Promise<void>
}

export function useBalance(): UseBalanceReturn {
  const { account } = useCinacoin()

  const balance = ref(account.value.balance)
  const isLoading = ref(false)
  const error = ref<Error | null>(null)

  const fetchBalance = async () => {
    const address = account.value.address
    if (!address) { balance.value = '0.00'; return }

    isLoading.value = true
    error.value = null

    try {
      const provider = (window as any).ethereum
      if (!provider) { balance.value = account.value.balance; return }

      const result = await provider.request({
        method: 'eth_getBalance',
        params: [address, 'latest'],
      })

      if (result) {
        const wei = BigInt(result as string)
        balance.value = formatEther(wei)
      }
    } catch (err) {
      const e = err instanceof Error ? err : new Error(String(err))
      error.value = e
      balance.value = account.value.balance
    } finally {
      isLoading.value = false
    }
  }

  watch(() => account.value.address, () => {
    if (account.value.address) fetchBalance()
    else balance.value = '0.00'
  })

  onMounted(() => { if (account.value.address) fetchBalance() })

  return { balance, isLoading, error, refetch: fetchBalance }
}

function formatEther(wei: bigint): string {
  const divisor = 10n ** 18n
  const whole = wei / divisor
  const fractional = wei % divisor
  const padded = fractional.toString().padStart(18, '0')
  const trimmed = padded.replace(/0+$/, '')
  return trimmed ? `${whole}.${trimmed}` : whole.toString()
}
