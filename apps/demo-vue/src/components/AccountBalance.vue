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
.section-title { margin: 0; font-size: 1.5rem; font-weight: 600; color: var(--cc-ink, #171717); letter-spacing: -0.5px; }
.card {
  background: var(--cc-canvas, #ffffff);
  border: 1px solid var(--cc-hairline, #ebebeb);
  border-radius: 8px;
  padding: 1.25rem;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04), inset 0 0 0 1px rgba(0, 0, 0, 0.08);
}
.card-title { margin: 0 0 0.25rem; font-size: 1rem; font-weight: 600; color: var(--cc-ink, #171717); }
.demo-area { min-height: 40px; }
.balance-display { display: flex; align-items: center; justify-content: space-between; }
.balance-main { display: flex; align-items: baseline; gap: 0.5rem; }
.balance-amount { font-size: 2rem; font-weight: 600; color: var(--cc-success, #0070f3); font-family: var(--font-mono, 'Geist Mono'), monospace; }
.balance-symbol { font-size: 1rem; color: var(--cc-body, #4d4d4d); font-weight: 500; }
.btn {
  padding: 0.5rem 1rem; border-radius: 100px; border: none;
  font-weight: 500; cursor: pointer; font-size: 0.875rem; transition: opacity 0.15s;
  font-family: var(--font-geist-sans, 'Geist'), sans-serif;
}
.btn:hover:not(:disabled) { opacity: 0.85; }
.btn-sm { padding: 0.25rem 0.75rem; font-size: 0.8rem; background: var(--cc-primary, #171717); color: var(--cc-on-primary, #ffffff); }
.btn-sm:disabled { opacity: 0.5; cursor: not-allowed; }
.empty-state { color: var(--cc-muted, #888888); font-size: 0.875rem; }
.ens-display { display: flex; align-items: baseline; gap: 0.5rem; margin-bottom: 0.5rem; }
.ens-label { font-size: 0.75rem; color: var(--cc-muted, #888888); min-width: 90px; letter-spacing: 0.02em; }
.ens-value { color: var(--cc-ink, #171717); font-size: 0.875rem; }
.has-name { color: var(--cc-link, #0070f3); font-weight: 500; }
.mono { font-family: var(--font-mono, 'Geist Mono'), monospace; }
.loading-text { color: var(--cc-link, #0070f3); font-size: 0.75rem; margin-top: 0.5rem; }
.error-text { color: var(--cc-error, #ee0000); font-size: 0.75rem; margin-top: 0.5rem; }

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
