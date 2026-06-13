<template>
  <header class="app-header" role="banner">
    <div class="header-content">
      <div class="brand">
        <span class="brand-mark" aria-hidden="true">000</span>
        <div>
          <h1 class="title">CinaCoin.</h1>
          <p class="subtitle">Vue SDK demo.</p>
        </div>
      </div>

      <div class="status-area" role="status" :aria-label="`Connection status: ${statusLabel}`">
        <span class="status-dot" :class="statusDotClass" aria-hidden="true"></span>
        <span class="status-text">{{ statusLabel }}</span>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useCinacoin } from '@cinacoin/vue'

const { status } = useCinacoin()

const statusLabel = computed(() => {
  const labels: Record<string, string> = {
    disconnected: 'Disconnected.',
    connecting: 'Connecting...',
    connected: 'Connected.',
    error: 'Error.',
  }
  return labels[status.value] ?? 'Unknown.'
})

const statusDotClass = computed(() => {
  const classes: Record<string, string> = {
    disconnected: 'dot-gray',
    connecting: 'dot-yellow',
    connected: 'dot-blue',
    error: 'dot-red',
  }
  return classes[status.value] ?? 'dot-gray'
})
</script>

<style scoped>
.app-header {
  background: var(--cc-canvas, #000000);
  border-bottom: 1px solid var(--cc-hairline, rgba(255, 255, 255, 0.08));
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

.brand-mark {
  font-family: var(--font-mono, 'Geist Mono'), monospace;
  font-size: 0.75rem;
  font-weight: 500;
  color: var(--cc-muted, #737373);
  letter-spacing: 0.05em;
  padding: 0.25rem 0.5rem;
  border: 1px solid var(--cc-hairline, rgba(255, 255, 255, 0.08));
  border-radius: 4px;
}

.title {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--cc-ink, #ededed);
  line-height: 1.2;
  letter-spacing: -0.5px;
}

.subtitle {
  margin: 0;
  font-size: 0.75rem;
  color: var(--cc-muted, #737373);
  letter-spacing: 0.02em;
}

.status-area {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: var(--cc-canvas-soft-2, #111111);
  padding: 0.375rem 0.75rem;
  border-radius: 4px;
  font-size: 0.875rem;
  color: var(--cc-body, #a3a3a3);
  border: 1px solid var(--cc-hairline, rgba(255, 255, 255, 0.08));
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  display: inline-block;
}

.dot-gray { background: var(--cc-muted, #737373); }
.dot-yellow { background: var(--cc-warning, #f5a623); animation: pulse 1.5s infinite; }
.dot-blue { background: var(--cc-success, #22c55e); }
.dot-red { background: var(--cc-error, #ef4444); }

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}

/* ── Responsive ───────────────────────────────────────────────────── */
@media (max-width: 640px) {
  .app-header {
    padding: 0.75rem 1rem;
  }

  .header-content {
    gap: 0.75rem;
  }

  .title {
    font-size: 1.125rem;
  }

  .subtitle {
    font-size: 0.6875rem;
  }

  .status-area {
    font-size: 0.75rem;
    padding: 0.25rem 0.5rem;
  }
}
</style>
