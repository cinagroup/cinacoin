<template>
  <div class="send-transaction">
    <h2 class="section-title">Send transaction.</h2>

    <div class="card">
      <h3 class="card-title">ETH transfer.</h3>
      <p class="card-desc">
        Use <code>useSendTransaction</code> to send ETH to another address with gas estimation and status tracking.
      </p>

      <div class="demo-area">
        <!-- Recipient Address -->
        <div class="input-group">
          <label for="recipient" class="input-label">Recipient address.</label>
          <input
            id="recipient"
            v-model="recipient"
            class="text-input mono"
            type="text"
            placeholder="0x..."
            aria-describedby="recipient-help"
          />
          <span id="recipient-help" class="sr-only">Enter the Ethereum address to send ETH to.</span>
        </div>

        <!-- Amount -->
        <div class="input-group">
          <label for="amount" class="input-label">Amount (ETH).</label>
          <div class="amount-row">
            <input
              id="amount"
              v-model.number="amount"
              class="text-input amount-input"
              type="number"
              step="0.001"
              min="0"
              placeholder="0.0"
              aria-describedby="amount-help"
            />
            <button class="btn btn-xs" @click="setMax" aria-label="Set maximum amount">MAX</button>
          </div>
          <span id="amount-help" class="sr-only">Enter the amount of ETH to send.</span>
        </div>

        <!-- Gas Estimation -->
        <div class="input-group" v-if="canEstimate">
          <label class="input-label">Gas estimation.</label>
          <div class="gas-display">
            <button
              class="btn btn-xs"
              @click="estimateGas"
              :disabled="estimating"
              aria-label="Estimate gas fee"
            >
              {{ estimating ? 'Estimating...' : '⛽ Estimate gas.' }}
            </button>
            <span v-if="gasEstimate" class="gas-value">
              ~{{ gasEstimate }} wei
            </span>
          </div>
        </div>

        <!-- Send Button -->
        <div class="action-row">
          <button
            class="btn btn-primary"
            @click="handleSend"
            :disabled="!canSend || isSending"
            aria-label="Send transaction"
          >
            <span v-if="isSending" class="spinner-inline" aria-hidden="true"></span>
            {{ isSending ? 'Sending...' : 'Send transaction.' }}
          </button>
        </div>

        <!-- Error -->
        <div v-if="txError" class="error-box" role="alert">
          <span class="error-icon" aria-hidden="true">✕</span>
          <span>{{ txError.message }}</span>
        </div>

        <!-- Success / Tx Hash -->
        <div v-if="txHash" class="result-box success">
          <div class="result-header">
            <span class="result-label">Transaction sent.</span>
            <span class="tx-status">
              {{ isConfirmed ? '✓ Confirmed.' : '⏳ Pending.' }}
            </span>
          </div>
          <div class="result-value mono break-all">{{ txHash }}</div>
          <div class="tx-actions">
            <a
              v-if="explorerUrl"
              :href="explorerUrl"
              target="_blank"
              rel="noopener noreferrer"
              class="btn btn-xs btn-outline"
              aria-label="View transaction on block explorer"
            >
              🔗 View on explorer ↗
            </a>
            <button class="btn btn-xs btn-outline" @click="copyTxHash" aria-label="Copy transaction hash to clipboard">
              📋 Copy hash.
            </button>
          </div>
        </div>

        <div v-if="status !== 'connected'" class="warning-box" role="status">
          ⚠️ Connect your wallet first to send transactions.
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useCinacoin, useSendTransaction, useBalance } from '@cinacoin/vue'

const { status, account, config } = useCinacoin()
const { sendTransaction, isSending, error: txError, txHash, isConfirmed } = useSendTransaction()
const { balance } = useBalance()

const recipient = ref('')
const amount = ref<number | null>(null)
const estimating = ref(false)
const gasEstimate = ref<string | null>(null)

const canEstimate = computed(
  () => recipient.value.trim().startsWith('0x') && amount.value !== null && amount.value > 0
)

const canSend = computed(
  () => status.value === 'connected' && canEstimate.value
)

const explorerUrl = computed(() => {
  if (!txHash.value) return ''
  const chainId = account.value.chainId
  const chain = config.chains?.find((c: any) => c.id === chainId)
  const baseUrl = chain?.blockExplorerUrl ?? 'https://etherscan.io'
  return `${baseUrl}/tx/${txHash.value}`
})

function setMax() {
  const bal = balance.value
  if (bal && Number(bal) > 0) {
    // Leave some for gas
    amount.value = Math.max(0, Number(bal) - 0.001)
  }
}

async function estimateGas() {
  if (!recipient.value || !amount.value) return
  estimating.value = true
  try {
    // Simple gas estimate: use eth_estimateGas via provider
    const provider = (window as any).ethereum
    if (!provider) {
      gasEstimate.value = 'No provider available.'
      return
    }
    const weiValue = ethersToWei(amount.value)
    const gas = await provider.request({
      method: 'eth_estimateGas',
      params: [{
        from: account.value.address,
        to: recipient.value.trim(),
        value: weiValue,
      }],
    })
    gasEstimate.value = gas as string
  } catch (err) {
    gasEstimate.value = err instanceof Error ? err.message : 'Unknown error.'
  } finally {
    estimating.value = false
  }
}

