<template>
  <div class="app-shell">
    <AppHeader />

    <main id="main-content" class="main-content" role="main">
      <div class="container">
        <!-- Wallet Connection (always visible) -->
        <ConnectWallet />

        <!-- Connected-only features -->
        <ConnectedFeatures />

        <div v-if="!isConnected" class="connect-prompt">
          <div class="prompt-card">
            <div class="prompt-icon-wrapper" aria-hidden="true">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
              </svg>
            </div>
            <h2>Connect your wallet.</h2>
            <p>Connect a wallet above to explore balance, chain info, signing, and transactions.</p>
          </div>
        </div>
      </div>
    </main>

    <footer class="app-footer" role="contentinfo">
      <div class="container">
        <p>Built with <code>@cinacoin/appkit-config</code> — Vue 3 + Vite + TypeScript.</p>
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useCinacoinWallet } from '@cinacoin/appkit-config/vue'
import AppHeader from './components/AppHeader.vue'
import ConnectWallet from './components/ConnectWallet.vue'
import ConnectedFeatures from './components/ConnectedFeatures.vue'

// ── Connection state ───────────────────────────────────────────────────
const { status } = useCinacoinWallet()
const isConnected = computed(() => status.value === 'connected')
</script>

<style>
/* ── Global Reset & Base ──────────────────────────────────────────── */
*, *::before, *::after { box-sizing: border-box; }

html {
  font-family: var(--font-geist-sans), Geist, system-ui, -apple-system, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

body {
  margin: 0;
  background: var(--cc-canvas, #000000);
  color: var(--cc-ink, #ededed);
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
  font-size: 0.875rem;
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
  background: var(--cc-canvas-soft, #141414);
  border: 1px dashed var(--cc-hairline, rgba(255, 255, 255, 0.08));
  border-radius: 4px;
  padding: 2.5rem;
  text-align: center;
  max-width: 480px;
}

.prompt-icon-wrapper { display: flex; justify-content: center; margin-bottom: 1rem; color: var(--cc-link, #0070f3); }

.prompt-card h2 {
  margin: 0 0 0.5rem;
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--cc-ink, #e2e8f0);
}

.prompt-card p {
  margin: 0;
  font-size: 0.875rem;
  color: var(--cc-body, #94a3b8);
  line-height: 1.6;
}

/* ── Responsive ───────────────────────────────────────────────────── */
@media (max-width: 640px) {
  .main-content {
    padding: 1rem 0.75rem;
  }

  .container {
    gap: 1.5rem;
  }

  .prompt-card {
    padding: 1.5rem;
  }
}
</style>
