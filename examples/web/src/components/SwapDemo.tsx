import { useState } from 'react'
import { useOnChainUX } from '@onchainux/react'

interface TokenInfo {
  address: string
  symbol: string
  name: string
  decimals: number
  icon: string
}

const SUPPORTED_TOKENS: TokenInfo[] = [
  {
    address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
    symbol: 'WETH',
    name: 'Wrapped Ether',
    decimals: 18,
    icon: '🔷',
  },
  {
    address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
    symbol: 'USDC',
    name: 'USD Coin',
    decimals: 6,
    icon: '💵',
  },
  {
    address: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
    symbol: 'USDT',
    name: 'Tether USD',
    decimals: 6,
    icon: '💲',
  },
  {
    address: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
    symbol: 'DAI',
    name: 'Dai Stablecoin',
    decimals: 18,
    icon: '🟡',
  },
]

export function SwapDemo() {
  const { account, signTransaction } = useOnChainUX()
  const [fromToken, setFromToken] = useState<TokenInfo>(SUPPORTED_TOKENS[0])
  const [toToken, setToToken] = useState<TokenInfo>(SUPPORTED_TOKENS[1])
  const [fromAmount, setFromAmount] = useState('')
  const [slippage, setSlippage] = useState(50) // 0.5% = 50 bps
  const [quote, setQuote] = useState<{
    toAmount: string
    priceImpact: string
    gasEstimate: string
    provider: string
  } | null>(null)
  const [loading, setLoading] = useState(false)

  const handleGetQuote = async () => {
    if (!account || !fromAmount) return
    setLoading(true)

    // 模拟获取报价（实际应调用 Swap 聚合 API）
    await new Promise((r) => setTimeout(r, 800))
    const numericAmount = parseFloat(fromAmount) || 0
    setQuote({
      toAmount: (numericAmount * 3000).toFixed(2),
      priceImpact: '0.12%',
      gasEstimate: '~0.003 ETH',
      provider: 'Uniswap V3',
    })
    setLoading(false)
  }

  const handleSwap = async () => {
    if (!account || !quote) return
    // 实际执行 swap 交易
    console.log('Executing swap...', {
      fromToken,
      toToken,
      fromAmount,
      slippage,
    })
    alert('Swap 已提交！实际环境中这将发送链上交易。')
  }

  const swapTokens = () => {
    const temp = fromToken
    setFromToken(toToken)
    setToToken(temp)
    setFromAmount('')
    setQuote(null)
  }

  return (
    <div className="swap-demo">
      <div className="demo-card swap-card">
        {/* From */}
        <div className="swap-input-group">
          <label>From</label>
          <div className="swap-input-row">
            <input
              type="number"
              value={fromAmount}
              onChange={(e) => setFromAmount(e.target.value)}
              placeholder="0.0"
              className="swap-amount-input"
            />
            <select
              value={fromToken.address}
              onChange={(e) => {
                const token = SUPPORTED_TOKENS.find(
                  (t) => t.address === e.target.value
                )
                if (token) setFromToken(token)
              }}
              className="swap-token-select"
            >
              {SUPPORTED_TOKENS.map((t) => (
                <option key={t.address} value={t.address}>
                  {t.icon} {t.symbol}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Swap button */}
        <button className="swap-arrow-btn" onClick={swapTokens}>
          ⬇️
        </button>

        {/* To */}
        <div className="swap-input-group">
          <label>To (estimated)</label>
          <div className="swap-input-row">
            <input
              type="text"
              value={quote?.toAmount || ''}
              placeholder="0.0"
              readOnly
              className="swap-amount-input"
            />
            <select
              value={toToken.address}
              onChange={(e) => {
                const token = SUPPORTED_TOKENS.find(
                  (t) => t.address === e.target.value
                )
                if (token) setToToken(token)
              }}
              className="swap-token-select"
            >
              {SUPPORTED_TOKENS.map((t) => (
                <option key={t.address} value={t.address}>
                  {t.icon} {t.symbol}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Slippage */}
        <div className="slippage-setting">
          <label>Slippage Tolerance</label>
          <div className="slippage-buttons">
            {[10, 50, 100].map((bps) => (
              <button
                key={bps}
                className={`slippage-btn ${slippage === bps ? 'active' : ''}`}
                onClick={() => setSlippage(bps)}
              >
                {(bps / 100).toFixed(1)}%
              </button>
            ))}
          </div>
        </div>

        {/* Quote */}
        {quote && (
          <div className="quote-details">
            <div className="quote-row">
              <span>Provider</span>
              <span>{quote.provider}</span>
            </div>
            <div className="quote-row">
              <span>Price Impact</span>
              <span>{quote.priceImpact}</span>
            </div>
            <div className="quote-row">
              <span>Estimated Gas</span>
              <span>{quote.gasEstimate}</span>
            </div>
            <div className="quote-row">
              <span>Minimum Received</span>
              <span>
                {(
                  parseFloat(quote.toAmount) *
                  (1 - slippage / 10000)
                ).toFixed(2)}{' '}
                {toToken.symbol}
              </span>
            </div>
          </div>
        )}

        {/* Actions */}
        {!account ? (
          <button className="btn btn-primary" disabled>
            请先连接钱包
          </button>
        ) : (
          <button
            className="btn btn-primary"
            onClick={quote ? handleSwap : handleGetQuote}
            disabled={loading || !fromAmount}
          >
            {loading
              ? '获取报价中...'
              : quote
                ? `Swap ${fromAmount} ${fromToken.symbol}`
                : '获取报价'}
          </button>
        )}
      </div>
    </div>
  )
}
