'use client';

import React from 'react';
import type { CinacoinConfig } from '@cinacoin/react';
import { CinacoinProvider } from '@cinacoin/react';

const projectId = process.env.NEXT_PUBLIC_PROJECT_ID ?? 'demo_project_id';

const config: CinacoinConfig = {
  projectId,
  metadata: {
    name: 'Cinacoin Demo dApp',
    description: 'A comprehensive demo showcasing the full Cinacoin SDK',
    url: 'https://cinacoin.dev',
    icons: ['https://cinacoin.dev/icon.png'],
  },
  chains: [
    {
      id: 11155111,
      name: 'Sepolia',
      rpcUrl: 'https://rpc.sepolia.org',
      nativeCurrency: { name: 'Sepolia ETH', symbol: 'ETH', decimals: 18 },
      blockExplorerUrl: 'https://sepolia.etherscan.io',
      testnet: true,
    },
    {
      id: 80002,
      name: 'Amoy',
      rpcUrl: 'https://rpc-amoy.polygon.technology',
      nativeCurrency: { name: 'Polygon MATIC', symbol: 'MATIC', decimals: 18 },
      blockExplorerUrl: 'https://amoy.polygonscan.com',
      testnet: true,
    },
    {
      id: 1,
      name: 'Ethereum',
      rpcUrl: 'https://cloudflare-eth.com',
      nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
      blockExplorerUrl: 'https://etherscan.io',
    },
  ],
  theme: {
    mode: 'dark',
  },
};

export default function CinacoinClientProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return <CinacoinProvider config={config}>{children}</CinacoinProvider>;
}
