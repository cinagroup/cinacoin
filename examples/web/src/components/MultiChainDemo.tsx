import { useState } from 'react'
import { useOnChainUX, ChainSwitcher } from '@onchainux/react'

interface ChainBalance {
  chainId: number
  name: string
  symbol: string
  balance: string
  usdValue: string
  icon: string
}

const DEMO_BALANCES: ChainBalance[] = [
  { chainId: 1, name: 'Ethereum', symbol: 'ETH', balance: '1.2345', usdValue: '$3,703.50', icon: '🔷' },
  { chainId: 137, name: 'Polygon', symbol: 'MATIC', balance: '500.00', usdValue: '$450.00', icon: '🟣' },
  { chainId: 42161, name: 'Arbitrum', symbol: 'ETH', balance: '0.5000', usdValue: '$1,500.00', icon: '🔵' },
]

export function MultiChainDemo() {
  const { account, chainId, switchChain } = useOnChainUX()
  const [selectedChain, setSelectedChain] = useState(1)

  const chains = DEMO_BALANCES.map((c) => ({
    id: c.chainId,
    name: c.name,
    nativeCurrency: { name: c.name, symbol: c.symbol, decimals: 18 },
    rpcUrl: '',
  }))

  const currentBalance = DEMO_BALANCES.find((c) => c.chainId === selectedChain)

  return (
    <div className="multichain-demo">
      <div className="demo-card">
        <h3>ChainSwitcher</h3>
        <ChainSwitcher
          chains={chains}
          activeChainId={selectedChain}
          onChainChange={(id) => {
            setSelectedChain(id)
            switchChain(id)
          }}
        />
      </div>

      <div className="demo-card">
        <h3>跨链资产总览</h3>
        {account ? (
          <>
            <div className="total-balance">
              <span className="total-label">总资产估值</span>
              <span className="total-value">$5,653.50</span>
            </div>
            <div className="chain-balances">
              {DEMO_BALANCES.map((chain) => (
                <div
                  key={chain.chainId}
                  className={`chain-balance ${chain.chainId === selectedChain ? 'active' : ''}`}
                  onClick={() => {
                    setSelectedChain(chain.chainId)
                    switchChain(chain.chainId)
                  }}
                >
                  <div className="chain-icon">{chain.icon}</div>
                  <div className="chain-info">
                    <div className="chain-name">{chain.name}</div>
                    <div className="chain-amount">
                      {chain.balance} {chain.symbol}
                    </div>
                  </div>
                  <div className="chain-usd">{chain.usdValue}</div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <p className="no-account">请先连接钱包查看资产</p>
        )}
      </div>

      <div className="demo-card">
        <h3>网络信息</h3>
        {currentBalance && (
          <div className="network-info">
            <div className="info-row">
              <span>当前网络</span>
              <span>
                {currentBalance.icon} {currentBalance.name}
              </span>
            </div>
            <div className="info-row">
              <span>Chain ID</span>
              <span>{currentBalance.chainId}</span>
            </div>
            <div className="info-row">
              <span>原生币种</span>
              <span>{currentBalance.symbol}</span>
            </div>
            <div className="info-row">
              <span>余额</span>
              <span>
                {currentBalance.balance} {currentBalance.symbol} ({currentBalance.usdValue})
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
