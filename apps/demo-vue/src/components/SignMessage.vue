<template>
  <div class="sign-message">
    <h2 class="section-title">Sign message.</h2>

    <div class="card">
      <h3 class="card-title">Message signing demo.</h3>
      <p class="card-desc">
        Use <code>useSignMessage</code> to sign arbitrary messages with your connected wallet.
      </p>

      <div class="demo-area">
        <div class="input-group">
          <label for="message-input" class="input-label">Message to sign.</label>
          <textarea
            id="message-input"
            v-model="message"
            class="text-input"
            placeholder="Enter a message to sign..."
            rows="3"
            aria-describedby="message-help"
          />
          <span id="message-help" class="sr-only">Enter any text message you want to sign with your wallet.</span>
        </div>

        <div class="preset-buttons">
          <span class="preset-label">Presets:</span>
          <button
            v-for="preset in presets"
            :key="preset"
            class="btn btn-xs"
            @click="message = preset"
            :aria-label="`Use preset: ${preset}`"
          >
            {{ preset }}
          </button>
        </div>

        <div class="action-row">
          <button
            class="btn btn-primary"
            @click="handleSign"
            :disabled="!canSign || isSigning"
            aria-label="Sign message with wallet"
          >
            <span v-if="isSigning" class="spinner-inline" aria-hidden="true"></span>
            {{ isSigning ? 'Signing...' : 'Sign message.' }}
          </button>
        </div>

        <!-- Error -->
        <div v-if="signError" class="error-box" role="alert">
          <span class="error-icon" aria-hidden="true">✕</span>
          <span>{{ signError.message }}</span>
        </div>

        <!-- Signature Result -->
        <div v-if="signature" class="result-box">
          <div class="result-header">
            <span class="result-label">Signature</span>
            <button class="btn btn-xs btn-outline" @click="copySignature" aria-label="Copy signature to clipboard">
              Copy
            </button>
          </div>
          <div class="result-value mono break-all">{{ signature }}</div>
          <div class="result-meta">
            <span>Signed by: {{ shortAddress }}</span>
            <span>Length: {{ signature.length }} chars</span>
          </div>
        </div>

        <div v-if="status !== 'connected'" class="warning-box" role="status">
          Connect your wallet first to sign messages.
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
  'Hello, CinaCoin!',
  'I own this wallet.',
  'Sign in to CinaCoin.',
  'Agree to terms of service.',
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
.input-group { margin-bottom: 0.75rem; }
.input-label { display: block; font-size: 0.75rem; color: var(--cc-body, #4d4d4d); margin-bottom: 0.375rem; font-weight: 500; }
.text-input {
  width: 100%; background: var(--cc-canvas-soft-2, #f5f5f5); border: 1px solid var(--cc-hairline, #ebebeb);
  border-radius: 6px; padding: 0.625rem 0.75rem; color: var(--cc-ink, #171717);
  font-size: 0.875rem; font-family: inherit; resize: vertical;
  box-sizing: border-box;
  transition: border-color 0.15s;
}
.text-input:focus { outline: none; border-color: var(--cc-primary, #171717); }
.preset-buttons { display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap; margin-bottom: 1rem; }
.preset-label { font-size: 0.75rem; color: var(--cc-muted, #888888); }
.btn {
  padding: 0.5rem 1rem; border-radius: 100px; border: none; font-weight: 500; cursor: pointer;
  font-size: 0.875rem; font-family: var(--font-geist-sans, 'Geist'), sans-serif;
  transition: opacity 0.15s;
}
.btn:hover:not(:disabled) { opacity: 0.85; }
.btn-xs { padding: 0.2rem 0.5rem; font-size: 0.75rem; background: var(--cc-canvas-soft-2, #f5f5f5); color: var(--cc-ink, #171717); border: 1px solid var(--cc-hairline, #ebebeb); border-radius: 100px; }
.btn-xs:hover { background: var(--cc-canvas-soft, #fafafa); opacity: 1; }
.btn-primary { background: var(--cc-primary, #171717); color: var(--cc-on-primary, #ffffff); }
.btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
.btn-outline { background: transparent; border: 1px solid var(--cc-hairline, #ebebeb); color: var(--cc-ink, #171717); }
.btn-outline:hover { background: var(--cc-canvas-soft-2, #f5f5f5); opacity: 1; }
.action-row { margin-bottom: 1rem; }
.error-box {
  display: flex; align-items: center; gap: 0.5rem;
  background: var(--cc-error-bg, rgba(238, 0, 0, 0.1)); border: 1px solid var(--cc-error, #ee0000); border-radius: 6px;
  padding: 0.625rem 0.75rem; color: var(--cc-error, #ee0000); font-size: 0.875rem; margin-bottom: 1rem;
}
.error-icon { font-size: 1rem; }
.result-box {
  background: var(--cc-canvas-soft-2, #f5f5f5); border: 1px solid var(--cc-hairline, #ebebeb); border-radius: 6px;
  padding: 0.75rem; margin-top: 0.5rem;
}
.result-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.5rem; }
.result-label { font-size: 0.75rem; color: var(--cc-muted, #888888); font-weight: 500; text-transform: uppercase; letter-spacing: 0.02em; }
.result-value { font-size: 0.75rem; color: var(--cc-link, #0070f3); word-break: break-all; line-height: 1.5; }
.result-meta { display: flex; gap: 1rem; margin-top: 0.5rem; font-size: 0.75rem; color: var(--cc-muted, #888888); }
.warning-box {
  background: var(--cc-warning-bg, rgba(245, 166, 35, 0.1)); border: 1px solid var(--cc-warning, #f5a623); border-radius: 6px;
  padding: 0.625rem 0.75rem; color: var(--cc-warning-deep, #ab570a); font-size: 0.875rem; margin-top: 1rem;
}
.mono { font-family: var(--font-mono, 'Geist Mono'), monospace; }
.break-all { word-break: break-all; }
.spinner-inline {
  display: inline-block; width: 12px; height: 12px; border: 2px solid currentColor;
  border-top-color: transparent; border-radius: 50%; animation: spin 0.6s linear infinite;
  vertical-align: middle; margin-right: 0.375rem;
}
@keyframes spin { to { transform: rotate(360deg); } }
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border-width: 0;
}

/* ── Responsive ───────────────────────────────────────────────────── */
@media (max-width: 640px) {
  .card { padding: 1rem; }
  .preset-buttons { flex-direction: column; align-items: flex-start; }
  .result-meta { flex-direction: column; gap: 0.25rem; }
}
</style>
