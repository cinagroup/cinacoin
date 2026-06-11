/**
 * TransferPage — Token transfer demo
 *
 * Select chain → Select token → Enter address/amount → Confirm → Send
 */

import { useState, useCallback } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { CodeExample } from '../components/CodeExample';

const CHAINS = [
  { id: 'eip155:1', name: 'Ethereum', icon: '⟠', tokens: ['ETH', 'USDC', 'USDT'] },
  { id: 'eip155:137', name: 'Polygon', icon: '⬡', tokens: ['MATIC', 'USDC', 'USDT'] },
  { id: 'eip155:56', name: 'BSC', icon: '◆', tokens: ['BNB', 'BUSD', 'USDT'] },
  { id: 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp', name: 'Solana', icon: '◎', tokens: ['SOL', 'USDC'] },
];

const CODE_EXAMPLE = `import { useCoinTransaction, useCoinAccount } from '@cinacoin/core-sdk';

function TransferForm() {
  const { account } = useCoinAccount();
  const { sendTransaction, isPending, txHash } = useCoinTransaction();

  const handleTransfer = async (to: string, amount: string) => {
    const result = await sendTransaction({
      to,
      value: amount,
      chainId: 'eip155:1',
    });
  };

  return (
    <form onSubmit={(e) => {
      e.preventDefault();
      const formData = new FormData(e.target);
      handleTransfer(
        formData.get('to') as string,
        formData.get('amount') as string
      );
    }}>
      <input name="to" placeholder="Recipient address" />
      <input name="amount" type="number" step="0.001" placeholder="Amount" />
      <button disabled={isPending}>
        {isPending ? 'Sending...' : 'Send'}
      </button>
      {txHash && <p>TX: {txHash.slice(0, 10)}...</p>}
    </form>
  );
}`;

interface TransferState {
  step: 'input' | 'confirm' | 'sending' | 'success';
  chain: string;
  token: string;
  to: string;
  amount: string;
  txHash: string;
}

export function TransferPage() {
  const [state, setState] = useState<TransferState>({
    step: 'input',
    chain: CHAINS[0].id,
    token: CHAINS[0].tokens[0],
    to: '',
    amount: '',
    txHash: '',
  });

  const selectedChain = CHAINS.find((c) => c.id === state.chain) || CHAINS[0];

  const handleConfirm = useCallback(() => {
    if (!state.to || !state.amount) return;
    setState((s) => ({ ...s, step: 'confirm' }));
  }, [state.to, state.amount]);

  const handleSend = useCallback(() => {
    setState((s) => ({ ...s, step: 'sending' }));
    // Simulate transaction
    setTimeout(() => {
      const hash = '0x' + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
      setState((s) => ({ ...s, step: 'success', txHash: hash }));
    }, 2000);
  }, []);

  const handleReset = useCallback(() => {
    setState({ step: 'input', chain: CHAINS[0].id, token: CHAINS[0].tokens[0], to: '', amount: '', txHash: '' });
  }, []);

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Left: Interactive Demo */}
      <div>
        <p className="cc-caption-mono text-[var(--cc-muted)] mb-2">TRANSFER</p>
        <h2 className="cc-display-lg mb-2">Token transfer.</h2>
        <p className="cc-body-md text-[var(--cc-muted)] mb-6">Select chain and token, enter recipient address and amount, complete transfer.</p>

        <div className="cc-card">
          {state.step === 'input' && (
            <div className="flex flex-col gap-4">
              {/* Chain selector */}
              <div>
                <label className="cc-caption-mono text-[var(--cc-muted)] mb-2 block">Select chain</label>
                <div className="flex gap-2 flex-wrap">
                  {CHAINS.map((chain) => (
                    <button
                      key={chain.id}
                      onClick={() => setState((s) => ({ ...s, chain: chain.id, token: chain.tokens[0] }))}
                      className={`px-3 py-2 rounded-lg text-caption font-medium transition-all focus-ring ${
                        state.chain === chain.id
                          ? 'bg-[var(--cc-canvas-soft-2)] border-2 border-[var(--cc-link)]'
                          : 'bg-[var(--cc-canvas-soft)] border border-[var(--cc-hairline)] hover:border-[var(--cc-muted)]'
                      }`}
                    >
                      <span className="mr-1">{chain.icon}</span> {chain.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Token selector */}
              <div>
                <label className="cc-caption-mono text-[var(--cc-muted)] mb-2 block">Select token</label>
                <div className="flex gap-2">
                  {selectedChain.tokens.map((token) => (
                    <button
                      key={token}
                      onClick={() => setState((s) => ({ ...s, token }))}
                      className={`px-3 py-2 rounded-lg text-caption font-medium transition-all focus-ring ${
                        state.token === token
                          ? 'bg-[var(--cc-canvas-soft-2)] border-2 border-[var(--cc-link)]'
                          : 'bg-[var(--cc-canvas-soft)] border border-[var(--cc-hairline)] hover:border-[var(--cc-muted)]'
                      }`}
                    >
                      {token}
                    </button>
                  ))}
                </div>
              </div>

              {/* Recipient */}
              <div>
                <label className="cc-caption-mono text-[var(--cc-muted)] mb-2 block">Recipient address</label>
                <input
                  type="text"
                  placeholder="0x..."
                  value={state.to}
                  onChange={(e) => setState((s) => ({ ...s, to: e.target.value }))}
                  className="cc-form-input"
                />
              </div>

              {/* Amount */}
              <div>
                <label className="cc-caption-mono text-[var(--cc-muted)] mb-2 block">Amount</label>
                <input
                  type="number"
                  step="0.001"
                  placeholder="0.0"
                  value={state.amount}
                  onChange={(e) => setState((s) => ({ ...s, amount: e.target.value }))}
                  className="cc-form-input"
                />
              </div>

              <button
                onClick={handleConfirm}
                disabled={!state.to || !state.amount}
                className="cc-btn-primary w-full disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Confirm transfer
              </button>
            </div>
          )}

          {state.step === 'confirm' && (
            <div className="text-center p-5">
              <h3 className="cc-display-sm mb-4">Confirm transaction.</h3>
              <div className="bg-[var(--cc-canvas-soft-2)] rounded-lg p-4 mb-4 text-left border border-[var(--cc-hairline)]">
                <p className="text-body-sm text-[var(--cc-muted)] mb-1">Chain: {selectedChain.name}</p>
                <p className="text-body-sm text-[var(--cc-muted)] mb-1">Token: {state.token}</p>
                <p className="text-body-sm text-[var(--cc-muted)] mb-1">Recipient: {state.to.slice(0, 10)}...{state.to.slice(-8)}</p>
                <p className="text-body-lg text-[var(--cc-ink)] font-semibold mt-2">{state.amount} {state.token}</p>
              </div>
              <div className="flex gap-3 justify-center">
                <button
                  onClick={() => setState((s) => ({ ...s, step: 'input' }))}
                  className="cc-btn-secondary"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSend}
                  className="cc-btn-primary"
                >
                  Confirm send
                </button>
              </div>
            </div>
          )}

          {state.step === 'sending' && (
            <div className="text-center p-10">
              <div className="w-12 h-12 mx-auto mb-4 border-2 border-[var(--cc-hairline)] border-t-[var(--cc-link)] rounded-full animate-spin" />
              <p className="cc-body-md text-[var(--cc-muted)]">Transaction sending...</p>
            </div>
          )}

          {state.step === 'success' && (
            <div className="text-center p-5">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[var(--cc-success-bg)] flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8 text-[var(--cc-success)]" />
              </div>
              <h3 className="cc-display-sm mb-2">Transaction successful.</h3>
              <p className="text-caption text-[var(--cc-muted)] mb-4 font-[var(--font-mono)]">
                TX: {state.txHash.slice(0, 16)}...{state.txHash.slice(-8)}
              </p>
              <button
                onClick={handleReset}
                className="cc-btn-primary"
              >
                New transfer
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Right: Code Example */}
      <div className="lg:pt-16">
        <CodeExample code={{ react: CODE_EXAMPLE }} title="useCoinTransaction" />
      </div>
    </div>
  );
}
