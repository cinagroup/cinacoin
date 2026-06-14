<template>
  <div class="cc-card">
    <h3 class="cc-display-sm">Buy Crypto</h3>

    <div v-if="!isConnected" class="cc-body-sm text-[var(--cc-muted)] mt-2">
      Connect your wallet to buy crypto
    </div>

    <div v-else class="space-y-4">
      <p class="cc-caption font-[var(--font-mono)] text-[var(--cc-body)]">
        To: {{ address?.slice(0, 8) }}...{{ address?.slice(-4) }}
      </p>

      <!-- Amount field -->
      <div class="space-y-2">
        <label class="cc-caption text-[var(--cc-muted)]">Amount</label>
        <div class="flex gap-2">
          <input
            type="number"
            v-model="fiatAmount"
            class="flex-1 cc-form-input focus-ring"
          />
          <select v-model="fiatCurrency" class="cc-form-input cursor-pointer focus-ring">
            <option value="USD">USD</option>
            <option value="EUR">EUR</option>
            <option value="GBP">GBP</option>
          </select>
        </div>
      </div>

      <!-- Receive token -->
      <div class="space-y-2">
        <label class="cc-caption text-[var(--cc-muted)]">Receive</label>
        <select v-model="cryptoToken" class="cc-form-input w-full cursor-pointer focus-ring">
          <option value="ETH">Ethereum (ETH)</option>
          <option value="USDC">USD Coin (USDC)</option>
          <option value="BTC">Bitcoin (BTC)</option>
        </select>
      </div>

      <!-- Providers -->
      <div class="space-y-2">
        <label class="cc-caption text-[var(--cc-muted)]">Providers</label>
        <div class="space-y-2">
          <div
            v-for="p in providers"
            :key="p.id"
            class="flex items-center justify-between p-3 bg-[var(--cc-canvas-soft-2)] border border-[var(--cc-hairline)] rounded-sm hover:bg-[var(--cc-canvas-soft)] transition-colors"
          >
            <span class="text-body-sm font-medium text-[var(--cc-ink)]">{{ p.name }}</span>
            <span class="cc-caption text-[var(--cc-muted)]">Fee: {{ p.fee }}</span>
            <button class="cc-btn-primary-sm focus-ring">Buy</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useCinacoinWallet } from '@cinacoin/appkit-config/vue'

const { isConnected, address } = useCinacoinWallet()

const fiatAmount = ref('100')
const fiatCurrency = ref('USD')
const cryptoToken = ref('ETH')

const providers = [
  { id: 'stripe', name: 'Stripe', fee: '1.5%' },
  { id: 'moonpay', name: 'MoonPay', fee: '2.5%' },
  { id: 'ramp', name: 'Ramp', fee: '1.2%' },
  { id: 'coinbase-pay', name: 'Coinbase Pay', fee: '1.8%' },
]
</script>
