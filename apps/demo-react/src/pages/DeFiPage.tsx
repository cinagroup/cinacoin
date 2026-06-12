/**
 * DeFiPage — DeFi interaction demo
 *
 * LP pool list, Stake/Unstake, Token swap
 */

import { TrendingUp, CheckCircle2 } from 'lucide-react';
import { useState, useCallback } from 'react';

import { CodeExample } from '../components/CodeExample';

const POOLS = [
  { id: 1, name: 'ETH / USDC', apy: 12.5, tvl: 45200000, staked: 0 },
  { id: 2, name: 'BTC / ETH', apy: 8.3, tvl: 32100000, staked: 0 },
  { id: 3, name: 'MATIC / USDC', apy: 18.7, tvl: 12800000, staked: 0 },
  { id: 4, name: 'LINK / ETH', apy: 15.2, tvl: 8900000, staked: 0 },
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

  const handleStake = useCallback(
    (poolId: number) => {
      const amount = stakeAmount[poolId] || '0';
      if (!amount) return;
      setStakingPool(poolId);
      setTimeout(() => {
        setPools((prev) =>
          prev.map((p) => (p.id === poolId ? { ...p, staked: p.staked + parseFloat(amount) } : p))
        );
        setStakeAmount((prev) => ({ ...prev, [poolId]: '' }));
        setStakingPool(null);
      }, 1500);
    },
    [stakeAmount]
  );

  const handleUnstake = useCallback((poolId: number) => {
    setStakingPool(poolId);
    setTimeout(() => {
      setPools((prev) => prev.map((p) => (p.id === poolId ? { ...p, staked: 0 } : p)));
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
    <div className="max-w-5xl mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Left: DeFi UI */}
      <div>
        <h2 className="cc-display-lg mb-2">DeFi interaction.</h2>
        <p className="cc-body-md text-[var(--cc-body)] mb-6">LP staking and token swaps.</p>

        {/* Tab switcher */}
        <div className="flex gap-1 mb-5 bg-[var(--cc-canvas-soft-2)] rounded-lg p-1 w-fit border border-[var(--cc-hairline)]">
          {(['pools', 'swap'] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-5 py-2 rounded-md border-none cursor-pointer text-body-sm font-medium transition-all focus-ring ${
                tab === t
                  ? 'bg-[var(--cc-primary)] text-[var(--cc-on-primary)]'
                  : 'bg-transparent text-[var(--cc-body)] hover:text-[var(--cc-ink)]'
              }`}
            >
              {t === 'pools' ? 'LP Pools' : 'Swap'}
            </button>
          ))}
        </div>

        {tab === 'pools' && (
          <div className="flex flex-col gap-3">
            {pools.map((pool) => (
              <div key={pool.id} className="cc-card">
                <div className="flex justify-between items-center mb-3">
                  <div>
                    <TrendingUp className="w-5 h-5 inline-block mr-2 text-[var(--cc-success)]" />
                    <span className="text-body-md font-semibold text-[var(--cc-ink)]">
                      {pool.name}
                    </span>
                  </div>
                  <div className="text-right">
                    <div className="text-body-lg text-[var(--cc-success)] font-semibold">
                      {pool.apy}% APY
                    </div>
                    <div className="text-caption text-[var(--cc-muted)]">
                      TVL: {formatTVL(pool.tvl)}
                    </div>
                  </div>
                </div>

                {pool.staked > 0 ? (
                  <div className="flex justify-between items-center">
                    <span className="text-body-sm text-[var(--cc-muted)]">
                      Staked: {pool.staked} LP
                    </span>
                    <button
                      onClick={() => handleUnstake(pool.id)}
                      disabled={stakingPool === pool.id}
                      className="cc-btn-secondary-sm text-caption"
                    >
                      {stakingPool === pool.id ? 'Processing...' : 'Unstake'}
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <input
                      type="number"
                      placeholder="LP amount"
                      value={stakeAmount[pool.id] || ''}
                      onChange={(e) =>
                        setStakeAmount((prev) => ({ ...prev, [pool.id]: e.target.value }))
                      }
                      className="cc-form-input flex-1"
                    />
                    <button
                      onClick={() => handleStake(pool.id)}
                      disabled={stakingPool === pool.id || !stakeAmount[pool.id]}
                      className="cc-btn-primary-sm disabled:opacity-50"
                    >
                      {stakingPool === pool.id ? 'Processing...' : 'Stake'}
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {tab === 'swap' && (
          <div className="cc-card">
            {/* From */}
            <div className="mb-4">
              <label className="cc-caption-mono text-[var(--cc-muted)] mb-2 block">From</label>
              <div className="flex gap-2">
                <select
                  value={swapFrom}
                  onChange={(e) => setSwapFrom(e.target.value)}
                  className="cc-form-input"
                  style={{ maxWidth: '120px' }}
                >
                  {SWAP_TOKENS.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  step="0.001"
                  placeholder="0.0"
                  value={swapAmount}
                  onChange={(e) => setSwapAmount(e.target.value)}
                  className="cc-form-input flex-1"
                />
              </div>
            </div>

            {/* Swap direction */}
            <div className="text-center my-2">
              <button
                onClick={() => {
                  setSwapFrom(swapTo);
                  setSwapTo(swapFrom);
                }}
                className="w-9 h-9 bg-[var(--cc-canvas)] border border-[var(--cc-hairline)] rounded-full flex items-center justify-center hover:bg-[var(--cc-canvas-soft-2)] transition-all shadow-[var(--cc-level2)] focus-ring"
                aria-label="Swap from and to tokens"
              >
                ⇅
              </button>
            </div>

            {/* To */}
            <div className="mb-4">
              <label className="cc-caption-mono text-[var(--cc-muted)] mb-2 block">To</label>
              <div className="flex gap-2">
                <select
                  value={swapTo}
                  onChange={(e) => setSwapTo(e.target.value)}
                  className="cc-form-input"
                  style={{ maxWidth: '120px' }}
                >
                  {SWAP_TOKENS.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
                <div
                  className={`cc-form-input flex-1 flex items-center ${estimatedReceive ? 'text-[var(--cc-success)] font-medium' : 'text-[var(--cc-muted)]'}`}
                >
                  {estimatedReceive || '0.0'}
                </div>
              </div>
            </div>

            {/* Rate info */}
            {swapAmount && (
              <div className="bg-[var(--cc-canvas-soft-2)] rounded-lg p-3 mb-4 text-caption text-[var(--cc-muted)] border border-[var(--cc-hairline)]">
                1 {swapFrom} = {mockRate} {swapTo} · Slippage 0.5%
              </div>
            )}

            <button
              onClick={handleSwap}
              disabled={!swapAmount}
              className="cc-btn-primary w-full disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Swap
            </button>

            {swapResult && (
              <div className="mt-4 p-3 bg-[var(--cc-success-bg)] rounded-lg text-[var(--cc-success)] text-body-sm text-center flex items-center justify-center gap-2 border border-[var(--cc-success)]/20">
                <CheckCircle2 className="w-4 h-4" /> {swapResult}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Right: Code */}
      <div className="lg:pt-16">
        <CodeExample code={{ react: CODE_EXAMPLE }} title="useDeFi" />
      </div>
    </div>
  );
}
