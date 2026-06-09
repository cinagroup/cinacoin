<template>
  <CinaCoinProvider
    :config="cinacoinConfig"
    :chains="chains"
  >
    <div class="app-shell">
      <AppHeader />

      <main class="main-content">
        <div class="container">
          <!-- Wallet Connection (always visible) -->
          <ConnectWallet />

          <!-- Connected-only features -->
          <ConnectedFeatures />

          <div v-if="!isConnected" class="connect-prompt">
            <div class="prompt-card">
              <span class="prompt-icon">🔗</span>
              <h2>Connect Your Wallet</h2>
              <p>Connect a wallet above to explore balance, chain info, signing, and transactions.</p>
            </div>
          </div>
        </div>
      </main>

      <footer class="app-footer">
        <div class="container">
          <p>Built with <code>@cinacoin/vue</code> — Vue 3 + Vite + TypeScript</p>
        </div>
      </footer>
    </div>
  </CinaCoinProvider>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { CinaCoinProvider, type CinacoinConfig, type ChainConfig, useCinacoin } from '@cinacoin/vue'
import AppHeader from './components/AppHeader.vue'
import ConnectWallet from './components/ConnectWallet.vue'
import ConnectedFeatures from './components/ConnectedFeatures.vue'

// ── Chain Configuration ──────────────────────────────────────────────────
const chains: ChainConfig[] = [
  {
    id: 1,
    name: 'Ethereum Mainnet',
    rpcUrl: 'https://eth.llamarpc.com',
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    blockExplorerUrl: 'https://etherscan.io',
    iconUrl: 'https://icons.llamao.fi/icons/chains/rsz_ethereum.jpg',
  },
  {
    id: 11155111,
    name: 'Sepolia',
    rpcUrl: 'https://rpc.sepolia.org',
    nativeCurrency: { name: 'Sepolia Ether', symbol: 'ETH', decimals: 18 },
    blockExplorerUrl: 'https://sepolia.etherscan.io',
    testnet: true,
  },
]

// ── Cinacoin Configuration ───────────────────────────────────────────────
const projectId = import.meta.env.VITE_PROJECT_ID ?? ''

const cinacoinConfig: CinacoinConfig = {
  projectId,
  metadata: {
    name: 'Cinacoin Vue SDK Demo',
    description: 'A comprehensive demo showcasing the Cinacoin Vue 3 SDK',
    url: 'https://cinacoin.dev',
  },
  theme: {
    mode: 'dark',
  },
}

// ── Connection state (inside provider context) ───────────────────────────
const { status } = useCinacoin()
const isConnected = computed(() => status.value === 'connected')
</script>

<style>
/* ── Global Reset & Base ──────────────────────────────────────────── */
*, *::before, *::after { box-sizing: border-box; }

html {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

body {
  margin: 0;
  background: var(--cc-canvas-soft-2);
  color: var(--cc-ink, #e2e8f0);
  min-height: 100vh;
}

/* ── Layout ───────────────────────────────────────────────────────── */
.app-shell {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.main-content {
  flex: 1;
  padding: 2rem 1rem;
}

.container {
  max-width: 960px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

/* ── Footer ───────────────────────────────────────────────────────── */
.app-footer {
  border-top: 1px solid var(--cc-canvas, #1e293b);
  padding: 1.5rem 1rem;
  text-align: center;
}

.app-footer p {
  margin: 0;
  font-size: 0.8rem;
  color: var(--cc-hairline-strong, #475569);
}

.app-footer code {
  background: var(--cc-canvas, #1e293b);
  padding: 0.125rem 0.375rem;
  border-radius: 4px;
  font-size: 0.75rem;
  color: var(--cc-link, #38bdf8);
}

/* ── Connect Prompt ───────────────────────────────────────────────── */
.connect-prompt {
  display: flex;
  justify-content: center;
}

.prompt-card {
  background: var(--cc-canvas, #1e293b);
  border: 1px dashed var(--cc-hairline, #334155);
  border-radius: 0.75rem;
  padding: 2.5rem;
  text-align: center;
  max-width: 480px;
}

.prompt-icon { font-size: 3rem; display: block; margin-bottom: 1rem; }

.prompt-card h2 {
  margin: 0 0 0.5rem;
  font-size: 1.25rem;
  color: var(--cc-ink, #e2e8f0);
}

.prompt-card p {
  margin: 0;
  font-size: 0.9rem;
  color: var(--cc-body, #94a3b8);
  line-height: 1.5;
}
</style>
