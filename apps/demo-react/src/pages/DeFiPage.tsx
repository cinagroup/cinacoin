/**
 * DeFiPage — DeFi 交互演示
 *
 * 演示: LP 池列表、Stake/Unstake、Swap
 */

import { useState, useCallback } from 'react';
import { CodeExample } from '../components/CodeExample';

const POOLS = [
  { id: 1, name: 'ETH / USDC', apy: 12.5, tvl: 45200000, staked: 0, icon: '⟠💵' },
  { id: 2, name: 'BTC / ETH', apy: 8.3, tvl: 32100000, staked: 0, icon: '₿⟠' },
  { id: 3, name: 'MATIC / USDC', apy: 18.7, tvl: 12800000, staked: 0, icon: '⬡💵' },
  { id: 4, name: 'LINK / ETH', apy: 15.2, tvl: 8900000, staked: 0, icon: '⬡⟠' },
];

const SWAP_TOKENS = ['ETH', 'USDC', 'USDT', 'DAI', 'WBTC', 'LINK', 'MATIC'];

const CODE_EXAMPLE = `import { useDeFi, useCoinAccount } from '@cinacoin/core-sdk';

function DeFiDashboard() {
  const { account } = useCoinAccount();
  const { pools, stake, unstake, swap } = useDeFi();

  // Stake LP tokens
  const handleStake = async (poolId: number, amount: string) => {
    await stake({ poolId, amount, address: account?.address });
  };

  // Unstake
  const handleUnstake = async (poolId: number) => {
    await unstake({ poolId, address: account?.address });
  };

  // Swap tokens
  const handleSwap = async (from: string, to: string, amount: string) => {
    const quote = await swap.quote({ fromToken: from, toToken: to, amount });
    await swap.execute({ quote, slippage: 0.5 });
  };

  return (
    <div>
      {pools.map((pool) => (
        <PoolCard
          key={pool.id}
          pool={pool}
          onStake={(amt) => handleStake(pool.id, amt)}
          onUnstake={() => handleUnstake(pool.id)}
        />
      ))}
    </div>
  );
}`;

type Tab = 'pools' | 'swap';

