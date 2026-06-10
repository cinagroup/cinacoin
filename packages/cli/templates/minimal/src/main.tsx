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
        ],
        metadata: {
          name: 'Cinacoin Minimal App',
          description: 'Built with Cinacoin',
          url: 'https://example.com',
        },
      }}
    >
      <App />
    </CinacoinProvider>
  </React.StrictMode>
);
