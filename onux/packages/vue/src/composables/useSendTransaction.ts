/**
 * useSendTransaction — send a transaction via connected wallet.
 *
 * ```vue
 * <script setup>
 * const { sendTransaction, isSending, txHash, error } = useSendTransaction()
 *
 * const handleSend = async () => {
 *   const hash = await sendTransaction({
 *     to: '0x...',
 *     value: '0x16345785d8a0000',
 *   })
 *   console.log('Tx hash:', hash)
 * }
 * </script>
 * ```
 */

import { ref, type Ref } from 'vue'
import { useCinacoin } from '../composables.js'

export interface SendTransactionArgs {
  to: string
  value?: string | bigint
  data?: string
  gas?: string | bigint
}

export interface UseSendTransactionReturn {
  sendTransaction: (args: SendTransactionArgs) => Promise<string>
  isSending: Ref<boolean>
  error: Ref<Error | null>
  txHash: Ref<string | null>
  isConfirmed: Ref<boolean>
}

export function useSendTransaction(): UseSendTransactionReturn {
  const { account, status } = useCinacoin()

  const isSending = ref(false)
  const error = ref<Error | null>(null)
  const txHash = ref<string | null>(null)
  const isConfirmed = ref(false)

  const sendTransactionFn = async (args: SendTransactionArgs): Promise<string> => {
    if (status.value !== 'connected' || !account.value.address) {
      throw new Error('Wallet not connected')
    }

    isSending.value = true
    error.value = null
    isConfirmed.value = false

    try {
      const tx: Record<string, unknown> = {
        from: account.value.address,
        to: args.to,
      }
      if (args.value !== undefined) {
        tx.value = typeof args.value === 'bigint' ? '0x' + args.value.toString(16) : args.value
      }
      if (args.data) tx.data = args.data
      if (args.gas !== undefined) {
        tx.gas = typeof args.gas === 'bigint' ? '0x' + args.gas.toString(16) : args.gas
      }

      const provider = (window as any).ethereum
      if (!provider) {
        throw new Error('No EIP-1193 provider found.')
      }

      const hash = await provider.request({
        method: 'eth_sendTransaction',
        params: [tx],
      })

      txHash.value = hash as string
      return hash as string
    } catch (err) {
      const e = err instanceof Error ? err : new Error(String(err))
      error.value = e
      throw e
    } finally {
      isSending.value = false
    }
  }

  return { sendTransaction: sendTransactionFn, isSending, error, txHash, isConfirmed }
}
