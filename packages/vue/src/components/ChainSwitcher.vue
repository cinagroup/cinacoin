<template>
  <div class="inline-flex items-center gap-2">
    <div class="relative">
      <button
        class="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-700 transition hover:border-gray-300 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:border-gray-600 dark:hover:bg-gray-800"
        @click="isOpen = !isOpen"
      >
        <slot name="selected" :chain="activeChain">
          <span class="truncate">{{ activeChain?.name ?? 'Select Chain' }}</span>
          <svg class="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </slot>
      </button>

      <!-- Dropdown -->
      <div
        v-if="isOpen"
        class="absolute right-0 z-40 mt-1 w-56 rounded-lg border border-gray-200 bg-white py-1 shadow-lg dark:border-gray-700 dark:bg-gray-900"
      >
        <button
          v-for="chain in chains"
          :key="chain.id"
          class="flex w-full items-center gap-2 px-3 py-2 text-sm transition hover:bg-gray-50 dark:hover:bg-gray-800"
          :class="chain.id === activeChain?.id ? 'bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400' : 'text-gray-700 dark:text-gray-300'"
          @click="selectChain(chain.id)"
        >
          <span class="flex h-5 w-5 items-center justify-center rounded-full bg-gray-200 text-xs font-bold dark:bg-gray-700">{{ chain.name.charAt(0) }}</span>
          <span class="flex-1 truncate">{{ chain.name }}</span>
          <svg v-if="chain.id === activeChain?.id" class="h-4 w-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
          </svg>
        </button>
        <slot name="footer" />
      </div>
    </div>

    <!-- Loading indicator -->
    <span v-if="isSwitchingChain" class="inline-block h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-blue-500" />
  </div>

  <!-- Backdrop to close dropdown -->
  <div v-if="isOpen" class="fixed inset-0 z-30" @click="isOpen = false" />
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useCinacoin } from '../composables.js'
import type { ChainConfig } from '../types.js'

export interface ChainSwitcherProps {
  chains?: ChainConfig[]
}

const props = defineProps<ChainSwitcherProps>()
const emit = defineEmits<{
  'chain-change': [chainId: number]
}>()

const { config, account, switchChain, isSwitchingChain } = useCinacoin()
const isOpen = ref(false)

const chains = computed(() => props.chains ?? config.chains ?? [])

const activeChain = computed(() =>
  chains.value.find((c) => c.id === account.value.chainId) ?? null
)

async function selectChain(chainId: number) {
  isOpen.value = false
  if (chainId === account.value.chainId) return
  try {
    await switchChain(chainId)
    emit('chain-change', chainId)
  } catch {
    // error handled by provider
  }
}
</script>
