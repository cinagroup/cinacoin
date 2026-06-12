/**
 * BridgePage — Cross-chain bridge demo
 *
 * Source chain → Dest chain → Token + amount → Estimated output → Bridge progress
 */

import { Unlock, Lock, Link2, Coins, CheckCircle2, PartyPopper } from 'lucide-react';
import { useState, useCallback } from 'react';

import { CodeExample } from '../components/CodeExample';

const CHAINS = [
  { id: 'eip155:1', name: 'Ethereum', icon: '⟠', color: 'var(--cc-demo-chain-ethereum)' },
  { id: 'eip155:137', name: 'Polygon', icon: '⬡', color: 'var(--cc-demo-chain-polygon)' },
  { id: 'eip155:56', name: 'BSC', icon: '◆', color: 'var(--cc-demo-bridge-bsc)' },
  { id: 'eip155:42161', name: 'Arbitrum', icon: 'λ', color: 'var(--cc-demo-chain-arbitrum)' },
  { id: 'eip155:10', name: 'Optimism', icon: 'O', color: 'var(--cc-demo-chain-optimism)' },
];

const CODE_EXAMPLE = `import { useBridge, useCoinAccount } from '@cinacoin/core-sdk';

function BridgeForm() {
  const { account } = useCoinAccount();
  const {
    sourceChain, setSourceChain,
    destChain, setDestChain,
    amount, setAmount,
    estimatedOutput,
    fee,
    bridge,
    isBridging,
    progress,
  } = useBridge();

  const handleBridge = async () => {
    const result = await bridge({
      from: sourceChain,
      to: destChain,
      token: 'USDC',
      amount: amount,
      recipient: account?.address,
    });

    // Track progress
    // progress: 'approving' | 'locking' | 'confirming' | 'minting' | 'complete'
  };

  return (
    <div>
      <ChainSelector value={sourceChain} onChange={setSourceChain} label="From" />
      <ChainSelector value={destChain} onChange={setDestChain} label="To" />
      <AmountInput value={amount} onChange={setAmount} />
      <p>Estimated: {estimatedOutput} USDC</p>
      <p>Fee: {fee} USDC</p>
      <button onClick={handleBridge} disabled={isBridging}>
        {isBridging ? \`Bridging... \${progress}\` : 'Bridge'}
      </button>
    </div>
  );
}`;

type BridgeStep = 'input' | 'bridging' | 'complete';
type BridgeProgress = 'approving' | 'locking' | 'confirming' | 'minting' | 'complete';

const PROGRESS_STEPS: {
  key: BridgeProgress;
  label: string;
  icon: React.FC<{ className?: string }>;
}[] = [
  { key: 'approving', label: 'Approve token', icon: Unlock },
  { key: 'locking', label: 'Lock source assets', icon: Lock },
  { key: 'confirming', label: 'Cross-chain confirmation', icon: Link2 },
  { key: 'minting', label: 'Mint destination assets', icon: Coins },
  { key: 'complete', label: 'Bridge complete', icon: CheckCircle2 },
];

