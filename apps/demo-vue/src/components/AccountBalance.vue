<template>
  <div class="account-balance">
    <h2 class="section-title">Account balance.</h2>

    <div class="card">
      <h3 class="card-title">
        {{ shortAddress }}
      </h3>
      <div class="demo-area">
        <div class="balance-display" v-if="status === 'connected'">
          <div class="balance-main">
            <span class="balance-amount">—</span>
            <span class="balance-symbol">ETH</span>
          </div>
          <div class="balance-actions">
            <span class="balance-note">Balance via AppKit</span>
          </div>
        </div>
        <div v-else class="empty-state" role="status">
          Connect wallet to see balance.
        </div>
      </div>
    </div>

    <!-- Address Display -->
    <div class="card" v-if="status === 'connected'">
      <h3 class="card-title">Wallet details.</h3>
      <div class="demo-area">
        <div class="ens-display">
          <span class="ens-label">Address:</span>
          <span class="ens-value mono">{{ address }}</span>
        </div>
        <div class="ens-display">
          <span class="ens-label">Chain ID:</span>
          <span class="ens-value mono">{{ chainId ?? '—' }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useCinacoinWallet } from '@cinacoin/appkit-config/vue'

const { address, chainId, status } = useCinacoinWallet()

const shortAddress = computed(() => {
  if (!address.value) return '—'
  return `${address.value.slice(0, 6)}…${address.value.slice(-4)}`
})
</script>

<style scoped>
.account-balance { display: flex; flex-direction: column; gap: 1.25rem; }
.section-title { margin: 0; font-size: 1.5rem; font-weight: 600; color: var(--cc-ink, #ededed); letter-spacing: -0.5px; }
.card {
  background: var(--cc-canvas-soft, #0a0a0a);
  border: 1px solid var(--cc-hairline, rgba(255, 255, 255, 0.08));
  border-radius: 4px;
  padding: 1.25rem;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04), inset 0 0 0 1px rgba(0, 0, 0, 0.08);
}
.card-title { margin: 0 0 0.25rem; font-size: 1rem; font-weight: 600; color: var(--cc-ink, #ededed); }
.demo-area { min-height: 40px; }
.balance-display { display: flex; align-items: center; justify-content: space-between; }
.balance-main { display: flex; align-items: baseline; gap: 0.5rem; }
.balance-amount { font-size: 2rem; font-weight: 600; color: var(--cc-success, #22c55e); font-family: var(--font-mono, 'Geist Mono'), monospace; }
.balance-symbol { font-size: 1rem; color: var(--cc-body, #a3a3a3); font-weight: 500; }
.balance-note { font-size: 0.75rem; color: var(--cc-muted, #737373); }
.empty-state { color: var(--cc-muted, #737373); font-size: 0.875rem; }
.ens-display { display: flex; align-items: baseline; gap: 0.5rem; margin-bottom: 0.5rem; }
.ens-label { font-size: 0.75rem; color: var(--cc-muted, #737373); min-width: 90px; letter-spacing: 0.02em; }
.ens-value { color: var(--cc-ink, #ededed); font-size: 0.875rem; }
.mono { font-family: var(--font-mono, 'Geist Mono'), monospace; }

/* ── Responsive ───────────────────────────────────────────────────── */
@media (max-width: 640px) {
  .card {
    padding: 1rem;
  }

  .balance-display {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }

  .balance-amount {
    font-size: 1.5rem;
  }

  .ens-display {
    flex-direction: column;
    gap: 0.25rem;
  }

  .ens-label {
    min-width: auto;
  }
}
</style>
