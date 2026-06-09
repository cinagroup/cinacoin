'use client';
import { useState, useCallback } from 'react';

interface WalletState {
  connected: boolean;
  address: string | null;
  chain: string;
  balance: string;
  tokenBalance: string;
  txCount: number;
  firstSeen: string;
}

const initialState: WalletState = {
  connected: false,
  address: null,
  chain: 'ethereum',
  balance: '0',
  tokenBalance: '0',
  txCount: 0,
  firstSeen: '',
};

export function useWallet() {
  const [state, setState] = useState<WalletState>(initialState);

  const connect = useCallback(async () => {
    // TODO: 集成真实钱包连接（WalletConnect / MetaMask）
    // 暂时使用模拟连接
    setState({
      connected: true,
      address: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
      chain: 'ethereum',
      balance: '1,234,567.89',
      tokenBalance: '50,000.00',
      txCount: 1247,
      firstSeen: 'Jan 15, 2024',
    });
  }, []);

  const disconnect = useCallback(() => {
    setState(initialState);
  }, []);

  return { ...state, connect, disconnect };
}
