/**
 * DeFiPage — DeFi 交互演示
 *
 * 演示: LP 池列表、Stake/Unstake、Swap
 */

import { useState, useCallback } from 'react';
import { TrendingUp, ArrowLeftRight, CheckCircle2 } from 'lucide-react';
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
    <div className="grid grid-cols-2 gap-6 p-6">
      {/* Left: DeFi UI */}
      <div>
        <h2 className="text-[var(--cc-text-xl)] font-semibold mb-2">DeFi 交互</h2>
        <p className="text-[var(--cc-demo-text-muted)] mb-6">LP 质押、Token 兑换。</p>

        {/* Tab switcher */}
        <div className="flex gap-1 mb-5 bg-[var(--cc-demo-surface-darker)] rounded-lg p-1 w-fit">
          {(['pools', 'swap'] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-5 py-2 rounded-md border-none cursor-pointer text-[var(--cc-text-sm)] font-medium ${
                tab === t ? 'bg-[#6366f1]' : 'bg-transparent'
              } text-[var(--cc-on-primary,#fff)]`}
            >
              {t === 'pools' ? 'LP 池' : 'Swap'}
            </button>
          ))}
        </div>

        {tab === 'pools' && (
          <div className="flex flex-col gap-3">
            {pools.map((pool) => (
              <div key={pool.id} className="bg-[var(--cc-demo-surface-dark)] rounded-xl p-5">
                <div className="flex justify-between items-center mb-3">
                  <div>
                    <TrendingUp className="w-5 h-5 inline-block mr-2 text-[var(--cc-demo-success)]" />
                    <span className="text-[var(--cc-text-md)] font-semibold">{pool.name}</span>
                  </div>
                  <div className="text-right">
                    <div className="text-[var(--cc-demo-success)] text-[var(--cc-text-lg)] font-semibold">{pool.apy}% APY</div>
                    <div className="text-[var(--cc-demo-text-muted)] text-xs">TVL: {formatTVL(pool.tvl)}</div>
                  </div>
                </div>

                {pool.staked > 0 ? (
                  <div className="flex justify-between items-center">
                    <span className="text-[var(--cc-demo-text-muted)] text-[var(--cc-text-xs)]">已质押: {pool.staked} LP</span>
                    <button
                      onClick={() => handleUnstake(pool.id)}
                      disabled={stakingPool === pool.id}
                      className="px-4 py-2 rounded-md border-0 border-[var(--cc-demo-error)] bg-transparent text-[var(--cc-demo-error)] cursor-pointer text-[var(--cc-text-xs)]"
                    >
                      {stakingPool === pool.id ? '处理中...' : 'Unstake'}
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <input
                      type="number"
                      placeholder="LP 数量"
                      value={stakeAmount[pool.id] || ''}
                      onChange={(e) => setStakeAmount((prev) => ({ ...prev, [pool.id]: e.target.value }))}
                      className="flex-1 px-3 py-2 rounded-md border-2 border-[var(--cc-demo-border)] bg-[var(--cc-demo-surface-darker)] text-[var(--cc-on-primary,#fff)] text-[var(--cc-text-xs)] outline-none"
                    />
                    <button
                      onClick={() => handleStake(pool.id)}
                      disabled={stakingPool === pool.id || !stakeAmount[pool.id]}
                      className={`px-4 py-2 rounded-md border-none bg-[var(--cc-demo-accent)] text-[var(--cc-on-primary,#fff)] cursor-pointer text-[var(--cc-text-xs)] ${
                        !stakeAmount[pool.id] ? 'opacity-50' : 'opacity-100'
                      }`}
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
          <div className="bg-[var(--cc-demo-surface-dark)] rounded-xl p-6">
            {/* From */}
            <div className="mb-4">
              <label className="block text-[var(--cc-text-xs)] text-[var(--cc-demo-text-light)] mb-2">从</label>
              <div className="flex gap-2">
                <select
                  value={swapFrom}
                  onChange={(e) => setSwapFrom(e.target.value)}
                  className="px-3 py-2 rounded-md border-0 border-[#333] bg-[var(--cc-demo-surface-darker)] text-[var(--cc-on-primary,#fff)] text-[var(--cc-text-sm)] outline-none"
                >
                  {SWAP_TOKENS.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
                <input
                  type="number"
                  step="0.001"
                  placeholder="0.0"
                  value={swapAmount}
                  onChange={(e) => setSwapAmount(e.target.value)}
                  className="flex-1 px-3 py-2 rounded-md border-2 border-[var(--cc-demo-border)] bg-[var(--cc-demo-surface-darker)] text-[var(--cc-on-primary,#fff)] text-[var(--cc-text-sm)] outline-none"
                />
              </div>
            </div>

            {/* Swap direction */}
            <div className="text-center my-2">
              <button
                onClick={() => { setSwapFrom(swapTo); setSwapTo(swapFrom); }}
                className="px-3 py-1 rounded-full border-0 border-[#333] bg-transparent text-[var(--cc-on-primary,#fff)] cursor-pointer text-[var(--cc-text-md)]"
              >
                ⇅
              </button>
            </div>

            {/* To */}
            <div className="mb-4">
              <label className="block text-[var(--cc-text-xs)] text-[var(--cc-demo-text-light)] mb-2">到</label>
              <div className="flex gap-2">
                <select
                  value={swapTo}
                  onChange={(e) => setSwapTo(e.target.value)}
                  className="px-3 py-2 rounded-md border-0 border-[#333] bg-[var(--cc-demo-surface-darker)] text-[var(--cc-on-primary,#fff)] text-[var(--cc-text-sm)] outline-none"
                >
                  {SWAP_TOKENS.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
                <div className={`flex-1 px-3 py-2 rounded-md bg-[var(--cc-demo-surface-darker)] text-[var(--cc-text-sm)] flex items-center ${
                  estimatedReceive ? 'text-[#4ade80]' : 'text-[#555]'
                }`}>
                  {estimatedReceive || '0.0'}
                </div>
              </div>
            </div>

            {/* Rate info */}
            {swapAmount && (
              <div className="bg-[var(--cc-demo-surface-darker)] rounded-lg p-3 mb-4 text-xs text-[var(--cc-demo-text-muted)]">
                1 {swapFrom} = {mockRate} {swapTo} · 滑点 0.5%
              </div>
            )}

            <button
              onClick={handleSwap}
              disabled={!swapAmount}
              className={`w-full py-3 px-6 rounded-lg border-none text-[var(--cc-text-md)] font-semibold ${
                swapAmount ? 'bg-[#6366f1] cursor-pointer' : 'bg-[#333] cursor-not-allowed'
              } text-[var(--cc-on-primary,#fff)]`}
            >
              Swap
            </button>

            {swapResult && (
              <div className="mt-4 p-3 bg-[rgba(74,222,128,0.06)] rounded-lg text-[var(--cc-demo-success)] text-[var(--cc-text-sm)] text-center flex items-center justify-center gap-2">
                <CheckCircle2 className="w-4 h-4" /> {swapResult}
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
