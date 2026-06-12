<template>
  <div class="chain-info">
    <h2 class="section-title">Chain information.</h2>

    <!-- Current Chain Display -->
    <div class="card">
      <h3 class="card-title">Current chain.</h3>
      <div class="demo-area">
        <div class="chain-display" v-if="currentChain">
          <div class="chain-icon">
            <img
              v-if="currentChain.iconUrl"
              :src="currentChain.iconUrl"
              :alt="currentChain.name"
              class="chain-logo"
            />
            <span v-else class="chain-placeholder" aria-hidden="true">CH</span>
          </div>
          <div class="chain-details">
            <div class="chain-name">{{ currentChain.name }}</div>
            <div class="chain-id">Chain ID: {{ currentChain.id }}</div>
            <div class="chain-currency">
              Currency: {{ currentChain.nativeCurrency.symbol }}
              <span class="currency-full">
                ({{ currentChain.nativeCurrency.name }})
              </span>
            </div>
            <div
              v-if="currentChain.testnet"
              class="badge badge-warning"
              role="status"
            >
              Testnet
            </div>
          </div>
        </div>
        <div v-else class="empty-state" role="status">
          {{ status === 'connected' ? 'Chain info not available.' : 'Connect wallet to see chain info.' }}
        </div>
      </div>
    </div>

    <!-- ChainSwitcher -->
    <div class="card">
      <h3 class="card-title">Switch chain.</h3>
      <p class="card-desc">
        Use <code>OcxChainSwitcher</code> or manually switch via available chains.
      </p>
      <div class="demo-area">
        <div class="switcher-area">
          <OcxChainSwitcher @chain-change="onChainChange" aria-label="Switch blockchain network" />
        </div>
        <div class="chain-list" v-if="configChains.length > 0">
          <h4 class="sub-title">Available chains.</h4>
          <ul class="chain-items" role="list">
            <li
              v-for="chain in configChains"
              :key="chain.id"
              class="chain-item"
              :class="{ active: chain.id === chainId }"
              @click="handleSwitchChain(chain.id)"
              @keydown.enter="handleSwitchChain(chain.id)"
              @keydown.space.prevent="handleSwitchChain(chain.id)"
              :tabindex="0"
              role="button"
              :aria-label="`Switch to ${chain.name}`"
              :aria-pressed="chain.id === chainId"
            >
              <span class="chain-item-name">{{ chain.name }}</span>
              <span class="chain-item-id">#{{ chain.id }}</span>
              <span
                class="chain-item-check"
                v-if="chain.id === chainId"
                aria-hidden="true"
              >✓</span>
            </li>
          </ul>
        </div>
        <div v-if="isSwitchingChain" class="switching-indicator" role="status">
          <span class="spinner" aria-hidden="true"></span> Switching chain...
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useCinacoin, OcxChainSwitcher, type ChainConfig } from '@cinacoin/vue'

const { account, config, switchChain, isSwitchingChain, status } = useCinacoin()

const chainId = computed(() => account.value.chainId)

const configChains = computed(() => config.chains ?? [])

const currentChain = computed<ChainConfig | null>(() => {
  const id = account.value.chainId
  if (!id) return null
  return configChains.value.find((c: ChainConfig) => c.id === id) ?? null
})

function onChainChange(chainId: number) {
  console.log('Chain change requested:', chainId)
}

async function handleSwitchChain(chainId: number) {
  try {
    await switchChain(chainId)
  } catch (err) {
    console.error('Chain switch failed:', err)
  }
}
</script>

<style scoped>
.chain-info { display: flex; flex-direction: column; gap: 1.25rem; }
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
.chain-display { display: flex; align-items: center; gap: 1rem; }
.chain-icon { width: 48px; height: 48px; display: flex; align-items: center; justify-content: center; }
.chain-logo { width: 48px; height: 48px; border-radius: 50%; }
.chain-placeholder {
  font-family: var(--font-mono, 'Geist Mono'), monospace;
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--cc-muted, #888888);
  background: var(--cc-canvas-soft-2, #f5f5f5);
  border: 1px solid var(--cc-hairline, #ebebeb);
  border-radius: 50%;
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.chain-details { display: flex; flex-direction: column; gap: 0.25rem; }
.chain-name { font-size: 1.125rem; font-weight: 600; color: var(--cc-ink, #171717); }
.chain-id { font-family: var(--font-mono, 'Geist Mono'), monospace; font-size: 0.875rem; color: var(--cc-body, #4d4d4d); }
.chain-currency { font-size: 0.875rem; color: var(--cc-body, #4d4d4d); }
.currency-full { color: var(--cc-muted, #888888); }
.badge { padding: 0.125rem 0.5rem; border-radius: 100px; font-size: 0.7rem; font-weight: 500; display: inline-block; }
.badge-warning { background: var(--cc-warning-bg, rgba(245, 166, 35, 0.1)); color: var(--cc-warning, #f5a623); }
.empty-state { color: var(--cc-muted, #888888); font-size: 0.875rem; }
.switcher-area { margin-bottom: 1rem; }
.sub-title { margin: 0.75rem 0 0.5rem; font-size: 0.875rem; font-weight: 600; color: var(--cc-body, #4d4d4d); text-transform: uppercase; letter-spacing: 0.02em; }
.chain-list { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 0.375rem; }
.chain-items { list-style: none; padding: 0; margin: 0; }
.chain-item {
  display: flex; align-items: center; gap: 0.75rem;
  padding: 0.5rem 0.75rem; border-radius: 6px;
  background: var(--cc-canvas-soft-2, #f5f5f5); cursor: pointer; transition: background 0.15s;
  border: 1px solid var(--cc-hairline, #ebebeb);
}
.chain-item:hover { background: var(--cc-canvas-soft, #fafafa); border-color: var(--cc-hairline-strong, #a1a1a1); }
.chain-item:focus-visible { outline: 2px solid var(--cc-link, #0070f3); outline-offset: 2px; }
.chain-item.active { background: var(--cc-link-bg-soft, #d3e5ff); border-color: var(--cc-link, #0070f3); }
.chain-item-name { flex: 1; color: var(--cc-ink, #171717); font-weight: 500; }
.chain-item-id { color: var(--cc-muted, #888888); font-family: var(--font-mono, 'Geist Mono'), monospace; font-size: 0.75rem; }
.chain-item-check { color: var(--cc-success, #0070f3); font-weight: 600; }
.switching-indicator { margin-top: 0.75rem; color: var(--cc-link, #0070f3); font-size: 0.875rem; display: flex; align-items: center; gap: 0.5rem; }
.spinner {
  width: 14px; height: 14px; border: 2px solid var(--cc-link, #0070f3);
  border-top-color: transparent; border-radius: 50%;
  animation: spin 0.8s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

/* ── Responsive ───────────────────────────────────────────────────── */
@media (max-width: 640px) {
  .card { padding: 1rem; }
  .chain-display { flex-direction: column; align-items: flex-start; }
  .chain-icon { width: 40px; height: 40px; }
  .chain-logo { width: 40px; height: 40px; }
}
</style>
