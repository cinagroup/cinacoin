<template>
  <slot name="overlay" :is-open="isOpen" :close="closeModal">
    <ModalShell v-if="isOpen">
      <!-- Header -->
      <div class="mb-4 flex items-center justify-between">
        <h2 class="text-lg font-semibold text-gray-900 dark:text-white">{{ title }}</h2>
        <button
          class="rounded-lg p-1 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-300"
          @click="closeModal"
        >
          <slot name="close-icon">
            <svg class="h-5 w-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </slot>
        </button>
      </div>

      <!-- Connecting state -->
      <div v-if="status === 'connecting'" class="py-8 text-center">
        <slot name="connecting">
          <div class="inline-block h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-blue-500" />
          <p class="mt-3 text-sm text-gray-500 dark:text-gray-400">Connecting to wallet...</p>
        </slot>
      </div>

      <!-- Wallet list -->
      <div v-else-if="showWallets" class="space-y-2">
        <p v-if="subtitle" class="mb-3 text-sm text-gray-500 dark:text-gray-400">{{ subtitle }}</p>
        <button
          v-for="connector in visibleConnectors"
          :key="connector.id"
          class="flex w-full items-center gap-3 rounded-xl border border-gray-200 px-4 py-3 text-left transition hover:border-blue-400 hover:bg-blue-50 dark:border-gray-700 dark:hover:border-blue-500 dark:hover:bg-blue-950 disabled:opacity-50"
          :disabled="connectingId === connector.id"
          @click="handleSelect(connector.id)"
        >
          <img v-if="connector.icon" :src="connector.icon" :alt="connector.name" class="h-8 w-8 rounded-lg" />
          <div v-else class="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-200 text-sm font-bold text-gray-600 dark:bg-gray-700 dark:text-gray-300">
            {{ connector.name.charAt(0) }}
          </div>
          <span class="flex-1 font-medium text-gray-900 dark:text-white">{{ connector.name }}</span>
          <span v-if="connectingId === connector.id" class="text-sm text-blue-500">Connecting...</span>
          <span v-else-if="connector.installed" class="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700 dark:bg-green-900 dark:text-green-300">Installed</span>
          <span v-else class="text-xs text-gray-400 dark:text-gray-500">Not installed</span>
        </button>
      </div>

      <!-- Error state -->
      <div v-else-if="status === 'error'" class="py-6 text-center">
        <slot name="error">
          <p class="text-sm text-red-500">Connection failed. Please try again.</p>
          <button
            class="mt-3 rounded-lg bg-blue-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-600"
            @click="closeModal"
          >
            Close
          </button>
        </slot>
      </div>

      <slot name="footer" />
    </ModalShell>
  </slot>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useCinacoin } from '../composables.js'
import type { Connector } from '../types.js'

export interface ConnectModalProps {
  isOpen?: boolean
  title?: string
  subtitle?: string
  teleportTo?: string | false
  recommendedWalletIds?: string[]
}

const props = withDefaults(defineProps<ConnectModalProps>(), {
  isOpen: false,
  title: 'Connect Wallet',
  subtitle: 'Choose your preferred wallet',
  teleportTo: 'body',
  recommendedWalletIds: () => [],
})

const emit = defineEmits<{
  'update:isOpen': [value: boolean]
  'wallet-select': [connector: Connector]
  'connected': [connector: Connector]
}>()

const { connectors, connect, status } = useCinacoin()
const connectingId = ref<string | null>(null)

const showWallets = computed(() =>
  status.value === 'disconnected' || status.value === 'error'
)

const visibleConnectors = computed(() => {
  const all = connectors.value
  if (props.recommendedWalletIds.length === 0) return all
  const recommended = all.filter((c) => props.recommendedWalletIds.includes(c.id))
  const others = all.filter((c) => !props.recommendedWalletIds.includes(c.id))
  return [...recommended, ...others]
})

function closeModal() {
  emit('update:isOpen', false)
}

async function handleSelect(connectorId: string) {
  connectingId.value = connectorId
  try {
    await connect(connectorId)
    const connector = connectors.value.find((c) => c.id === connectorId)
    if (connector) emit('wallet-select', connector)
    if (connector) emit('connected', connector)
    closeModal()
  } catch {
    // Status will update to 'error' via CinacoinProvider
  } finally {
    connectingId.value = null
  }
}
</script>
