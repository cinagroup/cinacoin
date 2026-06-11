<template>
  <div class="connect-wallet">
    <h2 class="section-title">Connect wallet.</h2>

    <!-- ConnectButton demo -->
    <div class="card">
      <h3 class="card-title">ConnectButton (Web component).</h3>
      <p class="card-desc">
        Using <code>OcxConnectButton</code> — the built-in Vue wrapper for the CinaCoin connect button web component.
      </p>
      <div class="demo-area">
        <OcxConnectButton
          label="Connect with CinaCoin"
          variant="primary"
          size="lg"
          :show-balance="true"
          :show-avatar="true"
          :show-network="true"
          aria-label="Connect wallet with CinaCoin"
        />
      </div>
    </div>

    <!-- ConnectModal demo -->
    <div class="card">
      <h3 class="card-title">ConnectModal with custom config.</h3>
      <p class="card-desc">
        Open the modal programmatically and configure recommended wallets.
      </p>
      <div class="demo-area">
        <button class="btn btn-outline" @click="modalOpen = true" aria-label="Open connect modal">
          Open ConnectModal
        </button>
        <ConnectModal
          :is-open="modalOpen"
          default-view="wallets"
          :recommended-wallet-ids="['metamask', 'walletconnect', 'coinbase']"
          @close="modalOpen = false"
          @wallet-select="onWalletSelect"
        />
      </div>
    </div>

    <!-- EIP-6963 Wallet Detection -->
    <div class="card">
      <h3 class="card-title">Detected wallets (EIP-6963).</h3>
      <p class="card-desc">
        Wallets detected via EIP-6963 Multi-Provider Discovery.
      </p>
      <div class="demo-area">
        <div v-if="connectors.length === 0" class="empty-state" role="status">
          No wallets detected yet.
        </div>
        <ul v-else class="wallet-list" role="list">
          <li
            v-for="c in connectors"
            :key="c.id"
            class="wallet-item"
            :class="{ installed: c.installed }"
          >
            <span class="wallet-icon" aria-hidden="true">{{ walletIcon(c.id) }}</span>
            <span class="wallet-name">{{ c.name }}</span>
            <span class="wallet-type">{{ c.type }}</span>
            <span
              class="wallet-badge"
              :class="c.installed ? 'badge-green' : 'badge-gray'"
              role="status"
            >
              {{ c.installed ? 'Installed' : 'Not installed' }}
            </span>
            <button
              v-if="c.installed && status === 'disconnected'"
              class="btn btn-sm"
              @click="handleConnect(c.id)"
              :aria-label="`Connect to ${c.name}`"
            >
              Connect
            </button>
          </li>
        </ul>
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
          <div class="state-item" v-if="status === 'connected'" role="listitem">
            <button class="btn btn-sm btn-red" @click="handleDisconnect" aria-label="Disconnect wallet">
              Disconnect
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import {
  useCinacoin,
  OcxConnectButton,
  ConnectModal,
} from '@cinacoin/vue'

const { status, account, connectors, connect, disconnect } = useCinacoin()

const modalOpen = ref(false)

const shortAddress = computed(() => {
  const addr = account.value.address
  if (!addr) return '—'
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`
})

const chainIdDisplay = computed(() => account.value.chainId ?? '—')

function walletIcon(id: string): string {
  const icons: Record<string, string> = {
    metamask: '🦊',
    walletconnect: '🔗',
    coinbase: '🔵',
  }
  return icons[id] ?? '👛'
}

function onWalletSelect(detail: any) {
  console.log('Wallet selected:', detail)
  modalOpen.value = false
}

async function handleConnect(id: string) {
  try {
    await connect(id)
  } catch (err) {
    console.error('Connect failed:', err)
  }
}

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
.section-title { margin: 0; font-size: 1.5rem; font-weight: 600; color: var(--cc-ink, #f1f5f9); }
.card {
  background: var(--cc-canvas, #1e293b);
  border: 1px solid var(--cc-hairline, #334155);
  border-radius: 0.75rem;
  padding: 1.25rem;
}
.card-title { margin: 0 0 0.25rem; font-size: 1rem; font-weight: 600; color: var(--cc-ink, #e2e8f0); }
.card-desc { margin: 0 0 1rem; font-size: 0.875rem; color: var(--cc-body, #94a3b8); line-height: 1.6; }
.card-desc code { background: var(--cc-canvas-soft-2, #0f172a); padding: 0.125rem 0.375rem; border-radius: 4px; font-size: 0.75rem; color: var(--cc-link, #38bdf8); }
.demo-area { min-height: 40px; }
.btn {
  padding: 0.5rem 1rem;
  border-radius: 0.5rem;
  border: none;
  font-weight: 600;
  cursor: pointer;
  font-size: 0.875rem;
  transition: all 0.15s;
}
.btn-outline {
  background: transparent;
  border: 1px solid var(--cc-link, #3b82f6);
  color: var(--cc-link, #3b82f6);
}
.btn-outline:hover { background: var(--cc-link-bg-soft, #1e3a5f); }
.btn-sm { padding: 0.25rem 0.75rem; font-size: 0.8rem; background: var(--cc-link, #3b82f6); color: #fff; }
.btn-sm:hover { background: var(--cc-link-deep, #2563eb); }
.btn-red { background: var(--cc-error, #dc2626); }
.btn-red:hover { background: #b91c1c; }
.wallet-list { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 0.5rem; }
.wallet-item {
  display: flex; align-items: center; gap: 0.5rem;
  background: var(--cc-canvas-soft-2, #0f172a); padding: 0.5rem 0.75rem; border-radius: 0.5rem;
}
.wallet-icon { font-size: 1.25rem; }
.wallet-name { flex: 1; color: var(--cc-ink, #e2e8f0); font-weight: 500; }
.wallet-type { color: var(--cc-muted, #64748b); font-size: 0.75rem; text-transform: uppercase; }
.wallet-badge { padding: 0.125rem 0.5rem; border-radius: 999px; font-size: 0.7rem; font-weight: 600; }
.badge-green { background: #064e3b; color: var(--cc-success, #34d399); }
.badge-gray { background: var(--cc-canvas, #1e293b); color: var(--cc-muted, #64748b); }
.empty-state { color: var(--cc-muted, #64748b); font-style: italic; font-size: 0.875rem; }
.state-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 0.75rem; }
.state-item { display: flex; flex-direction: column; gap: 0.25rem; }
.state-label { font-size: 0.75rem; color: var(--cc-muted, #64748b); text-transform: uppercase; letter-spacing: 0.05em; }
.state-value { color: var(--cc-ink, #e2e8f0); font-size: 0.9rem; }
.mono { font-family: 'Geist Mono', 'SF Mono', 'Fira Code', monospace; }

/* ── Responsive ───────────────────────────────────────────────────── */
@media (max-width: 640px) {
  .card {
    padding: 1rem;
  }

  .state-grid {
    grid-template-columns: 1fr;
  }

  .wallet-item {
    flex-wrap: wrap;
  }

  .wallet-type {
    width: 100%;
    margin-top: 0.25rem;
  }
}
</style>
