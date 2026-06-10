import React from 'react';
import { createRoot } from 'react-dom/client';
import { CinacoinProvider } from '@cinacoin/react';
import App from './App';

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('Root element not found');

const root = createRoot(rootElement);
root.render(
  <React.StrictMode>
    <CinacoinProvider
      config={{
        chains: [
          {
            id: 1,
            name: 'Ethereum',
            rpcUrl: 'https://eth.llamarpc.com',
            nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
          },
          {
            id: 137,
            name: 'Polygon',
            rpcUrl: 'https://polygon-rpc.com',
            nativeCurrency: { name: 'MATIC', symbol: 'MATIC', decimals: 18 },
          },
          {
            id: 42161,
            name: 'Arbitrum',
            rpcUrl: 'https://arb1.arbitrum.io/rpc',
            nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
          },
        ],
        theme: {
          mode: 'dark',
          accentColor: '#6366f1',
        },
        metadata: {
          name: 'Cinacoin Wallet',
          description: 'Full-featured wallet UI',
          url: 'https://example.com',
        },
      }}
    >
      <App />
    </CinacoinProvider>
  </React.StrictMode>
);
