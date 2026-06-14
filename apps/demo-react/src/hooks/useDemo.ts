import { useState, useEffect, useCallback, useRef } from 'react'
import { useWallet } from './useWallet'
import { useChainInfo } from './useChainInfo'
import type { Chain } from '@cinacoin/core-sdk'

// ============================================================================
// Types
// ============================================================================

export interface Transaction {
  hash: string
  from: string
  to: string
  value: string
  timestamp: number
  chainId: number
  status: 'pending' | 'success' | 'failed'
}

export interface DemoState {
  isCinacoined: boolean
  address: string | null
  balance: string
  chain: Chain | null
  transactions: Transaction[]
  charges: number
}

// ============================================================================
// Demo Hook
// ============================================================================

export function useDemo() {
  const { address, isConnected, chainId, disconnect } = useWallet()
  const chainInfoResult = useChainInfo(chainId, address)
  const chainInfo: Chain | null = chainInfoResult ? { id: `eip155:${chainInfoResult.chainId}`, name: chainInfoResult.chainName, namespace: 'eip155' } as Chain : null

  // Mock data
  const [balance, setBalance] = useState<string>('0.00')
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [charges, setCharges] = useState<number>(0)
  const [isConnecting, setIsConnecting] = useState(false)
  const mockIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // Simulate balance updates
  useEffect(() => {
    if (isConnected && address) {
      // Generate some random balances
      const randomBalance = (Math.random() * 10 + 0.1).toFixed(4)
      setBalance(randomBalance)

      // Simulate incoming transactions
      mockIntervalRef.current = setInterval(() => {
        if (Math.random() > 0.7) {
          const newTx: Transaction = {
            hash: '0x' + Array.from({ length: 64 }, () =>
              Math.floor(Math.random() * 16).toString(16)
            ).join(''),
            from: '0x' + Array.from({ length: 40 }, () =>
              Math.floor(Math.random() * 16).toString(16)
            ).join(''),
            to: address!,
            value: (Math.random() * 0.1).toFixed(6),
            timestamp: Date.now(),
            chainId: chainId!,
            status: 'success',
          }
          setTransactions(prev => [newTx, ...prev].slice(0, 10))
          setCharges(prev => prev + 1)
        }
      }, 3000)

      return () => {
        if (mockIntervalRef.current) clearInterval(mockIntervalRef.current)
      }
    }
  }, [isConnected, address, chainId])

  // Simulate a transaction
  const simulateTransaction = useCallback(async (to: string, amount: string) => {
    if (!isConnected || !address) {
      throw new Error('Wallet not connected')
    }

    const tx: Transaction = {
      hash: '0x' + Array.from({ length: 64 }, () =>
        Math.floor(Math.random() * 16).toString(16)
      ).join(''),
      from: address,
      to,
      value: amount,
      timestamp: Date.now(),
      chainId: chainId!,
      status: 'pending',
    }

    setTransactions(prev => [tx, ...prev])

    // Simulate success after delay
    setTimeout(() => {
      setTransactions(prev =>
        prev.map(t => t.hash === tx.hash ? { ...t, status: 'success' as const } : t)
      )
      setCharges(prev => prev + 1)
    }, 2000)

    return tx.hash
  }, [isConnected, address, chainId])

  // Connect wallet (with mock delay)
  const connect = useCallback(async (): Promise<boolean> => {
    setIsConnecting(true)
    try {
      // Simulate connection delay
      await new Promise(resolve => setTimeout(resolve, 500))
      return isConnected
    } finally {
      setIsConnecting(false)
    }
  }, [isConnected])

  // Disconnect wallet
  const handleDisconnect = useCallback(async () => {
    await disconnect()
    setBalance('0.00')
    setTransactions([])
    setCharges(0)
  }, [disconnect])

  // Mock sign message
  const signMessage = useCallback(async (message: string) => {
    return { signature: '0x' + Array.from({ length: 130 }, () =>
      Math.floor(Math.random() * 16).toString(16)
    ).join('') }
  }, [])

  // Mock sign typed data
  const signTypedData = useCallback(async (typedData: any) => {
    return { signature: '0x' + Array.from({ length: 130 }, () =>
      Math.floor(Math.random() * 16).toString(16)
    ).join('') }
  }, [])

  return {
    isConnected,
    isConnecting,
    address,
    balance,
    chain: chainInfo,
    transactions,
    charges,
    connect,
    disconnect: handleDisconnect,
    signMessage,
    signTypedData,
    simulateTransaction,
  }
}
