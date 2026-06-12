<template>
  <div class="account-balance">
    <h2 class="section-title">Account balance.</h2>

    <div class="card">
      <h3 class="card-title">
        {{ account.value.ensName ?? shortAddress }}
      </h3>
      <div class="demo-area">
        <div class="balance-display" v-if="status === 'connected'">
          <div class="balance-main">
            <span class="balance-amount">{{ formattedBalance }}</span>
            <span class="balance-symbol">{{ account.value.chainSymbol }}</span>
          </div>
          <div class="balance-actions">
            <button
              class="btn btn-sm"
              @click="refetch"
              :disabled="isLoading"
              aria-label="Refresh balance"
            >
              {{ isLoading ? 'Refreshing...' : '↻ Refresh' }}
            </button>
          </div>
        </div>
        <div v-else class="empty-state" role="status">
          Connect wallet to see balance.
        </div>
      </div>
    </div>

    <!-- ENS Name -->
    <div class="card" v-if="status === 'connected'">
      <h3 class="card-title">ENS lookup.</h3>
      <div class="demo-area">
        <div class="ens-display">
          <span class="ens-label">Address:</span>
          <span class="ens-value mono">{{ account.value.address }}</span>
        </div>
        <div class="ens-display">
          <span class="ens-label">ENS name:</span>
          <span class="ens-value" :class="{ 'has-name': ensName }">
            {{ ensName ?? 'Not found.' }}
          </span>
        </div>
        <div v-if="ensIsLoading" class="loading-text" role="status">Resolving ENS...</div>
        <div v-if="ensError" class="error-text" role="alert">{{ ensError.message }}</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useCinacoin, useBalance, useEnsName } from '@cinacoin/vue'

const { status, account } = useCinacoin()
const { balance, isLoading, refetch } = useBalance()
const { ensName, isLoading: ensIsLoading, error: ensError } = useEnsName()

const shortAddress = computed(() => {
  const addr = account.value.address
  if (!addr) return '—'
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`
})

const formattedBalance = computed(() => {
  const b = balance.value
  if (!b || b === '0.00') return '0.0000'
  return Number(b).toFixed(4)
})
</script>

<style scoped>
.account-balance { display: flex; flex-direction: column; gap: 1.25rem; }
.section-title { margin: 0; font-size: 1.5rem; font-weight: 600; color: var(--cc-ink, #f1f5f9); }
.card {
  background: var(--cc-canvas, #1e293b);
  border: 1px solid var(--cc-hairline, #334155);
  border-radius: 0.75rem;
  padding: 1.25rem;
}
.card-title { margin: 0 0 0.25rem; font-size: 1rem; font-weight: 600; color: var(--cc-ink, #e2e8f0); }
.demo-area { min-height: 40px; }
.balance-display { display: flex; align-items: center; justify-content: space-between; }
.balance-main { display: flex; align-items: baseline; gap: 0.5rem; }
.balance-amount { font-size: 2rem; font-weight: 600; color: var(--cc-success, #22c55e); font-family: 'Geist Mono', monospace; }
.balance-symbol { font-size: 1rem; color: var(--cc-body, #94a3b8); font-weight: 500; }
.btn {
  padding: 0.5rem 1rem; border-radius: 0.5rem; border: none;
  font-weight: 600; cursor: pointer; font-size: 0.875rem; transition: all 0.15s;
}
.btn-sm { padding: 0.25rem 0.75rem; font-size: 0.8rem; background: var(--cc-link, #3b82f6); color: #fff; }
.btn-sm:hover:not(:disabled) { background: var(--cc-link-deep, #2563eb); }
.btn-sm:disabled { opacity: 0.5; cursor: not-allowed; }
.empty-state { color: var(--cc-muted, #64748b); font-style: italic; font-size: 0.875rem; }
.ens-display { display: flex; align-items: baseline; gap: 0.5rem; margin-bottom: 0.5rem; }
.ens-label { font-size: 0.75rem; color: var(--cc-muted, #64748b); min-width: 90px; letter-spacing: 0.05em; }
.ens-value { color: var(--cc-ink, #e2e8f0); font-size: 0.875rem; }
.has-name { color: var(--cc-link, #38bdf8); font-weight: 500; }
.mono { font-family: 'Geist Mono', 'SF Mono', 'Fira Code', monospace; }
.loading-text { color: var(--cc-link, #38bdf8); font-size: 0.75rem; margin-top: 0.5rem; }
.error-text { color: var(--cc-error, #ef4444); font-size: 0.75rem; margin-top: 0.5rem; }

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
