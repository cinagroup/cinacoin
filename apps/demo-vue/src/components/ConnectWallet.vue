<template>
  <div class="connect-wallet">
    <h2 class="section-title">Connect wallet.</h2>

    <!-- Connect Button -->
    <div class="card">
      <h3 class="card-title">Connect with Reown AppKit.</h3>
      <p class="card-desc">
        Click the button below to open the wallet connection modal powered by Reown AppKit.
      </p>
      <div class="demo-area">
        <button
          v-if="!isConnected"
          class="btn btn-primary"
          @click="openConnectModal"
          aria-label="Connect wallet"
        >
          Connect Wallet
        </button>
        <div v-else class="connected-state">
          <span class="status-indicator"></span>
          <span class="address mono">{{ shortAddress }}</span>
          <button
            class="btn btn-sm btn-error"
            @click="handleDisconnect"
            aria-label="Disconnect wallet"
          >
            Disconnect
          </button>
        </div>
      </div>
    </div>

    <!-- Connection State -->
    <div class="card">
      <h3 class="card-title">Connection state.</h3>
      <div class="demo-area">
        <div class="state-grid" role="list">
          <div class="state-item" role="listitem">
            <span class="state-label">Status</span>
            <span class="state-value">{{ status }}</span>
          </div>
          <div class="state-item" role="listitem">
            <span class="state-label">Address</span>
            <span class="state-value mono">{{ shortAddress }}</span>
          </div>
          <div class="state-item" role="listitem">
            <span class="state-label">Chain ID</span>
            <span class="state-value mono">{{ chainIdDisplay }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useCinacoinWallet } from '@cinacoin/appkit-config/vue'

const { address, isConnected, chainId, status, openConnectModal, disconnect } = useCinacoinWallet()

const shortAddress = computed(() => {
  if (!address.value) return '—'
  return `${address.value.slice(0, 6)}…${address.value.slice(-4)}`
})

const chainIdDisplay = computed(() => chainId.value ?? '—')

async function handleDisconnect() {
  try {
    await disconnect()
  } catch (err) {
    console.error('Disconnect failed:', err)
  }
}
</script>

<style scoped>
.connect-wallet { display: flex; flex-direction: column; gap: 1.25rem; }
.section-title { margin: 0; font-size: 1.5rem; font-weight: 600; color: var(--cc-ink, #ededed); letter-spacing: -0.5px; }
.card {
  background: var(--cc-canvas-soft, #0a0a0a);
  border: 1px solid var(--cc-hairline, rgba(255, 255, 255, 0.08));
  border-radius: 4px;
  padding: 1.25rem;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04), inset 0 0 0 1px rgba(0, 0, 0, 0.08);
}
.card-title { margin: 0 0 0.25rem; font-size: 1rem; font-weight: 600; color: var(--cc-ink, #ededed); }
.card-desc { margin: 0 0 1rem; font-size: 0.875rem; color: var(--cc-body, #a3a3a3); line-height: 1.6; }
.card-desc code { background: var(--cc-canvas-soft-2, #111111); padding: 0.125rem 0.375rem; border-radius: 4px; font-size: 0.75rem; color: var(--cc-link, #0070f3); font-family: var(--font-mono, 'Geist Mono'), monospace; }
.demo-area { min-height: 40px; }
.btn {
  padding: 0.5rem 1rem;
  border-radius: 4px;
  border: none;
  font-weight: 500;
  cursor: pointer;
  font-size: 0.875rem;
  font-family: var(--font-geist-sans, 'Geist'), sans-serif;
  transition: opacity 0.15s;
}
.btn:hover { opacity: 0.85; }
.btn-primary { background: var(--cc-primary); color: var(--cc-on-primary); }
.btn-sm { padding: 0.25rem 0.75rem; font-size: 0.8rem; }
.btn-error { background: var(--cc-error); color: var(--cc-on-primary); border-radius: 4px; }
.connected-state {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.5rem 0.75rem;
  background: var(--cc-canvas-soft-2, #111111);
  border: 1px solid var(--cc-hairline, rgba(255, 255, 255, 0.08));
  border-radius: 4px;
}
.status-indicator {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--cc-success, #22c55e);
}
.address {
  flex: 1;
  color: var(--cc-ink, #ededed);
  font-size: 0.875rem;
}
.mono { font-family: var(--font-mono, 'Geist Mono'), monospace; }
.state-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 0.75rem; }
.state-item { display: flex; flex-direction: column; gap: 0.25rem; }
.state-label { font-size: 0.75rem; color: var(--cc-muted, #737373); letter-spacing: 0.02em; }
.state-value { color: var(--cc-ink, #ededed); font-size: 0.9rem; }

/* ── Responsive ───────────────────────────────────────────────────── */
@media (max-width: 640px) {
  .card {
    padding: 1rem;
  }

  .state-grid {
    grid-template-columns: 1fr;
  }

  .connected-state {
    flex-wrap: wrap;
  }
}
</style>