async function handleSend() {
  if (!canSend.value) return
  try {
    const weiValue = ethersToWei(amount.value!)
    await sendTransaction({
      to: recipient.value.trim(),
      value: weiValue,
    })
  } catch {
    // Error captured in txError ref
  }
}

async function copyTxHash() {
  if (!txHash.value) return
  try {
    await navigator.clipboard.writeText(txHash.value)
  } catch {
    console.warn('Clipboard copy failed')
  }
}

function ethersToWei(eth: number): string {
  // Convert ETH to wei hex string
  const wei = BigInt(Math.round(eth * 1e18))
  return '0x' + wei.toString(16)
}
</script>

<style scoped>
.send-transaction { display: flex; flex-direction: column; gap: 1.25rem; }
.section-title { margin: 0; font-size: 1.5rem; font-weight: 600; color: var(--cc-ink, #f1f5f9); }
.card {
  background: var(--cc-canvas, #1e293b);
  border: 1px solid var(--cc-hairline, #334155);
  border-radius: 0.75rem;
  padding: 1.25rem;
}
.card-title { margin: 0 0 0.25rem; font-size: 1rem; font-weight: 600; color: var(--cc-ink, #e2e8f0); }
.card-desc { margin: 0 0 1rem; font-size: 0.875rem; color: var(--cc-body, #94a3b8); line-height: 1.6; }
.card-desc code { background: var(--cc-canvas-soft-2); padding: 0.125rem 0.375rem; border-radius: 4px; font-size: 0.75rem; color: var(--cc-link, #38bdf8); }
.demo-area { min-height: 40px; }
.input-group { margin-bottom: 0.75rem; }
.input-label { display: block; font-size: 0.75rem; color: var(--cc-body, #94a3b8); margin-bottom: 0.375rem; font-weight: 500; }
.text-input {
  width: 100%; background: var(--cc-canvas-soft-2); border: 1px solid var(--cc-hairline, #334155);
  border-radius: 0.5rem; padding: 0.625rem 0.75rem; color: var(--cc-ink, #e2e8f0);
  font-size: 0.875rem; font-family: inherit;
  box-sizing: border-box;
}
.text-input:focus { outline: none; border-color: var(--cc-link, #3b82f6); box-shadow: 0 0 0 2px rgba(59,130,246,0.2); }
.mono { font-family: 'Geist Mono', 'SF Mono', 'Fira Code', monospace; }
.amount-row { display: flex; gap: 0.5rem; }
.amount-input { flex: 1; }
.btn { padding: 0.5rem 1rem; border-radius: 0.5rem; border: none; font-weight: 600; cursor: pointer; font-size: 0.875rem; transition: all 0.15s; }
.btn-xs { padding: 0.2rem 0.5rem; font-size: 0.75rem; background: var(--cc-hairline, #334155); color: var(--cc-ink, #e2e8f0); border-radius: 0.375rem; }
.btn-xs:hover:not(:disabled) { background: var(--cc-hairline-strong, #475569); }
.btn-xs:disabled { opacity: 0.5; cursor: not-allowed; }
.btn-primary { background: var(--cc-success, #22c55e); color: #fff; }
.btn-primary:hover:not(:disabled) { background: var(--cc-success, #16a34a); }
.btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
.btn-outline { background: transparent; border: 1px solid var(--cc-hairline-strong, #475569); color: var(--cc-ink, #e2e8f0); }
.btn-outline:hover { background: var(--cc-hairline, #334155); }
.gas-display { display: flex; align-items: center; gap: 0.75rem; }
.gas-value { font-size: 0.875rem; color: var(--cc-link, #38bdf8); font-family: 'Geist Mono', monospace; }
.action-row { margin: 1rem 0; }
.error-box {
  display: flex; align-items: center; gap: 0.5rem;
  background: var(--cc-error-soft, #1c1017); border: 1px solid var(--cc-error-deep, #991b1b); border-radius: 0.5rem;
  padding: 0.625rem 0.75rem; color: var(--cc-error, #fca5a5); font-size: 0.875rem; margin-bottom: 1rem;
}
.error-icon { font-size: 1rem; }
.result-box {
  background: var(--cc-canvas-soft-2); border-radius: 0.5rem; padding: 0.75rem; margin-top: 0.5rem;
}
.result-box.success { border: 1px solid var(--cc-success, #166534); }
.result-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.5rem; }
.result-label { font-size: 0.75rem; color: var(--cc-muted, #64748b); font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; }
.result-value { font-size: 0.75rem; color: var(--cc-success, #22c55e); word-break: break-all; line-height: 1.5; }
.tx-status { font-size: 0.75rem; font-weight: 600; }
.tx-actions { display: flex; gap: 0.5rem; margin-top: 0.5rem; }
.tx-actions a { text-decoration: none; }
.warning-box {
  background: var(--cc-warning-soft, #1c1a0e); border: 1px solid var(--cc-warning-deep, #854d0e); border-radius: 0.5rem;
  padding: 0.625rem 0.75rem; color: var(--cc-warning, #fde047); font-size: 0.875rem; margin-top: 1rem;
}
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
  .card {
    padding: 1rem;
  }

  .amount-row {
    flex-direction: column;
  }

  .tx-actions {
    flex-direction: column;
  }

  .tx-actions a,
  .tx-actions button {
    width: 100%;
  }
}
</style>
