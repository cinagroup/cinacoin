'use client';
import { useState, useCallback } from 'react';
import type { WalletState } from '@/types';
import { MOCK_WALLET_ADDRESS } from '@/lib/constants';

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
      address: MOCK_WALLET_ADDRESS,
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
