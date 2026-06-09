<template>
  <button
    class="group flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left transition"
    :class="[
      status === 'connecting'
        ? 'border-blue-400 bg-blue-50 dark:border-blue-500 dark:bg-blue-950'
        : status === 'connected'
          ? 'border-green-400 bg-green-50 dark:border-green-500 dark:bg-green-950'
          : 'border-gray-200 hover:border-blue-400 hover:bg-blue-50 dark:border-gray-700 dark:hover:border-blue-500 dark:hover:bg-blue-950'
    ]"
    :disabled="disabled || status === 'connecting'"
    @click="handleClick"
  >
    <!-- Wallet icon -->
    <img
      v-if="connector.icon"
      :src="connector.icon"
      :alt="connector.name"
      class="h-8 w-8 rounded-lg"
    />
    <div
      v-else
      class="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-200 text-sm font-bold text-gray-600 transition dark:bg-gray-700 dark:text-gray-300"
    >
      {{ connector.name.charAt(0) }}
    </div>

    <!-- Wallet info -->
    <div class="flex flex-1 flex-col">
      <span class="font-medium text-gray-900 dark:text-white">{{ connector.name }}</span>
      <span class="text-xs text-gray-500 dark:text-gray-400">{{ badgeText }}</span>
    </div>

    <!-- Status indicator -->
    <span v-if="status === 'connecting'" class="text-sm text-blue-500">Connecting...</span>
    <svg v-else-if="status === 'connected'" class="h-5 w-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
      <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
    </svg>
    <svg v-else class="h-5 w-5 text-gray-300 group-hover:text-blue-400 dark:text-gray-600 dark:group-hover:text-blue-500" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
    </svg>
  </button>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useCinacoin } from '../composables.js'
import type { Connector } from '../types.js'

export interface WalletButtonProps {
  connector: Connector
  disabled?: boolean
}

const props = defineProps<WalletButtonProps>()
const emit = defineEmits<{
  select: [connector: Connector]
}>()

const { connect, status } = useCinacoin()

const badgeText = computed(() => {
  if (status.value === 'connected') return 'Connected'
  if (status.value === 'connecting') return 'Connecting...'
  if (props.connector.installed) return 'Installed'
  return 'Not installed'
})

async function handleClick() {
  emit('select', props.connector)
  if (status.value === 'disconnected' || status.value === 'error') {
    try {
      await connect(props.connector.id)
    } catch {
      // status will update via provider
    }
  }
}
</script>
