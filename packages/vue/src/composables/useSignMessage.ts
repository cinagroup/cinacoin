/**
 * useSignMessage — sign a message via connected wallet.
 *
 * ```vue
 * <script setup>
 * const { signMessage, isSigning, signature, error } = useSignMessage()
 *
 * const handleSign = async () => {
 *   const sig = await signMessage('Hello, world!')
 *   console.log('Signature:', sig)
 * }
 * </script>
 * ```
 */

import { ref, type Ref } from 'vue'
import { useCinacoin } from '../composables.js'

export interface UseSignMessageReturn {
  signMessage: (message: string) => Promise<string>
  isSigning: Ref<boolean>
  error: Ref<Error | null>
  signature: Ref<string | null>
}

export function useSignMessage(): UseSignMessageReturn {
  const { account, status } = useCinacoin()

  const isSigning = ref(false)
  const error = ref<Error | null>(null)
  const signature = ref<string | null>(null)

  const signMessageFn = async (message: string): Promise<string> => {
    if (status.value !== 'connected' || !account.value.address) {
      throw new Error('Wallet not connected')
    }

    isSigning.value = true
    error.value = null

    try {
      const provider = (window as unknown as Window & typeof globalThis).ethereum
      if (!provider) {
        throw new Error('No EIP-1193 provider found.')
      }

      const hexMessage =
        '0x' +
        Array.from(new TextEncoder().encode(message))
          .map((b) => b.toString(16).padStart(2, '0'))
          .join('')

      const sig = await provider.request({
        method: 'personal_sign',
        params: [hexMessage, account.value.address],
      })

      signature.value = sig as string
      return sig as string
    } catch (err) {
      const e = err instanceof Error ? err : new Error(String(err))
      error.value = e
      throw e
    } finally {
      isSigning.value = false
    }
  }

  return { signMessage: signMessageFn, isSigning, error, signature }
}
