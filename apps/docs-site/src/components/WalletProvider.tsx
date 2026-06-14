import { QueryClientProvider } from '@tanstack/react-query';
import React, { useEffect } from 'react';
import { WagmiProvider } from 'wagmi';

import { wagmiAdapter, queryClient, initDocsAppKit } from '../lib/appkit';

let initialized = false;

export default function WalletProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (!initialized) {
      initDocsAppKit();
      initialized = true;
    }
  }, []);

  return (
    <WagmiProvider config={wagmiAdapter.wagmiConfig}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </WagmiProvider>
  );
}
