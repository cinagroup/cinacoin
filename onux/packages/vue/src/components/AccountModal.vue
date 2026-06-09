<template>
  <Teleport :to="teleportTo" :disabled="!teleportTo">
    <div v-if="isOpen" class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" @click.self="closeModal">
      <div class="relative w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl dark:bg-gray-900">
        <!-- Header -->
        <div class="mb-4 flex items-center justify-between">
          <h2 class="text-lg font-semibold text-gray-900 dark:text-white">{{ title }}</h2>
          <button class="rounded-lg p-1 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-300" @click="closeModal">
            <slot name="close-icon">
              <svg class="h-5 w-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </slot>
          </button>
        </div>

        <!-- Account info -->
        <div class="space-y-4">
          <!-- Address -->
          <div>
            <label class="text-xs font-medium text-gray-500 dark:text-gray-400">Address</label>
            <slot name="address" :address="account.address">
              <div class="mt-1 flex items-center gap-2 rounded-lg bg-gray-50 px-3 py-2 dark:bg-gray-800">
                <span class="flex-1 truncate font-mono text-sm text-gray-900 dark:text-white">{{ shortAddress }}</span>
                <button class="rounded p-1 text-gray-400 transition hover:bg-gray-200 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-300" @click="copyAddress" :title="copied ? 'Copied!' : 'Copy'">
                  <svg v-if="!copied" class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  <svg v-else class="h-4 w-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                  </svg>
                </button>
              </div>
            </slot>
          </div>

          <!-- Balance -->
          <div>
            <label class="text-xs font-medium text-gray-500 dark:text-gray-400">Balance</label>
            <slot name="balance" :balance="balanceValue" :symbol="account.chainSymbol">
              <p class="mt-1 text-2xl font-bold text-gray-900 dark:text-white">
                {{ balanceValue }} <span class="text-base font-normal text-gray-500 dark:text-gray-400">{{ account.chainSymbol }}</span>
              </p>
            </slot>
          </div>

          <!-- Chain -->
          <div v-if="activeChain">
            <label class="text-xs font-medium text-gray-500 dark:text-gray-400">Network</label>
            <slot name="chain" :chain="activeChain">
              <p class="mt-1 text-sm text-gray-900 dark:text-white">{{ activeChain.name }}</p>
            </slot>
          </div>

          <!-- ENS name -->
          <div v-if="account.ensName">
            <label class="text-xs font-medium text-gray-500 dark:text-gray-400">ENS</label>
            <slot name="ens" :ens="account.ensName">
              <p class="mt-1 text-sm text-gray-900 dark:text-white">{{ account.ensName }}</p>
            </slot>
          </div>

          <!-- Actions -->
          <slot name="actions">
            <button
              class="w-full rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950"
              @click="handleDisconnect"
            >
              Disconnect
            </button>
          </slot>
        </div>

        <slot name="footer" />
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useCinacoin } from '../composables.js'

export interface AccountModalProps {
  isOpen?: boolean
  title?: string
  teleportTo?: string | false
}

const props = withDefaults(defineProps<AccountModalProps>(), {
  isOpen: false,
  title: 'Account',
  teleportTo: 'body',
})

const emit = defineEmits<{
  'update:isOpen': [value: boolean]
  disconnect: []
}>()

const { account, disconnect, config } = useCinacoin()
const copied = ref(false)

const shortAddress = computed(() => {
  const addr = account.value.address
  if (!addr) return ''
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`
})

const activeChain = computed(() =>
  config.chains?.find((c) => c.id === account.value.chainId) ?? null
)

const balanceValue = computed(() => account.value.balance)

function closeModal() { emit('update:isOpen', false) }

async function handleDisconnect() {
  try {
    await disconnect()
    emit('disconnect')
    closeModal()
  } catch {
    // error handled by provider
  }
}

async function copyAddress() {
  if (!account.value.address) return
  try {
    await navigator.clipboard.writeText(account.value.address)
    copied.value = true
    setTimeout(() => { copied.value = false }, 2000)
  } catch {
    // clipboard not available
  }
}
</script>
