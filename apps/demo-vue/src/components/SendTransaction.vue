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
              {{ estimating ? 'Estimating...' : 'Estimate gas.' }}
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
              {{ isConfirmed ? '✓ Confirmed.' : 'Pending.' }}
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
              View on explorer ↗
            </a>
            <button class="btn btn-xs btn-outline" @click="copyTxHash" aria-label="Copy transaction hash to clipboard">
              Copy hash.
            </button>
          </div>
        </div>

        <div v-if="status !== 'connected'" class="warning-box" role="status">
          Connect your wallet first to send transactions.
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
  font-size: 0.875rem; font-family: inherit;
  box-sizing: border-box;
  transition: border-color 0.15s;
}
.text-input:focus { outline: none; border-color: var(--cc-primary, #171717); }
.mono { font-family: var(--font-mono, 'Geist Mono'), monospace; }
.amount-row { display: flex; gap: 0.5rem; }
.amount-input { flex: 1; }
.btn {
  padding: 0.5rem 1rem; border-radius: 100px; border: none; font-weight: 500; cursor: pointer;
  font-size: 0.875rem; font-family: var(--font-geist-sans, 'Geist'), sans-serif;
  transition: opacity 0.15s;
}
.btn:hover:not(:disabled) { opacity: 0.85; }
.btn-xs { padding: 0.2rem 0.5rem; font-size: 0.75rem; background: var(--cc-canvas-soft-2, #f5f5f5); color: var(--cc-ink, #171717); border: 1px solid var(--cc-hairline, #ebebeb); border-radius: 100px; }
.btn-xs:hover:not(:disabled) { background: var(--cc-canvas-soft, #fafafa); opacity: 1; }
.btn-xs:disabled { opacity: 0.5; cursor: not-allowed; }
.btn-primary { background: var(--cc-primary, #171717); color: var(--cc-on-primary, #ffffff); }
.btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
.btn-outline { background: transparent; border: 1px solid var(--cc-hairline, #ebebeb); color: var(--cc-ink, #171717); border-radius: 100px; }
.btn-outline:hover { background: var(--cc-canvas-soft-2, #f5f5f5); opacity: 1; }
.gas-display { display: flex; align-items: center; gap: 0.75rem; }
.gas-value { font-size: 0.875rem; color: var(--cc-link, #0070f3); font-family: var(--font-mono, 'Geist Mono'), monospace; }
.action-row { margin: 1rem 0; }
.error-box {
  display: flex; align-items: center; gap: 0.5rem;
  background: var(--cc-error-bg, rgba(238, 0, 0, 0.1)); border: 1px solid var(--cc-error, #ee0000); border-radius: 6px;
  padding: 0.625rem 0.75rem; color: var(--cc-error, #ee0000); font-size: 0.875rem; margin-bottom: 1rem;
}
.error-icon { font-size: 1rem; }
.result-box {
  background: var(--cc-canvas-soft-2, #f5f5f5); border-radius: 6px; padding: 0.75rem; margin-top: 0.5rem;
}
.result-box.success { border: 1px solid var(--cc-success, #0070f3); }
.result-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.5rem; }
.result-label { font-size: 0.75rem; color: var(--cc-muted, #888888); font-weight: 500; text-transform: uppercase; letter-spacing: 0.02em; }
.result-value { font-size: 0.75rem; color: var(--cc-success, #0070f3); word-break: break-all; line-height: 1.5; }
.tx-status { font-size: 0.75rem; font-weight: 600; }
.tx-actions { display: flex; gap: 0.5rem; margin-top: 0.5rem; }
.tx-actions a { text-decoration: none; }
.warning-box {
  background: var(--cc-warning-bg, rgba(245, 166, 35, 0.1)); border: 1px solid var(--cc-warning, #f5a623); border-radius: 6px;
  padding: 0.625rem 0.75rem; color: var(--cc-warning-deep, #ab570a); font-size: 0.875rem; margin-top: 1rem;
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
  .card { padding: 1rem; }
  .amount-row { flex-direction: column; }
  .tx-actions { flex-direction: column; }
  .tx-actions a,
  .tx-actions button { width: 100%; }
}
</style>
