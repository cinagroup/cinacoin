import React from 'react'
import { useDemo } from '../hooks/useDemo'
import { AddressDisplay } from './AddressDisplay'

export function DemoDeFi() {
  const { isConnected, address, connect } = useDemo()

  // Mock DeFi data
  const mockPools = [
    {
      name: 'ETH Liquidity',
      apy: '4.2%',
      tvl: '$12.5M',
      token: 'ETH',
      risk: 'Low',
    },
    {
      name: 'USDC Staking',
      apy: '6.8%',
      tvl: '$45.2M',
      token: 'USDC',
      risk: 'Medium',
    },
    {
      name: 'ETH/USDC Pair',
      apy: '8.4%',
      tvl: '$28.3M',
      token: 'LP',
      risk: 'Medium-High',
    },
    {
      name: 'SOL Staking',
      apy: '7.2%',
      tvl: '$8.9M',
      token: 'SOL',
      risk: 'Medium',
    },
  ]

  return (
    <div className="cc-card p-6">
      <h3 className="cc-subtitle mb-6">DeFi 交互演示</h3>

      {!isConnected ? (
        <div className="text-center py-8">
          <p className="cc-body text-[var(--cc-body)] mb-4">
            连接钱包后可查看 DeFi 池子和收益。
          </p>
          <button onClick={connect} className="cc-btn-primary">
            连接钱包
          </button>
        </div>
      ) : (
        <>
          <div className="mb-6 p-4 bg-[var(--cc-canvas-soft)] rounded-lg">
            <p className="cc-body-xs text-[var(--cc-body)] mb-1">您的地址</p>
            <AddressDisplay address={address!} />
            <div className="flex gap-4 mt-3">
              <div>
                <p className="text-[var(--cc-body)] text-[12px]">总 TVL (模拟)</p>
                <p className="cc-title-sm">$89.8M</p>
              </div>
              <div>
                <p className="text-[var(--cc-body)] text-[12px]">您的收益 (24h)</p>
                <p className="cc-title-sm text-[var(--cc-success)]">+0.12 ETH</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <button
              onClick={() => alert('模拟：存入资金')}
              className="cc-btn-primary"
            >
              存入资金
            </button>
            <button
              onClick={() => alert('模拟：提取资金')}
              className="cc-btn-secondary"
            >
              提取资金
            </button>
          </div>

          <h4 className="cc-body mb-3">可用流动性池</h4>
          <div className="space-y-3">
            {mockPools.map((pool) => (
              <div key={pool.name} className="cc-card p-4 flex items-center justify-between">
                <div>
                  <h5 className="cc-body font-medium">{pool.name}</h5>
                  <p className="cc-body-xs text-[var(--cc-body)]">
                    {pool.token} • {pool.tvl} TVL
                  </p>
                </div>
                <div className="text-right">
                  <div className="cc-title-sm text-[var(--cc-success)]">
                    {pool.apy} APY
                  </div>
                  <span className={`inline-block px-2 py-0.5 rounded text-[10px]
                    ${pool.risk === 'Low' ? 'bg-[var(--cc-success)/20] text-[var(--cc-success)]' :
                      pool.risk === 'Medium' ? 'bg-[var(--cc-accent)/20] text-[var(--cc-accent)]' :
                      'bg-[var(--cc-danger)/20] text-[var(--cc-danger)]'}`}>
                    {pool.risk}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 p-4 bg-[var(--cc-warning)/10] rounded-lg text-center">
            <p className="cc-body-sm text-[var(--cc-body)]">
              ⚠️ 此 DeFi 数据为演示模拟，实际数据需连接 RPC + Subgraph
            </p>
          </div>
        </>
      )}
    </div>
  )
}
