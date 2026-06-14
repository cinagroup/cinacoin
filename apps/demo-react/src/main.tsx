/**
 * Cinacoin Demo React — Entry Point
 *
 * Integrates Reown AppKit (via @cinacoin/appkit-config) with:
 * - WagmiProvider (wagmi v3) for EVM chain interactions
 * - QueryClientProvider for data fetching
 */
import { QueryClientProvider } from '@tanstack/react-query';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { WagmiProvider } from 'wagmi';

import App from './App';
import { wagmiConfig, queryClient } from './lib/appkit';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <BrowserRouter>
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    </WagmiProvider>
  </BrowserRouter>
);
