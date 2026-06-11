/**
 * BridgePage — 跨链桥接演示
 *
 * 演示: 源链 → 目标链选择 → Token + 金额 → 预估接收 → 桥接进度
 */

import { useState, useCallback } from 'react';
import { Unlock, Lock, Link2, Coins, CheckCircle2, PartyPopper, Circle } from 'lucide-react';
import { CodeExample } from '../components/CodeExample';

const CHAINS = [
  { id: 'eip155:1', name: 'Ethereum', icon: '⟠', color: 'var(--cc-demo-chain-ethereum)' },
  { id: 'eip155:137', name: 'Polygon', icon: '⬡', color: 'var(--cc-demo-chain-polygon)' },
  { id: 'eip155:56', name: 'BSC', icon: '◆', color: 'var(--cc-demo-bridge-bsc)' },
  { id: 'eip155:42161', name: 'Arbitrum', icon: <Circle className="w-5 h-5 text-[var(--cc-demo-chain-arbitrum)]" />, color: 'var(--cc-demo-chain-arbitrum)' },
  { id: 'eip155:10', name: 'Optimism', icon: <Circle className="w-5 h-5 text-[var(--cc-demo-chain-optimism)]" />, color: 'var(--cc-demo-chain-optimism)' },
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

const PROGRESS_STEPS: { key: BridgeProgress; label: string; icon: React.FC<{className?: string}> }[] = [
  { key: 'approving', label: '授权 Token', icon: Unlock },
  { key: 'locking', label: '锁定源链资产', icon: Lock },
  { key: 'confirming', label: '跨链确认', icon: Link2 },
  { key: 'minting', label: '铸造目标资产', icon: Coins },
  { key: 'complete', label: '桥接完成', icon: CheckCircle2 },
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
        setTxHash('0x' + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join(''));
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
    <div className="grid grid-cols-2 gap-6 p-6">
      {/* Left: Bridge UI */}
      <div>
        <h2 className="text-[var(--cc-text-xl)] font-[var(--cc-weight-bold)] mb-2">跨链桥接</h2>
        <p className="text-[var(--cc-demo-text-muted)] mb-6">在不同链之间安全转移资产。</p>

        <div className="bg-[var(--cc-demo-surface-dark)] rounded-xl p-6">
          {step === 'input' && (
            <div className="flex flex-col gap-4">
              {/* Source Chain */}
              <div>
                <label className="text-[var(--cc-text-xs)] text-[var(--cc-demo-text-light)] mb-2 block">从</label>
                <div className="flex gap-2 flex-wrap">
                  {CHAINS.map((chain) => (
                    <button
                      key={chain.id}
                      onClick={() => setSourceChain(chain.id)}
                      disabled={chain.id === destChain}
                      className="px-4 py-2 rounded-lg text-[var(--cc-text-xs)]"
                      style={{
                        border: sourceChain === chain.id ? `2px solid ${chain.color}` : '2px solid #333',
                        background: sourceChain === chain.id ? `${chain.color}20` : '#0d0d1a',
                        color: chain.id === destChain ? '#555' : '#fff',
                        cursor: chain.id === destChain ? 'not-allowed' : 'pointer',
                      }}
                    >
                      {chain.icon} {chain.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Swap button */}
              <div className="text-center">
                <button
                  onClick={handleSwapChains}
                  className="px-4 py-2 rounded-full border-0 bg-transparent text-[var(--cc-on-primary,#fff)] cursor-pointer text-[var(--cc-text-md)]"
                >
                  ⇅
                </button>
              </div>

              {/* Dest Chain */}
              <div>
                <label className="text-[var(--cc-text-xs)] text-[var(--cc-demo-text-light)] mb-2 block">到</label>
                <div className="flex gap-2 flex-wrap">
                  {CHAINS.map((chain) => (
                    <button
                      key={chain.id}
                      onClick={() => setDestChain(chain.id)}
                      disabled={chain.id === sourceChain}
                      className="px-4 py-2 rounded-lg text-[var(--cc-text-xs)]"
                      style={{
                        border: destChain === chain.id ? `2px solid ${chain.color}` : '2px solid #333',
                        background: destChain === chain.id ? `${chain.color}20` : '#0d0d1a',
                        color: chain.id === sourceChain ? '#555' : '#fff',
                        cursor: chain.id === sourceChain ? 'not-allowed' : 'pointer',
                      }}
                    >
                      {chain.icon} {chain.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Amount */}
              <div>
                <label className="text-[var(--cc-text-xs)] text-[var(--cc-demo-text-light)] mb-2 block">金额 (USDC)</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="0.0"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full p-3 px-4 rounded-lg border-2 border-[var(--cc-demo-border)] bg-[var(--cc-demo-surface-darker)] text-[var(--cc-on-primary,#fff)] text-[var(--cc-text-sm)] outline-none box-border"
                />
              </div>

              {/* Estimate */}
              {amount && (
                <div className="bg-[var(--cc-demo-surface-darker)] rounded-lg p-3">
                  <div className="flex justify-between text-[var(--cc-text-xs)]">
                    <span className="text-[var(--cc-demo-text-muted)]">预估接收</span>
                    <span className="text-[var(--cc-demo-success)] font-[var(--cc-weight-semibold)]">{estimatedOutput} USDC</span>
                  </div>
                  <div className="flex justify-between text-[var(--cc-text-xs)] mt-1">
                    <span className="text-[var(--cc-demo-text-muted)]">手续费 (0.3%)</span>
                    <span className="text-[var(--cc-demo-error)]">{fee} USDC</span>
                  </div>
                </div>
              )}

              <button
                onClick={handleBridge}
                disabled={!amount || sourceChain === destChain}
                className="p-3 px-6 rounded-lg border-0 text-[var(--cc-on-primary,#fff)] text-[var(--cc-text-md)] font-[var(--cc-weight-semibold)]"
                style={{
                  background: amount && sourceChain !== destChain ? '#6366f1' : '#333',
                  cursor: amount && sourceChain !== destChain ? 'pointer' : 'not-allowed',
                }}
              >
                开始桥接
              </button>
            </div>
          )}

          {step === 'bridging' && (
            <div className="p-5">
              <h3 className="text-[var(--cc-text-lg)] mb-5 text-center">桥接进行中</h3>
              <div className="flex flex-col gap-3">
                {PROGRESS_STEPS.map((s, i) => {
                  const currentIdx = PROGRESS_STEPS.findIndex((p) => p.key === progress);
                  const isDone = i < currentIdx;
                  const isCurrent = i === currentIdx;
                  const Icon = s.icon;
                  return (
                    <div
                      key={s.key}
                      className="flex items-center gap-3 p-3 px-4 rounded-lg"
                      style={{
                        background: isCurrent ? '#6366f120' : isDone ? '#4ade8010' : '#0d0d1a',
                        border: isCurrent ? '1px solid #6366f1' : '1px solid transparent',
                      }}
                    >
                      {isDone ? (
                        <CheckCircle2 className="w-5 h-5 text-[var(--cc-demo-success)]" />
                      ) : (
                        <Icon className="w-5 h-5 text-white" />
                      )}
                      <span className={`text-[var(--cc-text-sm)] ${isDone || isCurrent ? 'text-white' : 'text-[#555]'}`}>{s.label}</span>
                      {isCurrent && <span className="ml-auto text-[#6366f1] text-xs">处理中...</span>}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {step === 'complete' && (
            <div className="text-center p-5">
              <PartyPopper className="w-12 h-12 mx-auto mb-4 text-[var(--cc-demo-success)]" />
              <h3 className="text-[var(--cc-text-lg)] mb-2">桥接完成!</h3>
              <p className="text-[var(--cc-demo-text-muted)] text-[var(--cc-text-xs)] mb-1">
                {srcChain.name} → {dstChain.name}
              </p>
              <p className="text-[var(--cc-demo-text-muted)] text-[var(--cc-text-xs)] mb-1">
                {amount} USDC → {estimatedOutput} USDC
              </p>
              <p className="text-[#555] text-xs mb-4">
                TX: {txHash.slice(0, 16)}...{txHash.slice(-8)}
              </p>
              <button
                onClick={handleReset}
                className="p-3 px-5 rounded-lg border-0 bg-[var(--cc-demo-accent)] text-[var(--cc-on-primary,#fff)] cursor-pointer"
              >
                新桥接
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Right: Code */}
      <div>
        <CodeExample code={CODE_EXAMPLE} language="typescript" title="useBridge" />
      </div>
    </div>
  );
}
