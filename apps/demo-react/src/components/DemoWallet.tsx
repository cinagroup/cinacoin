import React from 'react'
import { useDemo } from '../hooks/useDemo'
import { AddressDisplay } from './AddressDisplay'
import { ChainBadge } from './ChainBadge'
import { BalanceCard } from './BalanceCard'
import { TransactionList } from './TransactionList'
import { WalletModal } from '../components/WalletModal'

export function DemoWallet() {
  const {
    isConnected,
    isConnecting,
    address,
    balance,
    chain,
    transactions,
    connect,
    disconnect,
    simulateTransaction,
  } = useDemo()

  return (
    <div className="cc-card p-6">
      <h3 className="cc-subtitle mb-4">Demo Wallet</h3>

      {!isConnected ? (
        <div className="text-center py-8">
          <p className="cc-body text-[var(--cc-body)] mb-4">
            Connect your wallet to start interacting with the demo.
          </p>
          <WalletModal connect={connect} />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Connection Info */}
          <div className="flex flex-wrap items-center gap-4 p-4 bg-[var(--cc-canvas-soft)] rounded-lg">
            <ChainBadge chain={chain} />
            <div className="flex-1 min-w-0">
              <p className="cc-body-xs text-[var(--cc-body)] mb-1">Your Address</p>
              <AddressDisplay address={address!} truncate />
            </div>
            <button
              onClick={disconnect}
              className="cc-btn-secondary-sm"
              disabled={isConnecting}
            >
              {isConnecting ? 'Connecting...' : 'Disconnect'}
            </button>
          </div>

          {/* Balance */}
          <BalanceCard balance={balance} chain={chain} />

          {/* Quick Actions */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => simulateTransaction(
                '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
                '0.001'
              )}
              className="cc-btn-primary-sm"
            >
              Send 0.001 ETH
            </button>
            <button
              onClick={() => simulateTransaction(
                '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
                '0.005'
              )}
              className="cc-btn-secondary-sm"
            >
              Send 0.005 ETH
            </button>
          </div>

          {/* Recent Transactions */}
          <TransactionList transactions={transactions} />
        </div>
      )}
    </div>
  )
}
