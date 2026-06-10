import React, { useState } from 'react'
import { useDemo } from '../hooks/useDemo'
import { AddressDisplay } from './AddressDisplay'

export function DemoTransfer() {
  const { isConnected, address, connect, simulateTransaction } = useDemo()
  const [to, setTo] = useState('0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266')
  const [amount, setAmount] = useState('0.001')
  const [isLoading, setIsLoading] = useState(false)
  const [resultHash, setResultHash] = useState<string | null>(null)

  const handleTransfer = async () => {
    if (!isConnected || !address) {
      connect()
      return
    }

    setIsLoading(true)
    setResultHash(null)
    try {
      const hash = await simulateTransaction(to, amount)
      setResultHash(hash)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="cc-card p-6 max-w-xl">
      <h3 className="cc-subtitle mb-4">转账演示</h3>

      {!isConnected ? (
        <div className="text-center py-8">
          <p className="cc-body text-[var(--cc-body)] mb-4">
            连接钱包后可进行转账操作。
          </p>
          <button onClick={connect} className="cc-btn-primary">
            连接钱包
          </button>
        </div>
      ) : (
        <>
          <div className="mb-4 p-4 bg-[var(--cc-canvas-soft)] rounded-lg">
            <p className="cc-body-xs text-[var(--cc-body)] mb-1">发送地址</p>
            <AddressDisplay address={address!} />
          </div>

          <div className="space-y-4">
            <div>
              <label className="cc-label mb-2 block">接收地址</label>
              <input
                type="text"
                className="cc-input"
                placeholder="0x..."
                value={to}
                onChange={(e) => setTo(e.target.value)}
              />
            </div>

            <div>
              <label className="cc-label mb-2 block">金额 (ETH)</label>
              <input
                type="number"
                step="0.001"
                className="cc-input"
                placeholder="0.001"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>

            <div className="pt-2">
              <button
                onClick={handleTransfer}
                disabled={!to || !amount || isLoading}
                className="cc-btn-primary w-full"
              >
                {isLoading ? '转账中...' : '发送交易'}
              </button>
            </div>
          </div>

          {resultHash && (
            <div className="mt-6 p-4 bg-[var(--cc-success)/10] rounded-lg">
              <p className="cc-body-xs text-[var(--cc-body)] mb-1">交易哈希</p>
              <div className="cc-mono break-all text-body-sm">
                {resultHash}
              </div>
              <p className="cc-body-xs text-[var(--cc-body)] mt-2">
                状态: <span className="text-[var(--cc-success)]">成功</span>
              </p>
            </div>
          )}
        </>
      )}
    </div>
  )
}
