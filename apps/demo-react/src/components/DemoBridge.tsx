import React from 'react'
import { useDemo } from '../hooks/useDemo'
import { AddressDisplay } from './Others'

export function DemoBridge() {
  const { isConnected, address, connect, chain } = useDemo()

  // Mock bridge data
  const chains = [
    { id: 1, name: 'Ethereum', symbol: 'ETH', color: 'bg-[var(--cc-link)]' },
    { id: 137, name: 'Polygon', symbol: 'MATIC', color: 'bg-[var(--cc-accent)]' },
    { id: 42161, name: 'Arbitrum', symbol: 'ETH', color: 'bg-[var(--cc-primary)]' },
    { id: 43114, name: 'Avalanche', symbol: 'AVAX', color: 'bg-[var(--cc-danger)]' },
  ]

  return (
    <div className="cc-card p-6">
      <h3 className="cc-subtitle mb-6">跨链桥接演示</h3>

      {!isConnected ? (
        <div className="text-center py-8">
          <p className="cc-body text-[var(--cc-body)] mb-4">
            连接钱包后可查看跨链桥接功能。
          </p>
          <button onClick={connect} className="cc-btn-primary">
            连接钱包
          </button>
        </div>
      ) : (
        <>
          <div className="mb-6 p-4 bg-[var(--cc-canvas-soft)] rounded-lg">
            <p className="cc-body-xs text-[var(--cc-body)] mb-1">当前连接地址</p>
            <AddressDisplay address={address!} />
            {chain && (
              <div className="mt-2">
                <span className={`inline-block px-2 py-1 rounded text-caption ${chain.color}`}>
                  {chain.name} (ID: {chain.chainId})
                </span>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="space-y-3">
              <h4 className="cc-body text-[var(--cc-ink)]">源链</h4>
              <select className="cc-input w-full">
                {chains.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.symbol})
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-3">
              <h4 className="cc-body text-[var(--cc-ink)]">目标链</h4>
              <select className="cc-input w-full">
                {chains.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.symbol})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label htmlFor="金额" className="cc-label mb-2 block">金额</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  className="cc-input flex-1"
                  placeholder="0.00"
                  defaultValue="0.1"
                />
                <select id="金额" className="cc-input w-24">
                  <option value="ETH">ETH</option>
                  <option value="USDC">USDC</option>
                  <option value="USDT">USDT</option>
                </select>
              </div>
            </div>

            <div className="p-4 bg-[var(--cc-warning)/10] rounded-lg text-body-sm">
              <p className="text-[var(--cc-body)]">
                ⚠️ 模拟功能：实际跨链桥接需配置Bridge adapter
              </p>
            </div>

            <button
              onClick={() => alert('跨链桥接功能需实际部署Bridge adapter')}
              className="cc-btn-primary w-full"
            >
              模拟桥接
            </button>
          </div>
        </>
      )}
    </div>
  )
}
