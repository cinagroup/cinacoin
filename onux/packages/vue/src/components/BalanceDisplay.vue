<template>
  <div class="inline-flex items-center gap-2">
    <!-- Wallet icon / avatar -->
    <slot name="icon">
      <div v-if="showAvatar" class="flex h-8 w-8 items-center justify-center rounded-full bg-blue-500 text-sm font-bold text-white">
        {{ shortAddress.slice(0, 2) }}
      </div>
    </slot>

    <!-- Balance -->
    <slot :balance="balance" :symbol="symbol">
      <span v-if="showBalance && balance !== '0.00'" class="text-sm font-medium text-gray-700 dark:text-gray-300">
        {{ balance }} {{ symbol }}
      </span>
    </slot>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useBalance } from '../composables.js'
import { useCinacoin } from '../composables.js'

export interface BalanceDisplayProps {
  showBalance?: boolean
  showAvatar?: boolean
  address?: string
  decimals?: number
}

const props = withDefaults(defineProps<BalanceDisplayProps>(), {
  showBalance: true,
  showAvatar: false,
  address: undefined,
  decimals: 2,
})

const { account } = useCinacoin()
const { balance } = useBalance()

const symbol = computed(() => account.value.chainSymbol ?? '')

const shortAddress = computed(() => {
  const addr = props.address ?? account.value.address ?? ''
  if (!addr) return '0x0'
  return addr.slice(2, 4).toUpperCase()
})
</script>
