<template>
  <header class="app-header">
    <div class="header-content">
      <div class="brand">
        <span class="logo">🔢</span>
        <div>
          <h1 class="title">Cinacoin</h1>
          <p class="subtitle">Vue SDK Demo</p>
        </div>
      </div>

      <div class="status-area">
        <span class="status-dot" :class="statusDotClass"></span>
        <span class="status-text">{{ statusLabel }}</span>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useCinacoin } from '@cinacoin/vue'

const { status, account } = useCinacoin()

const statusLabel = computed(() => {
  const labels: Record<string, string> = {
    disconnected: 'Disconnected',
    connecting: 'Connecting...',
    connected: 'Connected',
    error: 'Error',
  }
  return labels[status.value] ?? 'Unknown'
})

const statusDotClass = computed(() => {
  const classes: Record<string, string> = {
    disconnected: 'dot-gray',
    connecting: 'dot-yellow',
    connected: 'dot-green',
    error: 'dot-red',
  }
  return classes[status.value] ?? 'dot-gray'
})
</script>

<style scoped>
.app-header {
  background: linear-gradient(135deg, var(--cc-canvas-soft-2) 0%, var(--cc-canvas) 100%);
  border-bottom: 1px solid var(--cc-hairline, #334155);
  padding: 0.75rem 1.5rem;
  position: sticky;
  top: 0;
  z-index: 100;
}

.header-content {
  max-width: 960px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.brand {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.logo {
  font-size: 2rem;
}

.title {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--cc-ink, #f1f5f9);
  line-height: 1.2;
}

.subtitle {
  margin: 0;
  font-size: 0.75rem;
  color: var(--cc-body, #94a3b8);
  letter-spacing: 0.05em;
}

.status-area {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: rgba(0, 0, 0, 0.2);
  padding: 0.375rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.8rem;
  color: var(--cc-body, #cbd5e1);
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  display: inline-block;
}

.dot-gray { background: var(--cc-muted, #64748b); }
.dot-yellow { background: var(--cc-warning, #eab308); animation: pulse 1.5s infinite; }
.dot-green { background: var(--cc-success, #22c55e); }
.dot-red { background: var(--cc-error, #ef4444); }

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}
</style>
