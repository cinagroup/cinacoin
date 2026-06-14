'use client';

import { QueryClientProvider } from '@tanstack/react-query';
import { useEffect } from 'react';
import { WagmiProvider } from 'wagmi';

import { wagmiAdapter, queryClient, initAppKit } from '@/lib/appkit';

// Initialize AppKit once on client mount
let appKitInitialized = false;

export function WalletProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (!appKitInitialized) {
      initAppKit();
      appKitInitialized = true;
    }
  }, []);

  return (
    <WagmiProvider config={wagmiAdapter.wagmiConfig}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </WagmiProvider>
  );
}
