<template>
  <div class="chain-info">
    <h2 class="section-title">Chain Information</h2>

    <!-- Current Chain Display -->
    <div class="card">
      <h3 class="card-title">Current Chain</h3>
      <div class="demo-area">
        <div class="chain-display" v-if="currentChain">
          <div class="chain-icon">
            <img
              v-if="currentChain.iconUrl"
              :src="currentChain.iconUrl"
              :alt="currentChain.name"
              class="chain-logo"
            />
            <span v-else class="chain-emoji">⛓️</span>
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
              class="badge badge-yellow"
            >
              Testnet
            </div>
          </div>
        </div>
        <div v-else class="empty-state">
          {{ status === 'connected' ? 'Chain info not available' : 'Connect wallet to see chain info' }}
        </div>
      </div>
    </div>

    <!-- ChainSwitcher -->
    <div class="card">
      <h3 class="card-title">Switch Chain</h3>
      <p class="card-desc">
        Use <code>OcxChainSwitcher</code> or manually switch via available chains.
      </p>
      <div class="demo-area">
        <div class="switcher-area">
          <OcxChainSwitcher @chain-change="onChainChange" />
        </div>
        <div class="chain-list" v-if="configChains.length > 0">
          <h4 class="sub-title">Available Chains:</h4>
          <ul class="chain-items">
            <li
              v-for="chain in configChains"
              :key="chain.id"
              class="chain-item"
              :class="{ active: chain.id === chainId }"
              @click="handleSwitchChain(chain.id)"
            >
              <span class="chain-item-name">{{ chain.name }}</span>
              <span class="chain-item-id">#{{ chain.id }}</span>
              <span
                class="chain-item-active"
                v-if="chain.id === chainId"
              >✓</span>
            </li>
          </ul>
        </div>
        <div v-if="isSwitchingChain" class="switching-indicator">
          <span class="spinner"></span> Switching chain...
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
  return configChains.value.find((c) => c.id === id) ?? null
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
.section-title { margin: 0; font-size: 1.5rem; font-weight: 700; color: #f1f5f9; }
.card {
  background: #1e293b;
  border: 1px solid #334155;
  border-radius: 0.75rem;
  padding: 1.25rem;
}
.card-title { margin: 0 0 0.25rem; font-size: 1rem; font-weight: 600; color: #e2e8f0; }
.card-desc { margin: 0 0 1rem; font-size: 0.85rem; color: #94a3b8; }
.card-desc code { background: #0f172a; padding: 0.125rem 0.375rem; border-radius: 4px; font-size: 0.8rem; color: #38bdf8; }
.demo-area { min-height: 40px; }
.chain-display { display: flex; align-items: center; gap: 1rem; }
.chain-icon { font-size: 2.5rem; }
.chain-logo { width: 48px; height: 48px; border-radius: 50%; }
.chain-details { display: flex; flex-direction: column; gap: 0.25rem; }
.chain-name { font-size: 1.125rem; font-weight: 600; color: #f1f5f9; }
.chain-id { font-family: 'SF Mono', monospace; font-size: 0.85rem; color: #94a3b8; }
.chain-currency { font-size: 0.85rem; color: #94a3b8; }
.currency-full { color: #64748b; }
.badge { padding: 0.125rem 0.5rem; border-radius: 999px; font-size: 0.7rem; font-weight: 600; display: inline-block; }
.badge-yellow { background: #422006; color: #facc15; }
.empty-state { color: #64748b; font-style: italic; font-size: 0.875rem; }
.switcher-area { margin-bottom: 1rem; }
.sub-title { margin: 0.75rem 0 0.5rem; font-size: 0.875rem; font-weight: 600; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.05em; }
.chain-list { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 0.375rem; }
.chain-items { list-style: none; padding: 0; margin: 0; }
.chain-item {
  display: flex; align-items: center; gap: 0.75rem;
  padding: 0.5rem 0.75rem; border-radius: 0.5rem;
  background: #0f172a; cursor: pointer; transition: background 0.15s;
}
.chain-item:hover { background: #1e3a5f; }
.chain-item.active { background: #1e3a5f; border: 1px solid #3b82f6; }
.chain-item-name { flex: 1; color: #e2e8f0; font-weight: 500; }
.chain-item-id { color: #64748b; font-family: 'SF Mono', monospace; font-size: 0.8rem; }
.chain-item-active { color: #22c55e; font-weight: 700; }
.switching-indicator { margin-top: 0.75rem; color: #38bdf8; font-size: 0.875rem; display: flex; align-items: center; gap: 0.5rem; }
.spinner {
  width: 14px; height: 14px; border: 2px solid #38bdf8;
  border-top-color: transparent; border-radius: 50%;
  animation: spin 0.8s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }
</style>
