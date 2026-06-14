<template>
  <div class="cc-card">
    <h3 class="cc-display-sm">Swap Tokens</h3>
    
    <div v-if="!isConnected" class="cc-body-sm text-[var(--cc-muted)] mt-2">
      Connect your wallet to swap tokens
    </div>

    <div v-else class="space-y-3">
      <p class="cc-caption font-[var(--font-mono)] text-[var(--cc-body)]">
        From: {{ address?.slice(0, 8) }}...{{ address?.slice(-4) }}
      </p>

      <!-- From field -->
      <div class="space-y-2">
        <label class="cc-caption text-[var(--cc-muted)]">From</label>
        <div class="flex gap-2">
          <input
            type="number"
            v-model="amount"
            placeholder="0.0"
            class="flex-1 cc-form-input focus-ring"
          />
          <select v-model="fromToken" class="cc-form-input cursor-pointer focus-ring">
            <option v-for="t in tokens" :key="t.symbol" :value="t.symbol">{{ t.symbol }}</option>
          </select>
        </div>
      </div>

      <!-- Arrow -->
      <div class="flex justify-center py-1">
        <span class="text-[var(--cc-muted)] text-display-sm" aria-hidden="true">↓</span>
      </div>

      <!-- To field -->
      <div class="space-y-2">
        <label class="cc-caption text-[var(--cc-muted)]">To</label>
        <div class="flex gap-2">
          <input type="text" placeholder="0.0" readonly class="flex-1 cc-form-input text-[var(--cc-muted)]" />
          <select v-model="toToken" class="cc-form-input cursor-pointer focus-ring">
            <option v-for="t in tokens" :key="t.symbol" :value="t.symbol">{{ t.symbol }}</option>
          </select>
        </div>
      </div>

      <!-- Swap button -->
      <button class="cc-btn-primary w-full disabled:opacity-40 disabled:cursor-not-allowed focus-ring" :disabled="!amount">
        Swap
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useCinacoinWallet } from '@cinacoin/appkit-config/vue'

const { isConnected, address } = useCinacoinWallet()

const fromToken = ref('ETH')
const toToken = ref('USDC')
const amount = ref('')

const tokens = [
  { symbol: 'ETH', name: 'Ethereum' },
  { symbol: 'USDC', name: 'USD Coin' },
  { symbol: 'USDT', name: 'Tether' },
  { symbol: 'DAI', name: 'Dai' },
  { symbol: 'WBTC', name: 'Wrapped Bitcoin' },
]
</script>