export function DeFiPage() {
  const [tab, setTab] = useState<Tab>('pools');
  const [pools, setPools] = useState(POOLS);
  const [stakeAmount, setStakeAmount] = useState<Record<number, string>>({});
  const [stakingPool, setStakingPool] = useState<number | null>(null);

  // Swap state
  const [swapFrom, setSwapFrom] = useState('ETH');
  const [swapTo, setSwapTo] = useState('USDC');
  const [swapAmount, setSwapAmount] = useState('');
  const [swapResult, setSwapResult] = useState('');

  const mockRate = 1850.42; // ETH/USDC mock rate
  const estimatedReceive = swapAmount ? (parseFloat(swapAmount) * mockRate).toFixed(2) : '';

  const handleStake = useCallback((poolId: number) => {
    const amount = stakeAmount[poolId] || '0';
    if (!amount) return;
    setStakingPool(poolId);
    setTimeout(() => {
      setPools((prev) =>
        prev.map((p) =>
          p.id === poolId ? { ...p, staked: p.staked + parseFloat(amount) } : p
        )
      );
      setStakeAmount((prev) => ({ ...prev, [poolId]: '' }));
      setStakingPool(null);
    }, 1500);
  }, [stakeAmount]);

  const handleUnstake = useCallback((poolId: number) => {
    setStakingPool(poolId);
    setTimeout(() => {
      setPools((prev) =>
        prev.map((p) =>
          p.id === poolId ? { ...p, staked: 0 } : p
        )
      );
      setStakingPool(null);
    }, 1500);
  }, []);

  const handleSwap = useCallback(() => {
    if (!swapAmount) return;
    setSwapResult('');
    setTimeout(() => {
      setSwapResult(`${swapAmount} ${swapFrom} → ${estimatedReceive} ${swapTo}`);
    }, 1000);
  }, [swapAmount, swapFrom, swapTo, estimatedReceive]);

  const formatTVL = (tvl: number) => {
    if (tvl >= 1_000_000) return `$${(tvl / 1_000_000).toFixed(1)}M`;
    if (tvl >= 1_000) return `$${(tvl / 1_000).toFixed(1)}K`;
    return `$${tvl}`;
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, padding: 24 }}>
      {/* Left: DeFi UI */}
      <div>
        <h2 style={{ fontSize: "var(--cc-text-xl)", fontWeight: "var(--cc-weight-bold)", marginBottom: 8 }}>DeFi 交互</h2>
        <p style={{ color: 'var(--cc-demo-text-muted)', marginBottom: 24 }}>LP 质押、Token 兑换。</p>

        {/* Tab switcher */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 20, background: 'var(--cc-demo-surface-darker)', borderRadius: 8, padding: 4, width: 'fit-content' }}>
          {(['pools', 'swap'] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{
                padding: '8px 20px', borderRadius: 6, border: 'none',
                background: tab === t ? '#6366f1' : 'transparent',
                color: 'var(--cc-on-primary, #fff)', cursor: 'pointer', fontSize: "var(--cc-text-sm)", fontWeight: "var(--cc-weight-medium)",
              }}
            >
              {t === 'pools' ? 'LP 池' : 'Swap'}
            </button>
          ))}
        </div>

        {tab === 'pools' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {pools.map((pool) => (
              <div key={pool.id} style={{ background: 'var(--cc-demo-surface-dark)', borderRadius: 12, padding: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <div>
                    <span style={{ fontSize: "var(--cc-text-lg)", marginRight: 8 }}>{pool.icon}</span>
                    <span style={{ fontSize: "var(--cc-text-md)", fontWeight: "var(--cc-weight-semibold)" }}>{pool.name}</span>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ color: 'var(--cc-demo-success)', fontSize: "var(--cc-text-lg)", fontWeight: "var(--cc-weight-bold)" }}>{pool.apy}% APY</div>
                    <div style={{ color: 'var(--cc-demo-text-muted)', fontSize: 12 }}>TVL: {formatTVL(pool.tvl)}</div>
                  </div>
                </div>

                {pool.staked > 0 ? (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: 'var(--cc-demo-text-muted)', fontSize: "var(--cc-text-xs)" }}>已质押: {pool.staked} LP</span>
                    <button
                      onClick={() => handleUnstake(pool.id)}
                      disabled={stakingPool === pool.id}
                      style={{
                        padding: '8px 16px', borderRadius: 6, border: '0px solid var(--cc-demo-error)',
                        background: 'transparent', color: 'var(--cc-demo-error)', cursor: 'pointer', fontSize: "var(--cc-text-xs)",
                      }}
                    >
                      {stakingPool === pool.id ? '处理中...' : 'Unstake'}
                    </button>
                  </div>
                ) : (
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input
                      type="number"
                      placeholder="LP 数量"
                      value={stakeAmount[pool.id] || ''}
                      onChange={(e) => setStakeAmount((prev) => ({ ...prev, [pool.id]: e.target.value }))}
                      style={{
                        flex: 1, padding: '8px 12px', borderRadius: 6,
                        border: '2px solid var(--cc-demo-border)', background: 'var(--cc-demo-surface-darker)', color: 'var(--cc-on-primary, #fff)',
                        fontSize: "var(--cc-text-xs)", outline: 'none',
                      }}
                    />
                    <button
                      onClick={() => handleStake(pool.id)}
                      disabled={stakingPool === pool.id || !stakeAmount[pool.id]}
                      style={{
                        padding: '8px 16px', borderRadius: 6, border: 'none',
                        background: 'var(--cc-demo-accent)', color: 'var(--cc-on-primary, #fff)', cursor: 'pointer', fontSize: "var(--cc-text-xs)",
                        opacity: !stakeAmount[pool.id] ? 0.5 : 1,
                      }}
                    >
                      {stakingPool === pool.id ? '处理中...' : 'Stake'}
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {tab === 'swap' && (
          <div style={{ background: 'var(--cc-demo-surface-dark)', borderRadius: 12, padding: 24 }}>
            {/* From */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: "var(--cc-text-xs)", color: 'var(--cc-demo-text-light)', marginBottom: 8, display: 'block' }}>从</label>
              <div style={{ display: 'flex', gap: 8 }}>
                <select
                  value={swapFrom}
                  onChange={(e) => setSwapFrom(e.target.value)}
                  style={{
                    padding: '8px 12px', borderRadius: 6, border: '0px solid #333',
                    background: 'var(--cc-demo-surface-darker)', color: 'var(--cc-on-primary, #fff)', fontSize: "var(--cc-text-sm)", outline: 'none',
                  }}
                >
                  {SWAP_TOKENS.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
                <input
                  type="number"
                  step="0.001"
                  placeholder="0.0"
                  value={swapAmount}
                  onChange={(e) => setSwapAmount(e.target.value)}
                  style={{
                    flex: 1, padding: '8px 12px', borderRadius: 6,
                    border: '2px solid var(--cc-demo-border)', background: 'var(--cc-demo-surface-darker)', color: 'var(--cc-on-primary, #fff)',
                    fontSize: "var(--cc-text-sm)", outline: 'none',
                  }}
                />
              </div>
            </div>

            {/* Swap direction */}
            <div style={{ textAlign: 'center', margin: '8px 0' }}>
              <button
                onClick={() => { setSwapFrom(swapTo); setSwapTo(swapFrom); }}
                style={{
                  padding: '4px 12px', borderRadius: 20, border: '0px solid #333',
                  background: 'transparent', color: 'var(--cc-on-primary, #fff)', cursor: 'pointer', fontSize: "var(--cc-text-md)",
                }}
              >
                ⇅
              </button>
            </div>

            {/* To */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: "var(--cc-text-xs)", color: 'var(--cc-demo-text-light)', marginBottom: 8, display: 'block' }}>到</label>
              <div style={{ display: 'flex', gap: 8 }}>
                <select
                  value={swapTo}
                  onChange={(e) => setSwapTo(e.target.value)}
                  style={{
                    padding: '8px 12px', borderRadius: 6, border: '0px solid #333',
                    background: 'var(--cc-demo-surface-darker)', color: 'var(--cc-on-primary, #fff)', fontSize: "var(--cc-text-sm)", outline: 'none',
                  }}
                >
                  {SWAP_TOKENS.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
                <div style={{
                  flex: 1, padding: '8px 12px', borderRadius: 6,
                  background: 'var(--cc-demo-surface-darker)', color: estimatedReceive ? '#4ade80' : '#555',
                  fontSize: "var(--cc-text-sm)", display: 'flex', alignItems: 'center',
                }}>
                  {estimatedReceive || '0.0'}
                </div>
              </div>
            </div>

            {/* Rate info */}
            {swapAmount && (
              <div style={{ background: 'var(--cc-demo-surface-darker)', borderRadius: 8, padding: 12, marginBottom: 16, fontSize: 12, color: 'var(--cc-demo-text-muted)' }}>
                1 {swapFrom} = {mockRate} {swapTo} · 滑点 0.5%
              </div>
            )}

            <button
              onClick={handleSwap}
              disabled={!swapAmount}
              style={{
                width: '100%', padding: '12px 24px', borderRadius: 8, border: 'none',
                background: swapAmount ? '#6366f1' : '#333',
                color: 'var(--cc-on-primary, #fff)', fontSize: "var(--cc-text-md)", fontWeight: "var(--cc-weight-semibold)",
                cursor: swapAmount ? 'pointer' : 'not-allowed',
              }}
            >
              Swap
            </button>

            {swapResult && (
              <div style={{ marginTop: 16, padding: 12, background: 'rgba(74, 222, 128, 0.06)', borderRadius: 8, color: 'var(--cc-demo-success)', fontSize: "var(--cc-text-sm)", textAlign: 'center' }}>
                ✅ {swapResult}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Right: Code */}
      <div>
        <CodeExample code={CODE_EXAMPLE} language="typescript" title="useDeFi" />
      </div>
    </div>
  );
}