export function BridgePage() {
  const [sourceChain, setSourceChain] = useState(CHAINS[0].id);
  const [destChain, setDestChain] = useState(CHAINS[1].id);
  const [amount, setAmount] = useState('');
  const [step, setStep] = useState<BridgeStep>('input');
  const [progress, setProgress] = useState<BridgeProgress>('approving');
  const [txHash, setTxHash] = useState('');

  const srcChain = CHAINS.find((c) => c.id === sourceChain)!;
  const dstChain = CHAINS.find((c) => c.id === destChain)!;

  // Mock estimated output (99.7% after 0.3% fee)
  const estimatedOutput = amount ? (parseFloat(amount) * 0.997).toFixed(4) : '0';
  const fee = amount ? (parseFloat(amount) * 0.003).toFixed(4) : '0';

  const handleSwapChains = useCallback(() => {
    setSourceChain(destChain);
    setDestChain(sourceChain);
  }, [sourceChain, destChain]);

  const handleBridge = useCallback(() => {
    if (!amount || sourceChain === destChain) return;
    setStep('bridging');
    setProgress('approving');

    const steps: BridgeProgress[] = ['approving', 'locking', 'confirming', 'minting', 'complete'];
    let i = 0;
    const interval = setInterval(() => {
      i++;
      if (i < steps.length) {
        setProgress(steps[i]);
      } else {
        clearInterval(interval);
        setStep('complete');
        setTxHash(
          '0x' +
            Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('')
        );
      }
    }, 1500);
  }, [amount, sourceChain, destChain]);

  const handleReset = useCallback(() => {
    setStep('input');
    setProgress('approving');
    setAmount('');
    setTxHash('');
  }, []);

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Left: Bridge UI */}
      <div>
        <h2 className="cc-display-lg mb-2">Cross-chain bridge.</h2>
        <p className="cc-body-md text-[var(--cc-body)] mb-6">
          Transfer assets securely between different chains.
        </p>

        <div className="cc-card">
          {step === 'input' && (
            <div className="flex flex-col gap-4">
              {/* Source Chain */}
              <div>
                <label className="cc-caption-mono text-[var(--cc-muted)] mb-2 block">From</label>
                <div className="flex gap-2 flex-wrap">
                  {CHAINS.map((chain) => (
                    <button
                      key={chain.id}
                      onClick={() => setSourceChain(chain.id)}
                      disabled={chain.id === destChain}
                      className={`px-3 py-2 rounded-lg text-caption font-medium transition-all focus-ring ${
                        sourceChain === chain.id
                          ? 'bg-[var(--cc-canvas-soft-2)] border-2 border-[var(--cc-link)]'
                          : 'bg-[var(--cc-canvas-soft)] border border-[var(--cc-hairline)] hover:border-[var(--cc-muted)]'
                      } ${chain.id === destChain ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
                    >
                      <span className="mr-1">{chain.icon}</span> {chain.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Swap button */}
              <div className="text-center">
                <button
                  onClick={handleSwapChains}
                  className="w-9 h-9 bg-[var(--cc-canvas)] border border-[var(--cc-hairline)] rounded-full flex items-center justify-center hover:bg-[var(--cc-canvas-soft-2)] transition-all shadow-[var(--cc-level2)] focus-ring"
                  aria-label="Swap source and destination chains"
                >
                  ⇅
                </button>
              </div>

              {/* Dest Chain */}
              <div>
                <label className="cc-caption-mono text-[var(--cc-muted)] mb-2 block">To</label>
                <div className="flex gap-2 flex-wrap">
                  {CHAINS.map((chain) => (
                    <button
                      key={chain.id}
                      onClick={() => setDestChain(chain.id)}
                      disabled={chain.id === sourceChain}
                      className={`px-3 py-2 rounded-lg text-caption font-medium transition-all focus-ring ${
                        destChain === chain.id
                          ? 'bg-[var(--cc-canvas-soft-2)] border-2 border-[var(--cc-link)]'
                          : 'bg-[var(--cc-canvas-soft)] border border-[var(--cc-hairline)] hover:border-[var(--cc-muted)]'
                      } ${chain.id === sourceChain ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
                    >
                      <span className="mr-1">{chain.icon}</span> {chain.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Amount */}
              <div>
                <label className="cc-caption-mono text-[var(--cc-muted)] mb-2 block">
                  Amount (USDC)
                </label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="0.0"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="cc-form-input"
                />
              </div>

              {/* Estimate */}
              {amount && (
                <div className="bg-[var(--cc-canvas-soft-2)] rounded-lg p-3 border border-[var(--cc-hairline)]">
                  <div className="flex justify-between text-body-sm">
                    <span className="text-[var(--cc-muted)]">Estimated receive</span>
                    <span className="text-[var(--cc-success)] font-semibold">
                      {estimatedOutput} USDC
                    </span>
                  </div>
                  <div className="flex justify-between text-body-sm mt-1">
                    <span className="text-[var(--cc-muted)]">Fee (0.3%)</span>
                    <span className="text-[var(--cc-error)]">{fee} USDC</span>
                  </div>
                </div>
              )}

              <button
                onClick={handleBridge}
                disabled={!amount || sourceChain === destChain}
                className="cc-btn-primary w-full disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Start bridge
              </button>
            </div>
          )}

          {step === 'bridging' && (
            <div className="p-4">
              <h3 className="cc-display-sm mb-5 text-center">Bridge in progress.</h3>
              <div className="flex flex-col gap-3">
                {PROGRESS_STEPS.map((s, i) => {
                  const currentIdx = PROGRESS_STEPS.findIndex((p) => p.key === progress);
                  const isDone = i < currentIdx;
                  const isCurrent = i === currentIdx;
                  const Icon = s.icon;
                  return (
                    <div
                      key={s.key}
                      className={`flex items-center gap-3 p-3 px-4 rounded-lg border transition-all ${
                        isCurrent
                          ? 'bg-[var(--cc-link-bg-soft)] border-[var(--cc-link)]'
                          : isDone
                            ? 'bg-[var(--cc-success-bg)] border-transparent'
                            : 'bg-[var(--cc-canvas-soft)] border-transparent'
                      }`}
                    >
                      {isDone ? (
                        <CheckCircle2 className="w-5 h-5 text-[var(--cc-success)] shrink-0" />
                      ) : (
                        <Icon
                          className={`w-5 h-5 shrink-0 ${isCurrent ? 'text-[var(--cc-link)]' : 'text-[var(--cc-muted)]'}`}
                        />
                      )}
                      <span
                        className={`text-body-sm ${isDone || isCurrent ? 'text-[var(--cc-ink)] font-medium' : 'text-[var(--cc-muted)]'}`}
                      >
                        {s.label}
                      </span>
                      {isCurrent && (
                        <span className="ml-auto text-[var(--cc-link)] text-caption font-medium">
                          Processing...
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {step === 'complete' && (
            <div className="text-center p-5">
              <PartyPopper className="w-12 h-12 mx-auto mb-4 text-[var(--cc-success)]" />
              <h3 className="cc-display-sm mb-2">Bridge complete.</h3>
              <p className="cc-body-sm text-[var(--cc-muted)] mb-1">
                {srcChain.name} → {dstChain.name}
              </p>
              <p className="cc-body-sm text-[var(--cc-muted)] mb-1">
                {amount} USDC → {estimatedOutput} USDC
              </p>
              <p className="text-caption text-[var(--cc-muted)] mb-4 font-[var(--font-mono)]">
                TX: {txHash.slice(0, 16)}...{txHash.slice(-8)}
              </p>
              <button onClick={handleReset} className="cc-btn-primary">
                New bridge
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Right: Code */}
      <div className="lg:pt-16">
        <CodeExample code={{ react: CODE_EXAMPLE }} title="useBridge" />
      </div>
    </div>
  );
}
