/**
 * BridgePage — 跨链桥接演示
 *
 * 演示: 源链 → 目标链选择 → Token + 金额 → 预估接收 → 桥接进度
 */

import { useState, useCallback } from 'react';
import { CodeExample } from '../components/CodeExample';

const CHAINS = [
  { id: 'eip155:1', name: 'Ethereum', icon: '⟠', color: '#627EEA' },
  { id: 'eip155:137', name: 'Polygon', icon: '⬡', color: '#8247E5' },
  { id: 'eip155:56', name: 'BSC', icon: '◆', color: '#F3BA2F' },
  { id: 'eip155:42161', name: 'Arbitrum', icon: '🔵', color: '#28A0F0' },
  { id: 'eip155:10', name: 'Optimism', icon: '🔴', color: '#FF0420' },
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

const PROGRESS_STEPS: { key: BridgeProgress; label: string; icon: string }[] = [
  { key: 'approving', label: '授权 Token', icon: '🔓' },
  { key: 'locking', label: '锁定源链资产', icon: '🔒' },
  { key: 'confirming', label: '跨链确认', icon: '⛓️' },
  { key: 'minting', label: '铸造目标资产', icon: '🪙' },
  { key: 'complete', label: '桥接完成', icon: '✅' },
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
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, padding: 24 }}>
      {/* Left: Bridge UI */}
      <div>
        <h2 style={{ fontSize: "var(--cc-text-xl)", fontWeight: "var(--cc-weight-bold)", marginBottom: 8 }}>跨链桥接</h2>
        <p style={{ color: '#888', marginBottom: 24 }}>在不同链之间安全转移资产。</p>

        <div style={{ background: '#1a1a2e', borderRadius: 12, padding: 24 }}>
          {step === 'input' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Source Chain */}
              <div>
                <label style={{ fontSize: "var(--cc-text-xs)", color: '#aaa', marginBottom: 8, display: 'block' }}>从</label>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {CHAINS.map((chain) => (
                    <button
                      key={chain.id}
                      onClick={() => setSourceChain(chain.id)}
                      disabled={chain.id === destChain}
                      style={{
                        padding: '8px 16px', borderRadius: 8,
                        border: sourceChain === chain.id ? `2px solid ${chain.color}` : '2px solid #333',
                        background: sourceChain === chain.id ? `${chain.color}20` : '#0d0d1a',
                        color: chain.id === destChain ? '#555' : '#fff',
                        cursor: chain.id === destChain ? 'not-allowed' : 'pointer',
                        fontSize: "var(--cc-text-xs)",
                      }}
                    >
                      {chain.icon} {chain.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Swap button */}
              <div style={{ textAlign: 'center' }}>
                <button
                  onClick={handleSwapChains}
                  style={{
                    padding: '8px 16px', borderRadius: 20, border: '0px solid #333',
                    background: 'transparent', color: '#fff', cursor: 'pointer', fontSize: "var(--cc-text-md)",
                  }}
                >
                  ⇅
                </button>
              </div>

              {/* Dest Chain */}
              <div>
                <label style={{ fontSize: "var(--cc-text-xs)", color: '#aaa', marginBottom: 8, display: 'block' }}>到</label>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {CHAINS.map((chain) => (
                    <button
                      key={chain.id}
                      onClick={() => setDestChain(chain.id)}
                      disabled={chain.id === sourceChain}
                      style={{
                        padding: '8px 16px', borderRadius: 8,
                        border: destChain === chain.id ? `2px solid ${chain.color}` : '2px solid #333',
                        background: destChain === chain.id ? `${chain.color}20` : '#0d0d1a',
                        color: chain.id === sourceChain ? '#555' : '#fff',
                        cursor: chain.id === sourceChain ? 'not-allowed' : 'pointer',
                        fontSize: "var(--cc-text-xs)",
                      }}
                    >
                      {chain.icon} {chain.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Amount */}
              <div>
                <label style={{ fontSize: "var(--cc-text-xs)", color: '#aaa', marginBottom: 8, display: 'block' }}>金额 (USDC)</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="0.0"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  style={{
                    width: '100%', padding: '12px 16px', borderRadius: 8,
                    border: '2px solid #333', background: '#0d0d1a', color: '#fff',
                    fontSize: "var(--cc-text-sm)", outline: 'none', boxSizing: 'border-box',
                  }}
                />
              </div>

              {/* Estimate */}
              {amount && (
                <div style={{ background: '#0d0d1a', borderRadius: 8, padding: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: "var(--cc-text-xs)" }}>
                    <span style={{ color: '#888' }}>预估接收</span>
                    <span style={{ color: '#4ade80', fontWeight: "var(--cc-weight-semibold)" }}>{estimatedOutput} USDC</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: "var(--cc-text-xs)", marginTop: 4 }}>
                    <span style={{ color: '#888' }}>手续费 (0.3%)</span>
                    <span style={{ color: '#f87171' }}>{fee} USDC</span>
                  </div>
                </div>
              )}

              <button
                onClick={handleBridge}
                disabled={!amount || sourceChain === destChain}
                style={{
                  padding: '12px 24px', borderRadius: 8, border: 'none',
                  background: amount && sourceChain !== destChain ? '#6366f1' : '#333',
                  color: '#fff', fontSize: "var(--cc-text-md)", fontWeight: "var(--cc-weight-semibold)",
                  cursor: amount && sourceChain !== destChain ? 'pointer' : 'not-allowed',
                }}
              >
                开始桥接
              </button>
            </div>
          )}

          {step === 'bridging' && (
            <div style={{ padding: 20 }}>
              <h3 style={{ fontSize: "var(--cc-text-lg)", marginBottom: 20, textAlign: 'center' }}>桥接进行中</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {PROGRESS_STEPS.map((s, i) => {
                  const currentIdx = PROGRESS_STEPS.findIndex((p) => p.key === progress);
                  const isDone = i < currentIdx;
                  const isCurrent = i === currentIdx;
                  return (
                    <div
                      key={s.key}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 12,
                        padding: '12px 16px', borderRadius: 8,
                        background: isCurrent ? '#6366f120' : isDone ? '#4ade8010' : '#0d0d1a',
                        border: isCurrent ? '1px solid #6366f1' : '1px solid transparent',
                      }}
                    >
                      <span style={{ fontSize: "var(--cc-text-lg)" }}>{isDone ? '✅' : s.icon}</span>
                      <span style={{ color: isDone || isCurrent ? '#fff' : '#555', fontSize: "var(--cc-text-sm)" }}>{s.label}</span>
                      {isCurrent && <span style={{ marginLeft: 'auto', color: '#6366f1', fontSize: 12 }}>处理中...</span>}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {step === 'complete' && (
            <div style={{ textAlign: 'center', padding: 20 }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>🎉</div>
              <h3 style={{ fontSize: "var(--cc-text-lg)", marginBottom: 8 }}>桥接完成!</h3>
              <p style={{ color: '#888', fontSize: "var(--cc-text-xs)", marginBottom: 4 }}>
                {srcChain.name} → {dstChain.name}
              </p>
              <p style={{ color: '#888', fontSize: "var(--cc-text-xs)", marginBottom: 4 }}>
                {amount} USDC → {estimatedOutput} USDC
              </p>
              <p style={{ color: '#555', fontSize: 12, marginBottom: 16 }}>
                TX: {txHash.slice(0, 16)}...{txHash.slice(-8)}
              </p>
              <button
                onClick={handleReset}
                style={{
                  padding: '12px 20px', borderRadius: 8, border: 'none',
                  background: '#6366f1', color: '#fff', cursor: 'pointer',
                }}
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
