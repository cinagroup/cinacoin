<template>
  <div :class="containerClasses">
    <slot :connectors="visibleConnectors">
      <WalletButton
        v-for="connector in visibleConnectors"
        :key="connector.id"
        :connector="connector"
        @select="(c) => emit('select', c)"
      />
    </slot>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useCinacoin } from '../composables.js'
import WalletButton from './WalletButton.vue'
import type { Connector } from '../types.js'

export interface WalletButtonGroupProps {
  layout?: 'grid' | 'list'
  columns?: number
  recommendedWalletIds?: string[]
}

const props = withDefaults(defineProps<WalletButtonGroupProps>(), {
  layout: 'list',
  columns: 2,
  recommendedWalletIds: () => [],
})

const emit = defineEmits<{
  select: [connector: Connector]
}>()

const { connectors } = useCinacoin()

const visibleConnectors = computed(() => {
  const all = connectors.value
  if (props.recommendedWalletIds.length === 0) return all
  const recommended = all.filter((c) => props.recommendedWalletIds.includes(c.id))
  const others = all.filter((c) => !props.recommendedWalletIds.includes(c.id))
  return [...recommended, ...others]
})

const containerClasses = computed(() => {
  if (props.layout === 'grid') {
    const cols = Math.min(props.columns, 3)
    return `grid grid-cols-1 gap-3 sm:grid-cols-${cols}`
  }
  return 'flex flex-col gap-2'
})
</script>
