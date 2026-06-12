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
              :class="c.installed ? 'badge-blue' : 'badge-gray'"
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
            <button class="btn btn-sm btn-error" @click="handleDisconnect" aria-label="Disconnect wallet">
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
  // Use text abbreviations instead of emojis per UI.md anti-patterns
  const icons: Record<string, string> = {
    metamask: 'MM',
    walletconnect: 'WC',
    coinbase: 'CB',
  }
  return icons[id] ?? '?'
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
.section-title { margin: 0; font-size: 1.5rem; font-weight: 600; color: var(--cc-ink, #171717); letter-spacing: -0.5px; }
.card {
  background: var(--cc-canvas, #ffffff);
  border: 1px solid var(--cc-hairline, #ebebeb);
  border-radius: 8px;
  padding: 1.25rem;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04), inset 0 0 0 1px rgba(0, 0, 0, 0.08);
}
.card-title { margin: 0 0 0.25rem; font-size: 1rem; font-weight: 600; color: var(--cc-ink, #171717); }
.card-desc { margin: 0 0 1rem; font-size: 0.875rem; color: var(--cc-body, #4d4d4d); line-height: 1.6; }
.card-desc code { background: var(--cc-canvas-soft-2, #f5f5f5); padding: 0.125rem 0.375rem; border-radius: 4px; font-size: 0.75rem; color: var(--cc-link, #0070f3); font-family: var(--font-mono, 'Geist Mono'), monospace; }
.demo-area { min-height: 40px; }
.btn {
  padding: 0.5rem 1rem;
  border-radius: 100px;
  border: none;
  font-weight: 500;
  cursor: pointer;
  font-size: 0.875rem;
  font-family: var(--font-geist-sans, 'Geist'), sans-serif;
  transition: opacity 0.15s;
}
.btn:hover { opacity: 0.85; }
.btn-outline {
  background: transparent;
  border: 1px solid var(--cc-hairline, #ebebeb);
  color: var(--cc-ink, #171717);
}
.btn-outline:hover { background: var(--cc-canvas-soft-2, #f5f5f5); opacity: 1; }
.btn-sm { padding: 0.25rem 0.75rem; font-size: 0.8rem; background: var(--cc-primary, #171717); color: var(--cc-on-primary, #ffffff); border-radius: 100px; }
.btn-error { background: var(--cc-error, #ee0000); color: #ffffff; border-radius: 100px; }
.wallet-list { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 0.5rem; }
.wallet-item {
  display: flex; align-items: center; gap: 0.5rem;
  background: var(--cc-canvas-soft-2, #f5f5f5); padding: 0.5rem 0.75rem; border-radius: 6px;
  border: 1px solid var(--cc-hairline, #ebebeb);
}
.wallet-icon {
  font-family: var(--font-mono, 'Geist Mono'), monospace;
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--cc-muted, #888888);
  width: 1.5rem;
  text-align: center;
}
.wallet-name { flex: 1; color: var(--cc-ink, #171717); font-weight: 500; }
.wallet-type { color: var(--cc-muted, #888888); font-size: 0.75rem; letter-spacing: 0.02em; }
.wallet-badge { padding: 0.125rem 0.5rem; border-radius: 100px; font-size: 0.7rem; font-weight: 500; }
.badge-blue { background: var(--cc-success-bg, rgba(0, 112, 243, 0.1)); color: var(--cc-success, #0070f3); }
.badge-gray { background: var(--cc-canvas-soft-2, #f5f5f5); color: var(--cc-muted, #888888); border: 1px solid var(--cc-hairline, #ebebeb); }
.empty-state { color: var(--cc-muted, #888888); font-size: 0.875rem; }
.state-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 0.75rem; }
.state-item { display: flex; flex-direction: column; gap: 0.25rem; }
.state-label { font-size: 0.75rem; color: var(--cc-muted, #888888); letter-spacing: 0.02em; }
.state-value { color: var(--cc-ink, #171717); font-size: 0.9rem; }
.mono { font-family: var(--font-mono, 'Geist Mono'), monospace; }

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
