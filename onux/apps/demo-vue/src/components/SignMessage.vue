<template>
  <div class="sign-message">
    <h2 class="section-title">Sign Message</h2>

    <div class="card">
      <h3 class="card-title">Message Signing Demo</h3>
      <p class="card-desc">
        Use <code>useSignMessage</code> to sign arbitrary messages with your connected wallet.
      </p>

      <div class="demo-area">
        <div class="input-group">
          <label for="message-input" class="input-label">Message to Sign</label>
          <textarea
            id="message-input"
            v-model="message"
            class="text-input"
            placeholder="Enter a message to sign..."
            rows="3"
          />
        </div>

        <div class="preset-buttons">
          <span class="preset-label">Presets:</span>
          <button
            v-for="preset in presets"
            :key="preset"
            class="btn btn-xs"
            @click="message = preset"
          >
            {{ preset }}
          </button>
        </div>

        <div class="action-row">
          <button
            class="btn btn-primary"
            @click="handleSign"
            :disabled="!canSign || isSigning"
          >
            <span v-if="isSigning" class="spinner-inline"></span>
            {{ isSigning ? 'Signing...' : 'Sign Message' }}
          </button>
        </div>

        <!-- Error -->
        <div v-if="signError" class="error-box">
          <span class="error-icon">✕</span>
          <span>{{ signError.message }}</span>
        </div>

        <!-- Signature Result -->
        <div v-if="signature" class="result-box">
          <div class="result-header">
            <span class="result-label">Signature</span>
            <button class="btn btn-xs btn-outline" @click="copySignature">
              📋 Copy
            </button>
          </div>
          <div class="result-value mono break-all">{{ signature }}</div>
          <div class="result-meta">
            <span>Signed by: {{ shortAddress }}</span>
            <span>Length: {{ signature.length }} chars</span>
          </div>
        </div>

        <div v-if="status !== 'connected'" class="warning-box">
          ⚠️ Connect your wallet first to sign messages.
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useCinacoin, useSignMessage } from '@cinacoin/vue'

const { status, account } = useCinacoin()
const { signMessage, isSigning, error: signError, signature } = useSignMessage()

const message = ref('')

const presets = [
  'Hello, Cinacoin!',
  'I own this wallet',
  'Sign in to Cinacoin',
  'Agree to terms of service',
]

const shortAddress = computed(() => {
  const addr = account.value.address
  return addr ? `${addr.slice(0, 6)}…${addr.slice(-4)}` : ''
})

const canSign = computed(() => status.value === 'connected' && message.value.trim().length > 0)

async function handleSign() {
  if (!canSign.value) return
  try {
    await signMessage(message.value.trim())
  } catch {
    // Error captured in signError ref
  }
}

async function copySignature() {
  if (!signature.value) return
  try {
    await navigator.clipboard.writeText(signature.value)
  } catch {
    console.warn('Clipboard copy failed')
  }
}
</script>

<style scoped>
.sign-message { display: flex; flex-direction: column; gap: 1.25rem; }
.section-title { margin: 0; font-size: 1.5rem; font-weight: 600; color: var(--cc-ink, #f1f5f9); }
.card {
  background: var(--cc-canvas, #1e293b);
  border: 1px solid var(--cc-hairline, #334155);
  border-radius: 0.75rem;
  padding: 1.25rem;
}
.card-title { margin: 0 0 0.25rem; font-size: 1rem; font-weight: 600; color: var(--cc-ink, #e2e8f0); }
.card-desc { margin: 0 0 1rem; font-size: 0.85rem; color: var(--cc-body, #94a3b8); }
.card-desc code { background: var(--cc-canvas-soft-2); padding: 0.125rem 0.375rem; border-radius: 4px; font-size: 0.8rem; color: var(--cc-link, #38bdf8); }
.demo-area { min-height: 40px; }
.input-group { margin-bottom: 0.75rem; }
.input-label { display: block; font-size: 0.8rem; color: var(--cc-body, #94a3b8); margin-bottom: 0.375rem; font-weight: 500; }
.text-input {
  width: 100%; background: var(--cc-canvas-soft-2); border: 1px solid var(--cc-hairline, #334155);
  border-radius: 0.5rem; padding: 0.625rem 0.75rem; color: var(--cc-ink, #e2e8f0);
  font-size: 0.9rem; font-family: inherit; resize: vertical;
  box-sizing: border-box;
}
.text-input:focus { outline: none; border-color: var(--cc-link, #3b82f6); box-shadow: 0 0 0 2px rgba(59,130,246,0.2); }
.preset-buttons { display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap; margin-bottom: 1rem; }
.preset-label { font-size: 0.8rem; color: var(--cc-muted, #64748b); }
.btn { padding: 0.5rem 1rem; border-radius: 0.5rem; border: none; font-weight: 600; cursor: pointer; font-size: 0.875rem; transition: all 0.15s; }
.btn-xs { padding: 0.2rem 0.5rem; font-size: 0.75rem; background: var(--cc-hairline, #334155); color: var(--cc-ink, #e2e8f0); border-radius: 0.375rem; }
.btn-xs:hover { background: var(--cc-hairline-strong, #475569); }
.btn-primary { background: var(--cc-link, #3b82f6); color: #fff; }
.btn-primary:hover:not(:disabled) { background: var(--cc-link-deep, #2563eb); }
.btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
.btn-outline { background: transparent; border: 1px solid var(--cc-hairline-strong, #475569); }
.btn-outline:hover { background: var(--cc-hairline, #334155); }
.action-row { margin-bottom: 1rem; }
.error-box {
  display: flex; align-items: center; gap: 0.5rem;
  background: var(--cc-error-soft, #1c1017); border: 1px solid var(--cc-error-deep, #991b1b); border-radius: 0.5rem;
  padding: 0.625rem 0.75rem; color: var(--cc-error, #fca5a5); font-size: 0.85rem; margin-bottom: 1rem;
}
.error-icon { font-size: 1rem; }
.result-box {
  background: var(--cc-canvas-soft-2); border: 1px solid var(--cc-hairline, #334155); border-radius: 0.5rem;
  padding: 0.75rem; margin-top: 0.5rem;
}
.result-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.5rem; }
.result-label { font-size: 0.8rem; color: var(--cc-muted, #64748b); font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; }
.result-value { font-size: 0.8rem; color: var(--cc-link, #38bdf8); word-break: break-all; line-height: 1.5; }
.result-meta { display: flex; gap: 1rem; margin-top: 0.5rem; font-size: 0.75rem; color: var(--cc-muted, #64748b); }
.warning-box {
  background: var(--cc-warning-soft, #1c1a0e); border: 1px solid var(--cc-warning-deep, #854d0e); border-radius: 0.5rem;
  padding: 0.625rem 0.75rem; color: var(--cc-warning, #fde047); font-size: 0.85rem; margin-top: 1rem;
}
.mono { font-family: 'SF Mono', 'Fira Code', monospace; }
.break-all { word-break: break-all; }
.spinner-inline {
  display: inline-block; width: 12px; height: 12px; border: 2px solid currentColor;
  border-top-color: transparent; border-radius: 50%; animation: spin 0.6s linear infinite;
  vertical-align: middle; margin-right: 0.375rem;
}
@keyframes spin { to { transform: rotate(360deg); } }
</style>
